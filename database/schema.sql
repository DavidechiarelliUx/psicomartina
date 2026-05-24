-- Schema PostgreSQL per psicomartina.
-- Copre dashboard, prenotazioni, messaggi, servizi, testimonianze e blog.

create extension if not exists pgcrypto;

do $$ begin
  create type appointment_status as enum ('pending', 'confirmed', 'cancelled', 'completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type contact_status as enum ('new', 'read', 'replied', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type service_type as enum ('primo_colloquio', 'ansia', 'relazioni', 'autostima', 'traumi');
exception when duplicate_object then null; end $$;

-- Anagrafica minima dei clienti/contatti che prenotano o scrivono dal sito.
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Catalogo dei servizi offerti, usato da sito pubblico, form e dashboard.
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  code service_type not null unique,
  title text not null,
  subtitle text,
  description text not null,
  display_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Punti/benefici associati ai servizi, per descrizioni strutturate.
create table if not exists service_benefits (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services(id) on delete cascade,
  benefit text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Appuntamenti e richieste di prenotazione, fonte dei KPI e del calendario dashboard.
create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id),
  service_id uuid references services(id),
  service_type service_type not null default 'primo_colloquio',
  scheduled_date date not null,
  time_slot text not null,
  status appointment_status not null default 'pending',
  notes text,
  privacy_accepted boolean not null default false,
  source text not null default 'website',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Messaggi inviati dal form contatti; alimentano le notifiche "Nuovi messaggi".
create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id),
  service_id uuid references services(id),
  name text not null,
  email text not null,
  phone text,
  message text not null,
  status contact_status not null default 'new',
  privacy_accepted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Testimonianze pubbliche visualizzate nella homepage.
create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  text text not null,
  rating integer not null default 5 check (rating between 1 and 5),
  avatar_url text,
  visible boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Articoli blog pubblicati sul sito.
create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references services(id),
  title text not null,
  slug text not null unique,
  excerpt text not null,
  content text not null,
  category service_type,
  cover_image text,
  cover_image_public_id text,
  published boolean not null default true,
  reading_time integer,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_clients_email on clients(email);
create index if not exists idx_clients_deleted_at on clients(deleted_at);
create index if not exists idx_services_active_order on services(active, display_order);
create index if not exists idx_services_deleted_at on services(deleted_at);
create index if not exists idx_service_benefits_service_order on service_benefits(service_id, display_order);
create index if not exists idx_appointments_scheduled_slot on appointments(scheduled_date, time_slot);
create index if not exists idx_appointments_status_date on appointments(status, scheduled_date);
create index if not exists idx_appointments_service_type on appointments(service_type);
create index if not exists idx_appointments_client_id on appointments(client_id);
create index if not exists idx_appointments_deleted_at on appointments(deleted_at);
create index if not exists idx_contact_messages_status_created on contact_messages(status, created_at);
create index if not exists idx_contact_messages_email on contact_messages(email);
create index if not exists idx_contact_messages_deleted_at on contact_messages(deleted_at);
create index if not exists idx_testimonials_visible_order on testimonials(visible, display_order);
create index if not exists idx_testimonials_deleted_at on testimonials(deleted_at);
create index if not exists idx_blog_posts_published_at on blog_posts(published, published_at);
create index if not exists idx_blog_posts_category on blog_posts(category);
create index if not exists idx_blog_posts_deleted_at on blog_posts(deleted_at);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_clients_updated_at on clients;
create trigger trg_clients_updated_at before update on clients for each row execute function set_updated_at();
drop trigger if exists trg_services_updated_at on services;
create trigger trg_services_updated_at before update on services for each row execute function set_updated_at();
drop trigger if exists trg_appointments_updated_at on appointments;
create trigger trg_appointments_updated_at before update on appointments for each row execute function set_updated_at();
drop trigger if exists trg_contact_messages_updated_at on contact_messages;
create trigger trg_contact_messages_updated_at before update on contact_messages for each row execute function set_updated_at();
drop trigger if exists trg_testimonials_updated_at on testimonials;
create trigger trg_testimonials_updated_at before update on testimonials for each row execute function set_updated_at();
drop trigger if exists trg_blog_posts_updated_at on blog_posts;
create trigger trg_blog_posts_updated_at before update on blog_posts for each row execute function set_updated_at();

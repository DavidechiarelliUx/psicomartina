# Database Report - psicomartina

## Connessione locale

- Motore: PostgreSQL 17
- Host: `localhost`
- Porta: `55433`
- Database: `psicomartina`
- Utente: `psicomartina`
- Password sviluppo: `psicomartina`
- URL applicazione: `DATABASE_URL="postgresql://psicomartina:psicomartina@localhost:55433/psicomartina?schema=public"`

Il progetto DBeaver separato e' stato creato in:

`~/Library/DBeaverData/workspace6/psicomartina`

La vecchia connessione che usava ruolo `giovinazzo` e porta `55432` non e' quella da usare per questo progetto.

## Tabelle principali

- `clients`: anagrafica dei clienti/contatti; campi principali `id`, `full_name`, `email`, `phone`, `notes`, audit e soft delete.
- `services`: catalogo servizi; campi principali `code`, `title`, `subtitle`, `description`, `display_order`, `active`.
- `service_benefits`: punti descrittivi dei servizi, collegati a `services`.
- `appointments`: prenotazioni e richieste appuntamento; campi principali `client_id`, `service_id`, `service_type`, `scheduled_date`, `time_slot`, `status`, `notes`, `privacy_accepted`.
- `contact_messages`: messaggi dal form; campi principali `client_id`, `service_id`, `name`, `email`, `phone`, `message`, `status`, `privacy_accepted`.
- `testimonials`: testimonianze pubbliche; campi principali `name`, `text`, `rating`, `visible`, `display_order`.
- `blog_posts`: articoli blog; campi principali `service_id`, `title`, `slug`, `excerpt`, `content`, `category`, `cover_image`, `published`, `reading_time`, `published_at`.

## Relazioni

- `clients` 1:N `appointments`
- `clients` 1:N `contact_messages`
- `services` 1:N `appointments`
- `services` 1:N `contact_messages`
- `services` 1:N `service_benefits`
- `services` 1:N `blog_posts`

## Mappa dashboard -> database

- KPI "Questa settimana": `appointments.scheduled_date`
- KPI "Questo mese": `appointments.scheduled_date`
- KPI "In attesa": `appointments.status = 'pending'`
- KPI "Nuovi contatti": `contact_messages.status = 'new'`
- Grafico andamento prenotazioni: `appointments.scheduled_date`, `appointments.status`
- Grafico distribuzione servizi: `appointments.service_type`, `services.title`
- Notifiche prossimi appuntamenti: `appointments` + `clients` + `services`
- Notifiche nuovi messaggi: `contact_messages`
- Calendario appuntamenti: `appointments.scheduled_date`, `time_slot`, `status`, `clients.full_name`

## File generati

- Schema SQL: `database/schema.sql`
- Seed SQL: `database/seed.sql`
- Prisma schema: `prisma/schema.prisma`
- Migration iniziale: `prisma/migrations/20260518224056_init/migration.sql`
- Migration default audit: `prisma/migrations/20260518224140_updated_at_defaults/migration.sql`
- Server API: `server/index.js`
- Helper frontend API: `src/api/client.js`
- Avvio DB locale: `database/start-postgres.sh`
- Stop DB locale: `database/stop-postgres.sh`

## Comandi utili

Avviare PostgreSQL locale:

```bash
./database/start-postgres.sh
```

Fermare PostgreSQL locale:

```bash
./database/stop-postgres.sh
```

Applicare migration Prisma:

```bash
npx prisma migrate dev
```

Rigenerare Prisma Client:

```bash
npx prisma generate
```

Ricaricare i seed:

```bash
/Library/PostgreSQL/17/bin/psql -h localhost -p 55433 -U psicomartina -d psicomartina -f database/seed.sql
```

Avviare app + API:

```bash
npm run dev
```

## Verifica eseguita

- Migration Prisma applicate correttamente.
- Seed caricato: 12 clienti, 5 servizi, 10 benefit, 12 appuntamenti, 10 messaggi, 10 testimonianze, 10 articoli.
- API `/api/health` risponde `ok`.
- API `/api/dashboard` restituisce appuntamenti e messaggi dal database.
- Build Vite completata con successo.
- Dashboard verificata nel browser su `http://127.0.0.1:5173/dashboard` senza errori console.

## TODO

- Aggiungere autenticazione vera alla dashboard prima della pubblicazione.
- Valutare code splitting per ridurre il bundle frontend segnalato da Vite.
- Se il sito andra' online, spostare credenziali e database su un provider gestito e non usare il database locale.

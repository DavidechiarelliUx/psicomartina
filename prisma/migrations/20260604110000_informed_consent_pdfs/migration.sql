CREATE TABLE IF NOT EXISTS "informed_consents" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "appointment_id" UUID NOT NULL,
  "client_id" UUID NOT NULL,
  "subject_type" TEXT NOT NULL DEFAULT 'adult',
  "client_full_name" TEXT NOT NULL,
  "client_email" TEXT NOT NULL,
  "phone" TEXT,
  "fiscal_code" TEXT,
  "birth_place" TEXT,
  "birth_date" DATE,
  "residence_city" TEXT,
  "residence_address" TEXT,
  "residence_number" TEXT,
  "service_kind" TEXT NOT NULL DEFAULT 'consulenza',
  "service_other" TEXT,
  "minor_full_name" TEXT,
  "tutor_full_name" TEXT,
  "second_tutor_full_name" TEXT,
  "privacy_consent" BOOLEAN NOT NULL DEFAULT true,
  "terms_accepted" BOOLEAN NOT NULL DEFAULT true,
  "signed_name" TEXT NOT NULL,
  "pdf_url" TEXT NOT NULL,
  "pdf_public_id" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMPTZ(6),
  CONSTRAINT "informed_consents_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "informed_consents_appointment_id_key" UNIQUE ("appointment_id")
);

CREATE INDEX IF NOT EXISTS "informed_consents_client_full_name_idx" ON "informed_consents" ("client_full_name");
CREATE INDEX IF NOT EXISTS "informed_consents_client_email_idx" ON "informed_consents" ("client_email");
CREATE INDEX IF NOT EXISTS "informed_consents_fiscal_code_idx" ON "informed_consents" ("fiscal_code");
CREATE INDEX IF NOT EXISTS "informed_consents_created_at_idx" ON "informed_consents" ("created_at");
CREATE INDEX IF NOT EXISTS "informed_consents_deleted_at_idx" ON "informed_consents" ("deleted_at");

ALTER TABLE "informed_consents"
  ADD CONSTRAINT "informed_consents_appointment_id_fkey"
  FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "informed_consents"
  ADD CONSTRAINT "informed_consents_client_id_fkey"
  FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

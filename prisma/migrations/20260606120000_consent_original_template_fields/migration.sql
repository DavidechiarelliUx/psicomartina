ALTER TABLE "informed_consents"
  ADD COLUMN IF NOT EXISTS "compensation_amount" TEXT NOT NULL DEFAULT '45',
  ADD COLUMN IF NOT EXISTS "tax_regime" TEXT,
  ADD COLUMN IF NOT EXISTS "payment_method" TEXT,
  ADD COLUMN IF NOT EXISTS "signature_box" TEXT NOT NULL DEFAULT 'adult',
  ADD COLUMN IF NOT EXISTS "personal_data_consent_choice" TEXT NOT NULL DEFAULT 'granted';

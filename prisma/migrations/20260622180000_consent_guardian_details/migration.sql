-- Dati anagrafici completi di genitori/tutore nel consenso (per minori e tutele)
ALTER TABLE "informed_consents"
  ADD COLUMN IF NOT EXISTS "tutor_birth_place" TEXT,
  ADD COLUMN IF NOT EXISTS "tutor_birth_date" DATE,
  ADD COLUMN IF NOT EXISTS "tutor_residence_city" TEXT,
  ADD COLUMN IF NOT EXISTS "tutor_residence_address" TEXT,
  ADD COLUMN IF NOT EXISTS "tutor_residence_number" TEXT,
  ADD COLUMN IF NOT EXISTS "second_tutor_birth_place" TEXT,
  ADD COLUMN IF NOT EXISTS "second_tutor_birth_date" DATE,
  ADD COLUMN IF NOT EXISTS "second_tutor_residence_city" TEXT,
  ADD COLUMN IF NOT EXISTS "second_tutor_residence_address" TEXT,
  ADD COLUMN IF NOT EXISTS "second_tutor_residence_number" TEXT;

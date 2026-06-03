ALTER TABLE "appointments"
ADD COLUMN IF NOT EXISTS "informed_consent_accepted" BOOLEAN NOT NULL DEFAULT false;

UPDATE "appointments"
SET "informed_consent_accepted" = true
WHERE "privacy_accepted" = true;

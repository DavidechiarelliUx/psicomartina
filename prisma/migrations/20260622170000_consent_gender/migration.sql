-- Sesso indicato nel consenso (per desinenza Nato/Nata). Nullable: "non specificare".
ALTER TABLE "informed_consents" ADD COLUMN IF NOT EXISTS "gender" TEXT;

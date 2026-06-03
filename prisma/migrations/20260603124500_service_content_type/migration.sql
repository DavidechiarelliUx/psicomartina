ALTER TABLE "services"
ADD COLUMN IF NOT EXISTS "content_type" TEXT NOT NULL DEFAULT 'servizio';

ALTER TABLE "services"
ADD CONSTRAINT "services_content_type_check"
CHECK ("content_type" IN ('servizio', 'ambito')) NOT VALID;

UPDATE "services"
SET "content_type" = CASE
  WHEN "code" IN ('ansia', 'eta_evolutiva', 'genitorialita') THEN 'ambito'
  ELSE 'servizio'
END;

ALTER TABLE "services"
VALIDATE CONSTRAINT "services_content_type_check";

DROP INDEX IF EXISTS "services_active_display_order_idx";
CREATE INDEX IF NOT EXISTS "services_active_content_type_display_order_idx"
ON "services" ("active", "content_type", "display_order");

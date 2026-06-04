ALTER TABLE "appointments"
  ADD COLUMN IF NOT EXISTS "confirmation_email_sent" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "confirmation_email_sent_at" TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS "confirmation_email_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "review_request_sent" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "review_request_sent_at" TIMESTAMPTZ(6),
  ADD COLUMN IF NOT EXISTS "review_request_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "review_token" UUID NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS "appointments_review_token_key" ON "appointments" ("review_token");
CREATE INDEX IF NOT EXISTS "appointments_review_token_idx" ON "appointments" ("review_token");

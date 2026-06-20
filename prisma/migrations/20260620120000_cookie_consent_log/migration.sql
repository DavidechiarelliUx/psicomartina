-- Registro dei consensi ai cookie (prova del consenso, GDPR)
CREATE TABLE IF NOT EXISTS "cookie_consent_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "choice" TEXT NOT NULL,
    "analytics" BOOLEAN NOT NULL DEFAULT false,
    "policy_version" INTEGER NOT NULL DEFAULT 1,
    "user_agent" TEXT,
    "ip_hash" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cookie_consent_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "cookie_consent_logs_created_at_idx" ON "cookie_consent_logs"("created_at");

-- Chiusure straordinarie (giorni specifici chiusi, valide per tutte le sedi)
CREATE TABLE IF NOT EXISTS "booking_closures" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "date" DATE NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "booking_closures_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "booking_closures_date_key" ON "booking_closures"("date");

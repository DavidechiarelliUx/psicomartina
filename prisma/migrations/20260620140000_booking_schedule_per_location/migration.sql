-- Orari di prenotazione per sede
ALTER TABLE "booking_schedules" ADD COLUMN IF NOT EXISTS "location" TEXT NOT NULL DEFAULT 'sede1';

-- Rimuove l'unicità sul solo giorno (il constraint porta con sé il suo indice)
ALTER TABLE "booking_schedules" DROP CONSTRAINT IF EXISTS "booking_schedules_day_of_week_key";
DROP INDEX IF EXISTS "booking_schedules_day_of_week_idx";

-- Nuova unicità e indice su (sede, giorno)
CREATE UNIQUE INDEX IF NOT EXISTS "booking_schedules_location_day_of_week_key" ON "booking_schedules"("location", "day_of_week");
CREATE INDEX IF NOT EXISTS "booking_schedules_location_day_of_week_idx" ON "booking_schedules"("location", "day_of_week");

-- Sede dell'appuntamento
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "location" TEXT;

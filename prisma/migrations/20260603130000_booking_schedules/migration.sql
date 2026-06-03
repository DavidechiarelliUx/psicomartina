CREATE TABLE IF NOT EXISTS "booking_schedules" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "day_of_week" INTEGER NOT NULL,
  "is_open" BOOLEAN NOT NULL DEFAULT true,
  "opens_at" TEXT NOT NULL DEFAULT '09:00',
  "closes_at" TEXT NOT NULL DEFAULT '19:00',
  "slot_minutes" INTEGER NOT NULL DEFAULT 60,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "booking_schedules_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "booking_schedules_day_of_week_key" UNIQUE ("day_of_week"),
  CONSTRAINT "booking_schedules_day_of_week_check" CHECK ("day_of_week" BETWEEN 0 AND 6),
  CONSTRAINT "booking_schedules_slot_minutes_check" CHECK ("slot_minutes" IN (30, 45, 60, 90))
);

CREATE INDEX IF NOT EXISTS "booking_schedules_day_of_week_idx" ON "booking_schedules" ("day_of_week");

INSERT INTO "booking_schedules" ("day_of_week", "is_open", "opens_at", "closes_at", "slot_minutes")
VALUES
  (0, false, '09:00', '19:00', 60),
  (1, true, '09:00', '19:00', 60),
  (2, true, '09:00', '19:00', 60),
  (3, true, '09:00', '19:00', 60),
  (4, true, '09:00', '19:00', 60),
  (5, true, '09:00', '19:00', 60),
  (6, false, '09:00', '19:00', 60)
ON CONFLICT ("day_of_week") DO NOTHING;

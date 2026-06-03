ALTER TYPE "ServiceType" ADD VALUE IF NOT EXISTS 'sostegno_psicologico';
ALTER TYPE "ServiceType" ADD VALUE IF NOT EXISTS 'potenziamento_cognitivo';
ALTER TYPE "ServiceType" ADD VALUE IF NOT EXISTS 'screening_dsa';
ALTER TYPE "ServiceType" ADD VALUE IF NOT EXISTS 'eta_evolutiva';
ALTER TYPE "ServiceType" ADD VALUE IF NOT EXISTS 'genitorialita';

INSERT INTO "services" ("id", "code", "title", "subtitle", "description", "icon_label", "display_order", "active")
VALUES
  ('11111111-1111-4111-8111-111111111111', 'primo_colloquio', 'Primo colloquio', 'Accoglienza e orientamento', 'Un primo incontro per conoscerci, ascoltare la richiesta e capire insieme quale percorso può essere più adatto.', '☘️', 1, true),
  ('66666666-6666-4666-8666-666666666666', 'sostegno_psicologico', 'Sostegno psicologico', 'Uno spazio di ascolto', 'Percorsi di supporto per affrontare momenti di difficoltà, cambiamento, fatica emotiva o blocchi personali.', '🤍', 2, true),
  ('77777777-7777-4777-8777-777777777777', 'potenziamento_cognitivo', 'Potenziamento cognitivo', 'Risorse e strategie', 'Attività mirate per sostenere attenzione, memoria, funzioni esecutive e metodo di studio in modo graduale e personalizzato.', '🧠', 3, true),
  ('88888888-8888-4888-8888-888888888888', 'screening_dsa', 'Screening DSA', 'Valutazione iniziale', 'Screening per individuare possibili difficoltà specifiche dell’apprendimento e orientare eventuali approfondimenti diagnostici.', '📘', 4, true),
  ('22222222-2222-4222-8222-222222222222', 'ansia', 'Ansia e stress', 'Regolazione emotiva', 'Supporto per riconoscere e gestire ansia, stress, tensione, preoccupazioni ricorrenti e sovraccarico quotidiano.', '🌿', 20, true),
  ('99999999-9999-4999-8999-999999999999', 'eta_evolutiva', 'Età evolutiva', 'Infanzia e adolescenza', 'Interventi rivolti a bambini e adolescenti per sostenere sviluppo emotivo, relazionale, scolastico e comportamentale.', '🧩', 21, true),
  ('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa', 'genitorialita', 'Genitorialità', 'Supporto ai genitori', 'Uno spazio per accompagnare i genitori nella comprensione dei bisogni dei figli e nella gestione delle sfide educative.', '👥', 22, true)
ON CONFLICT ("code") DO UPDATE SET
  "title" = EXCLUDED."title",
  "subtitle" = EXCLUDED."subtitle",
  "description" = EXCLUDED."description",
  "icon_label" = EXCLUDED."icon_label",
  "display_order" = EXCLUDED."display_order",
  "active" = EXCLUDED."active",
  "deleted_at" = NULL,
  "updated_at" = now();

UPDATE "services"
SET "active" = false, "updated_at" = now()
WHERE "code" IN ('relazioni', 'autostima', 'traumi');

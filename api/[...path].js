import { handleApiRequest } from "../server/app.js";

// Catch-all per le rotte /api/* a SEGMENTO SINGOLO (es. /api/appointments, /api/availability,
// /api/dashboard, /api/cookie-consent, /api/health). Le rotte annidate (/api/cms/*, /api/auth/*,
// /api/consents/*, /api/bookings/*, /api/email/*, /api/reviews/*) hanno file dedicati, perché un
// catch-all alla radice non intercetta i percorsi multi-segmento su Vercel.
export default function handler(req, res) {
  return handleApiRequest(req, res);
}

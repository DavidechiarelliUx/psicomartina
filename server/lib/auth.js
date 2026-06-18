import jwt from "jsonwebtoken";
import { timingSafeEqual } from "node:crypto";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  // Nessun fallback hardcoded: un segreto noto permetterebbe a chiunque di forgiare
  // token validi e accedere a tutti i dati dei clienti. Meglio fallire subito.
  if (!secret || secret.length < 16) {
    throw new Error(
      "JWT_SECRET mancante o troppo corto. Imposta una variabile d'ambiente JWT_SECRET di almeno 16 caratteri."
    );
  }
  return secret;
}

export function createDashboardToken(username) {
  return jwt.sign({ username }, getJwtSecret(), { expiresIn: "8h" });
}

export function verifyDashboardToken(authHeader) {
  if (!authHeader) return null;

  try {
    return jwt.verify(authHeader.replace("Bearer ", ""), getJwtSecret());
  } catch {
    return null;
  }
}

export function requireDashboardAuth(req, res, sendJson) {
  const payload = verifyDashboardToken(req.headers.authorization);
  if (payload) return payload;

  sendJson(res, 401, { error: "Non autorizzato" });
  return null;
}

/**
 * Confronto a tempo costante per username/password, per non rivelare informazioni
 * tramite tempi di risposta differenti. Restituisce false se manca la configurazione.
 */
export function verifyDashboardCredentials(username, password) {
  const expectedUser = process.env.DASHBOARD_USERNAME;
  const expectedPass = process.env.DASHBOARD_PASSWORD;
  if (!expectedUser || !expectedPass) return false;
  return safeEqual(username, expectedUser) && safeEqual(password, expectedPass);
}

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a ?? ""), "utf8");
  const bufB = Buffer.from(String(b ?? ""), "utf8");
  if (bufA.length !== bufB.length) {
    // Confronta comunque per non rivelare la differenza di lunghezza nei tempi.
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/**
 * Rate limiter in-memory per IP. Pienamente efficace sul server long-running locale;
 * sulle funzioni serverless di Vercel protegge per-istanza (warm). Per protezione
 * robusta in produzione su serverless usare Vercel KV/Upstash o il WAF di Vercel.
 */
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minuti

export function checkLoginRateLimit(ip) {
  const key = ip || "unknown";
  const now = Date.now();
  const entry = loginAttempts.get(key);

  if (!entry || now - entry.first > WINDOW_MS) {
    loginAttempts.set(key, { count: 0, first: now });
    return { allowed: true, retryAfter: 0 };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((entry.first + WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfter };
  }
  return { allowed: true, retryAfter: 0 };
}

export function registerFailedLogin(ip) {
  const key = ip || "unknown";
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || now - entry.first > WINDOW_MS) {
    loginAttempts.set(key, { count: 1, first: now });
  } else {
    entry.count += 1;
  }
}

export function clearLoginAttempts(ip) {
  loginAttempts.delete(ip || "unknown");
}

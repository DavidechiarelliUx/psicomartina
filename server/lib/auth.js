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
// Lockout PROGRESSIVO: ogni 5 tentativi falliti scatta un blocco temporaneo che
// raddoppia di durata ad ogni nuovo blocco (5, 10, 20, 40... minuti, fino a un tetto).
// Un login riuscito azzera tutto. Il livello si resetta dopo 24h di inattività.
const loginAttempts = new Map(); // ip -> { fails, level, lockUntil, last }
const MAX_FAILS = 5;
const BASE_LOCK_MS = 5 * 60 * 1000; // 5 minuti
const MAX_LOCK_MS = 24 * 60 * 60 * 1000; // tetto: 24 ore
const RESET_AFTER_MS = 24 * 60 * 60 * 1000; // azzera il livello dopo 24h senza tentativi

function getEntry(key) {
  const entry = loginAttempts.get(key);
  if (entry && Date.now() - entry.last > RESET_AFTER_MS) {
    loginAttempts.delete(key);
    return null;
  }
  return entry || null;
}

export function checkLoginRateLimit(ip) {
  const key = ip || "unknown";
  const entry = getEntry(key);
  if (entry && entry.lockUntil && Date.now() < entry.lockUntil) {
    return { allowed: false, retryAfter: Math.ceil((entry.lockUntil - Date.now()) / 1000) };
  }
  return { allowed: true, retryAfter: 0 };
}

export function registerFailedLogin(ip) {
  const key = ip || "unknown";
  const now = Date.now();
  const entry = getEntry(key) || { fails: 0, level: 0, lockUntil: 0, last: now };
  entry.fails += 1;
  entry.last = now;
  if (entry.fails >= MAX_FAILS) {
    entry.level += 1;
    const lockMs = Math.min(BASE_LOCK_MS * 2 ** (entry.level - 1), MAX_LOCK_MS);
    entry.lockUntil = now + lockMs;
    entry.fails = 0; // riparte il conteggio per il livello successivo
  }
  loginAttempts.set(key, entry);
}

export function clearLoginAttempts(ip) {
  loginAttempts.delete(ip || "unknown");
}

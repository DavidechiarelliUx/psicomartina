import jwt from "jsonwebtoken";

const fallbackSecret = "secret_key_cambiami";

export function createDashboardToken(username) {
  return jwt.sign({ username }, process.env.JWT_SECRET || fallbackSecret, { expiresIn: "8h" });
}

export function verifyDashboardToken(authHeader) {
  if (!authHeader) return null;

  try {
    return jwt.verify(authHeader.replace("Bearer ", ""), process.env.JWT_SECRET || fallbackSecret);
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

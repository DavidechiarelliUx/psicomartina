import { handleApiRequest } from "../server/app.js";

export default function handler(req, res) {
  return handleApiRequest(req, res);
}

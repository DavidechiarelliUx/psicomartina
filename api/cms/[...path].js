import { handleApiRequest } from "../../server/app.js";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req, res) {
  return handleApiRequest(req, res);
}

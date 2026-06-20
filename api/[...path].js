import { handleApiRequest } from "../server/app.js";

// Funzione catch-all: gestisce TUTTE le rotte /api/* con un'unica serverless function
// (il routing per pathname è dentro handleApiRequest). Questo evita di superare il
// limite di 12 funzioni del piano Vercel Hobby.
//
// bodyParser disabilitato: necessario per gli upload multipart (CMS immagini); le rotte
// JSON funzionano comunque perché il body viene letto dallo stream in handleApiRequest.
export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req, res) {
  return handleApiRequest(req, res);
}

import http from "node:http";
import { handleApiRequest } from "./app.js";

const port = Number(process.env.API_PORT || 3001);

const server = http.createServer(handleApiRequest);

server.listen(port, "127.0.0.1", () => {
  console.log(`API psicomartina attiva su http://127.0.0.1:${port}`);
});

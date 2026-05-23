import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import fs from "node:fs";
import path from "node:path";

const apiProxyTarget = process.env.VITE_API_PROXY_TARGET || "http://127.0.0.1:3001";

const knownRoutes = new Set(["/", "/chi-sono", "/servizi", "/come-funziona", "/blog", "/contatti", "/privacy", "/dashboard"]);

function isHtmlNavigation(req) {
  return req.method === "GET" && (req.headers.accept || "").includes("text/html");
}

function isKnownAppPath(url = "/") {
  const pathname = url.split("?")[0].replace(/\/$/, "") || "/";
  return knownRoutes.has(pathname) || /^\/blog\/[^/]+$/.test(pathname) || /^\/dashboard\/cms\/(blog|servizi|recensioni)$/.test(pathname);
}

function shouldServe404(req) {
  const pathname = (req.url || "/").split("?")[0];
  return isHtmlNavigation(req) && !pathname.startsWith("/api/") && !path.extname(pathname) && !isKnownAppPath(pathname);
}

function app404StatusPlugin() {
  return {
    name: "app-404-status",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!shouldServe404(req)) return next();

        const indexPath = path.resolve(process.cwd(), "index.html");
        const html = fs.readFileSync(indexPath, "utf8");
        const transformed = await server.transformIndexHtml(req.url, html);

        res.statusCode = 404;
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.end(transformed);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!shouldServe404(req)) return next();

        const indexPath = path.resolve(process.cwd(), "dist/index.html");
        const html = fs.readFileSync(indexPath, "utf8");

        res.statusCode = 404;
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.end(html);
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [app404StatusPlugin(), react()],
  server: {
    proxy: {
      "/api": apiProxyTarget,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

import { createServer } from "node:http";
import { resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import express from "express";
import type { ErrorRequestHandler } from "express";
import { createServer as createViteServer } from "vite";
import type { ViteDevServer } from "vite";

import { createApiRouter } from "./api";
import { loadClients } from "./clients";

const port = Number(process.env.PORT ?? 5180);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

const clients = await loadClients();
const isProduction = process.env.NODE_ENV === "production" || process.argv.includes("--production");
const app = express();
app.disable("x-powered-by");
app.disable("etag");
app.use((_request, response, next) => {
  response.set("X-Content-Type-Options", "nosniff");
  next();
});
app.use("/api", createApiRouter(clients));
app.use((request, response, next) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.set("Allow", "GET, HEAD").status(405).end();
    return;
  }
  next();
});
app.use("/avatars", express.static(fileURLToPath(new URL("./avatars", import.meta.url)), {
  index: false,
  redirect: false,
  fallthrough: false,
}));

const server = createServer(app);
let vite: ViteDevServer | null = null;

if (isProduction) {
  app.use(express.static(resolve("dist"), { redirect: false, fallthrough: false }));
} else {
  vite = await createViteServer({
    appType: "spa",
    configFile: resolve("vite.config.ts"),
    server: { middlewareMode: true, ws: { server } },
  });
  app.use(vite.middlewares);
}

app.use((_request, response) => {
  response.status(404).type("text").send("Not found");
});

const handleError: ErrorRequestHandler = (error: unknown, _request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }
  const status = error instanceof Error && "status" in error ? error.status : 500;
  if (status === 400 || status === 403 || status === 404) {
    const message = status === 400 ? "Bad request" : status === 403 ? "Forbidden" : "Not found";
    response.status(status).type("text").send(message);
    return;
  }
  if (error instanceof Error) vite?.ssrFixStacktrace(error);
  response.status(500).json({ error: "Internal server error" });
};
app.use(handleError);

server.on("error", async (error) => {
  console.error(`Could not start on port ${port}:`, error);
  await vite?.close();
  process.exitCode = 1;
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Nevis dashboard: http://127.0.0.1:${port}`);
});

let shutdownPromise: Promise<void> | null = null;

async function shutdown() {
  if (shutdownPromise) return shutdownPromise;
  shutdownPromise = (async () => {
    await vite?.close();
    if (!server.listening) return;
    await new Promise<void>((resolveClose, rejectClose) => {
      server.close((error) => (error ? rejectClose(error) : resolveClose()));
    });
  })();
  return shutdownPromise;
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    void shutdown().catch((error: unknown) => {
      console.error("Could not shut down the dashboard cleanly:", error);
      process.exitCode = 1;
    });
  });
}

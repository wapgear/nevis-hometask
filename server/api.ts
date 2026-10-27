import { Router } from "express";
import { setTimeout as delay } from "node:timers/promises";

import { parseDemoScenario } from "../shared/demo.js";

export function createApiRouter(clients: Buffer): Router {
  const router = Router({ caseSensitive: true, strict: true });

  router.route("/clients")
    .get(async (request, response) => {
      const scenario = parseDemoScenario(request.query.demo);
      response.set("Cache-Control", "no-store");

      if (scenario === "slow") {
        await delay(3000);
        if (response.destroyed) return;
      }
      if (scenario === "dead") {
        response.status(503).json({ error: "Demo: service unavailable" });
        return;
      }
      if (scenario === "empty") {
        response.json({ months: [], data: null });
        return;
      }
      if (scenario === "malformed") {
        response.json({ months: [], data: {} });
        return;
      }
      response.type("json").send(clients);
    })
    .all((_request, response) => {
      response.set("Allow", "GET, HEAD").status(405).json({ error: "Method not allowed" });
    });

  router.use((_request, response) => {
    response.status(404).json({ error: "Not found" });
  });

  return router;
}

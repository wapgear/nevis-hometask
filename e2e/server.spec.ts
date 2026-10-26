import { expect, test } from "@playwright/test";

test("keeps the clients API read-only with uncached GET and body-free HEAD responses", async ({ request }) => {
  const get = await request.get("/api/clients?report=all");
  expect(get.status()).toBe(200);
  expect(get.headers()["content-type"]).toContain("application/json");
  expect(get.headers()["cache-control"]).toBe("no-store");
  expect(get.headers()["x-content-type-options"]).toBe("nosniff");
  expect(get.headers()["x-powered-by"]).toBeUndefined();

  const head = await request.head("/api/clients");
  expect(head.status()).toBe(200);
  expect(head.headers()["content-type"]).toBe(get.headers()["content-type"]);
  expect(head.headers()["content-length"]).toBe(get.headers()["content-length"]);
  expect(head.headers()["cache-control"]).toBe("no-store");
  expect(await head.body()).toHaveLength(0);

  for (const method of ["POST", "PUT", "PATCH", "DELETE", "OPTIONS"]) {
    const response = await request.fetch("/api/clients", { method });
    expect(response.status()).toBe(405);
    expect(response.headers().allow).toBe("GET, HEAD");
    expect(await response.json()).toEqual({ error: "Method not allowed" });
  }
});

test("keeps unknown API routes and missing portraits out of the frontend fallback", async ({ request }) => {
  for (const path of ["/api/missing", "/api/clients/", "/api/CLIENTS"]) {
    const response = await request.get(path);
    expect(response.status()).toBe(404);
    expect(await response.json()).toEqual({ error: "Not found" });
  }

  for (const path of ["/avatars/missing.jpg", "/avatars/"]) {
    const response = await request.get(path);
    expect(response.status()).toBe(404);
    expect(response.headers()["content-type"]).toContain("text/plain");
  }
});

test("serves portrait HEAD requests and rejects writes and traversal", async ({ request }) => {
  const clients = await (await request.get("/api/clients")).json();
  const portraitUrl = clients.data.branches[0].employees[0].avatarUrl;
  const portrait = await request.get(portraitUrl);
  const head = await request.head(portraitUrl);
  expect(head.status()).toBe(200);
  expect(head.headers()["content-type"]).toBe("image/jpeg");
  expect(head.headers()["content-length"]).toBe(String((await portrait.body()).length));
  expect(await head.body()).toHaveLength(0);

  for (const path of ["/", portraitUrl]) {
    const response = await request.post(path);
    expect(response.status()).toBe(405);
    expect(response.headers().allow).toBe("GET, HEAD");
  }

  const traversal = await request.get("/avatars/%2e%2e%2fclients.json");
  expect(traversal.status()).toBeGreaterThanOrEqual(400);
  expect(traversal.status()).toBeLessThan(500);
});

test("serves backend-owned employee portraits from API URLs", async ({ request }) => {
  const clients = await (await request.get("/api/clients")).json();
  const employees: { id: string; avatarUrl: string }[] = clients.data.branches.flatMap(
    (branch: { employees?: { id: string; avatarUrl: string }[] }) => branch.employees ?? [],
  );
  expect(employees).toHaveLength(5);
  for (const employee of employees) {
    const portrait = await request.get(employee.avatarUrl);
    expect(portrait.ok()).toBeTruthy();
    expect(portrait.headers()["content-type"]).toContain("image/jpeg");
    expect((await portrait.body()).subarray(0, 2)).toEqual(Buffer.from([0xff, 0xd8]));
  }
});


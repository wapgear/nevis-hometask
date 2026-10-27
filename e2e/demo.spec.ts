import { expect, test } from "./fixtures";
import { DashboardPage } from "./pages/dashboard.page";

test("shows demo controls when the URL flag is present", async ({ dashboard }) => {
  await dashboard.goto("/");
  await expect(dashboard.collapseButton("Company")).toBeVisible();
  await expect(dashboard.demoControls).toHaveCount(0);
  await expect(dashboard.demoMode).toHaveAttribute("aria-pressed", "false");

  await dashboard.goto("/?demo");
  await expect(dashboard.demoState).toHaveValue("normal");
  await expect(dashboard.reloadButton).toBeVisible();
  await expect(dashboard.demoMode).toHaveAttribute("aria-pressed", "true");
});

test("toggles demo mode beside Reset chart and restores the healthy server", async ({ page, dashboard }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await dashboard.goto("/?presentation=1#clients");
  await dashboard.legendButton("Existing clients").click();
  await expect(dashboard.resetChart).toBeVisible();
  const demoBounds = (await dashboard.demoMode.boundingBox())!;
  const resetBounds = (await dashboard.resetChart.boundingBox())!;
  expect(demoBounds.x + demoBounds.width).toBeLessThanOrEqual(resetBounds.x);
  expect(demoBounds.y).toBe(resetBounds.y);
  expect(resetBounds.x + resetBounds.width).toBeLessThanOrEqual(320);

  await dashboard.demoMode.focus();
  await page.keyboard.press("Enter");
  await expect(dashboard.demoMode).toHaveAttribute("aria-pressed", "true");
  await expect(dashboard.demoMode).toBeFocused();
  await expect(dashboard.demoState).toHaveValue("normal");
  await expect(page).toHaveURL(/\?presentation=1&demo=normal#clients$/);

  await dashboard.demoState.selectOption("dead");
  await expect(dashboard.alert).toContainText("Could not load clients (503)");
  await dashboard.demoMode.click();
  await expect(dashboard.demoControls).toHaveCount(0);
  await expect(dashboard.demoMode).toHaveAttribute("aria-pressed", "false");
  await expect(page).toHaveURL(/\?presentation=1#clients$/);
  await expect(dashboard.collapseButton("Company")).toBeVisible();
  await page.reload();
  await expect(dashboard.demoControls).toHaveCount(0);
});

test("switches API scenarios, preserves them on retry and reload, and recovers", async ({ page, dashboard }) => {
  await dashboard.goto("/?demo=dead&presentation=1#clients");
  const state = dashboard.demoState;
  const alert = dashboard.alert;
  await expect(state).toHaveValue("dead");
  await expect(alert).toContainText("Could not load clients (503)");

  const retryResponse = page.waitForResponse("**/api/clients?demo=dead");
  await dashboard.retryButton.click();
  expect((await retryResponse).status()).toBe(503);
  await expect(alert).toBeVisible();

  await state.selectOption("empty");
  await expect(dashboard.emptyState).toBeVisible();
  await expect(page).toHaveURL(/\?demo=empty&presentation=1#clients$/);
  await page.reload();
  await expect(state).toHaveValue("empty");
  await expect(dashboard.emptyState).toBeVisible();

  const invalidResponse = page.waitForResponse("**/api/clients?demo=malformed");
  await state.selectOption("malformed");
  expect((await invalidResponse).status()).toBe(200);
  await expect(alert).toContainText("Client data unavailable");

  await state.selectOption("normal");
  await expect(dashboard.collapseButton("Company")).toBeVisible();
  const healthyResponse = page.waitForResponse("**/api/clients?demo=normal");
  await dashboard.reloadButton.click();
  expect((await healthyResponse).status()).toBe(200);
  await expect(dashboard.collapseButton("Company")).toBeVisible();
});

test("delays slow requests, isolates other tabs, and cancels obsolete scenarios", async ({ page, context, dashboard }) => {
  await dashboard.goto("/?demo=slow");
  await expect(dashboard.status).toContainText("Loading client data");

  const otherDashboard = new DashboardPage(await context.newPage());
  await otherDashboard.goto();
  await expect(otherDashboard.collapseButton("Company")).toBeVisible();
  await expect(otherDashboard.demoState).toHaveCount(0);
  await expect(dashboard.collapseButton("Company")).toBeVisible();

  const slowRequest = page.waitForRequest("**/api/clients?demo=slow");
  await dashboard.reloadButton.click();
  const request = await slowRequest;
  await expect(dashboard.status).toContainText("Loading client data");
  const canceled = page.waitForEvent("requestfailed", (failed) => failed === request);
  await dashboard.demoState.selectOption("empty");
  await canceled;
  await expect(dashboard.emptyState).toBeVisible();
});

test("keeps floating controls in a narrow viewport and accessible by keyboard", async ({ page, dashboard }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await dashboard.goto("/?demo");
  const controls = dashboard.demoControls;
  await expect(controls).toBeVisible();
  const bounds = await controls.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(375);

  await dashboard.demoState.focus();
  await page.keyboard.press("e");
  await page.keyboard.press("Enter");
  await expect(dashboard.demoState).toHaveValue("empty");
  await expect(dashboard.emptyState).toBeVisible();
  // Linux Chromium opens the native popup on Enter; close it before tabbing onward.
  await page.keyboard.press("Escape");
  await page.keyboard.press("Tab");
  await expect(dashboard.reloadButton).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(dashboard.emptyState).toBeVisible();

  await dashboard.demoState.selectOption("dead");
  const errorHeading = page.getByRole("heading", { name: "Client data unavailable" });
  await expect(errorHeading).toBeVisible();
  const errorBounds = await errorHeading.boundingBox();
  expect(errorBounds!.y + errorBounds!.height).toBeLessThan(bounds!.y);
});

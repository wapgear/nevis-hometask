import AxeBuilder from "@axe-core/playwright";
import type { Page, TestInfo } from "@playwright/test";

import { expect, test } from "./fixtures";

async function audit(page: Page, testInfo: TestInfo, state: string) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  await testInfo.attach(`accessibility-${state}`, {
    body: JSON.stringify(results, null, 2),
    contentType: "application/json",
  });
  if (["initial", "demo-mobile", "tooltip-and-discrepancy"].includes(state)) {
    await testInfo.attach(`accessibility-${state}-screenshot`, {
      body: await page.screenshot({ animations: "disabled" }),
      contentType: "image/png",
    });
  }
  expect.soft(results.violations, `${state}: automatically detected WCAG violations`).toEqual([]);
}

test("has no automated accessibility violations in the interactive dashboard states", async ({ page, dashboard }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await dashboard.goto();
  await expect(dashboard.collapseButton("Company")).toBeVisible();
  await audit(page, testInfo, "initial");

  await dashboard.expand("Branch 1");
  await dashboard.expand("James Walker");
  await expect(dashboard.channelRows).toHaveCount(3);
  await audit(page, testInfo, "expanded-unavailable-channels");

  await dashboard.legendButton("Unknown channel").click();
  await expect(dashboard.scaleMaximum).toHaveText("40");
  await audit(page, testInfo, "hidden-series");

  await dashboard.selectScope({ label: "Employee: Anna Blackwood" });
  await dashboard.bars.nth(7).focus();
  await expect(dashboard.status).toContainText("Channel sum exceeds reported total by 1");
  await audit(page, testInfo, "tooltip-and-discrepancy");
});

test("has no automated accessibility violations in demo, error, and empty states", async ({ page, dashboard }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 320, height: 800 });
  await dashboard.goto("/?demo");
  await expect(dashboard.collapseButton("Company")).toBeVisible();
  await audit(page, testInfo, "demo-mobile");
  await dashboard.demoState.selectOption("dead");
  await expect(dashboard.alert).toBeVisible();
  await audit(page, testInfo, "error");
  await dashboard.demoState.selectOption("empty");
  await expect(dashboard.emptyState).toBeVisible();
  await audit(page, testInfo, "empty");
});

test("keeps every keyboard stop visible and unobscured on desktop and at 400% reflow width", async ({ page, dashboard }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const [width, height] of [[1280, 800], [320, 800], [320, 200]] as const) {
    for (const url of ["/", "/?demo"]) {
      await test.step(`${url} at ${width}×${height}px`, async () => {
        await page.setViewportSize({ width, height });
        await dashboard.goto(url);
        await expect(dashboard.collapseButton("Company")).toBeVisible();
        const count = await page.locator("button, select, [tabindex='0']").evaluateAll((elements) =>
          elements.filter((element) => {
            const rect = element.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && !element.closest("[inert]");
          }).length,
        );
        const visited = new Set<number>();
        for (let stop = 0; stop < count; stop += 1) {
          await page.keyboard.press("Tab");
          const focused = page.locator(":focus");
          await expect(focused).toBeInViewport();
          visited.add(await focused.evaluate((element) =>
            [...document.querySelectorAll("button, select, [tabindex='0']")].indexOf(element),
          ));
          expect(await focused.evaluate((element) => {
            const rect = element.getBoundingClientRect();
            return [[0.5, 0.5], [0.05, 0.05], [0.95, 0.05], [0.05, 0.95], [0.95, 0.95]]
              .some(([x, y]) => {
                const hit = document.elementFromPoint(rect.x + rect.width * x!, rect.y + rect.height * y!);
                return element === hit || (hit !== null && element.contains(hit));
              });
          }), `keyboard stop ${stop + 1} must not be covered`).toBe(true);
          await expect(focused).toHaveCSS("outline-style", "solid");
        }
        expect(visited.size, "Tab must reach every control without a keyboard trap").toBe(count);
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      });
    }
  }
});

test("exposes table headers, missing data, chart names, and selection state to assistive technology", async ({ page, dashboard }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await dashboard.goto();
  await dashboard.expand("Branch 1");
  await dashboard.expand("James Walker");
  const table = dashboard.hierarchy.getByRole("table");
  await expect(table).toHaveAccessibleName(/Reported clients, Feb 2024 – Jan 2025/);
  await expect(table.getByRole("columnheader")).toHaveCount(13);
  await expect(table.getByRole("rowheader").first()).toContainText("Company");
  await expect(table.getByRole("cell", { name: "Channel data unavailable", exact: true })).toHaveCount(36);
  await expect(table.getByRole("img")).toHaveCount(0);

  const branch = dashboard.expandButton("Anna Blackwood");
  await branch.focus();
  await page.keyboard.press("Tab");
  const action = page.getByRole("button", { name: "Show chart for Anna Blackwood", exact: true });
  await expect(action).toBeFocused();
  await expect(action).toHaveCSS("opacity", "1");
  await page.keyboard.press("Enter");
  await expect(action).toHaveAttribute("aria-pressed", "true");
  await expect(action).toBeFocused();
  await expect(page.getByRole("figure", { name: "Monthly clients for Anna Blackwood", exact: true })).toBeVisible();
  await expect(page.getByText("Chart scope: Employee: Anna Blackwood", { exact: true }))
    .toHaveAttribute("aria-live", "polite");
  await testInfo.attach("screen-reader-semantics", { body: await page.locator("main").ariaSnapshot(), contentType: "text/plain" });
});

test("preserves keyboard focus after resetting the chart and dismissing its notice", async ({ page, dashboard }) => {
  await dashboard.goto();
  await dashboard.selectScope({ label: "Employee: Anna Blackwood" });
  const dismiss = page.getByRole("button", { name: "Dismiss data notice", exact: true });
  await dismiss.focus();
  await page.keyboard.press("Enter");
  await expect(dismiss).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Clients", exact: true })).toBeFocused();

  await dashboard.resetChart.focus();
  await page.keyboard.press("Enter");
  await expect(dashboard.resetChart).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Clients", exact: true })).toBeFocused();
});

test("dismisses a floating data notice with Escape while keeping the current control focused", async ({ page, dashboard }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await dashboard.goto();
  await dashboard.selectScope({ label: "Employee: Anna Blackwood" });
  const action = page.getByRole("button", { name: "Show chart for Anna Blackwood", exact: true });
  await expect(action).toBeFocused();
  await expect(page.getByRole("region", { name: "Data discrepancy details" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("region", { name: "Data discrepancy details" })).toHaveCount(0);
  await expect(action).toBeFocused();
});

test("announces loading and recovery without losing the retry keyboard position", async ({ page, dashboard }, testInfo) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  let attempts = 0;
  await page.route("**/api/clients", async (route) => {
    attempts += 1;
    if (attempts === 1) {
      await route.fulfill({ status: 503, body: "Unavailable" });
    } else {
      await gate;
      await route.continue();
    }
  });
  await dashboard.goto();
  await expect(dashboard.alert).toContainText("Client data unavailable");
  await dashboard.retryButton.focus();
  await page.keyboard.press("Enter");
  try {
    await expect(dashboard.status).toContainText("Loading client data");
    await expect(page.getByRole("heading", { name: "Clients", exact: true })).toBeFocused();
    await audit(page, testInfo, "loading");
  } finally {
    release();
  }
  await expect(dashboard.collapseButton("Company")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Clients", exact: true })).toBeFocused();
});

test("keeps content and controls usable with doubled text and WCAG text spacing", async ({ page, dashboard }) => {
  for (const width of [1280, 320]) {
    await page.setViewportSize({ width, height: 800 });
    await dashboard.goto("/?demo");
    await expect(dashboard.collapseButton("Company")).toBeVisible();
    await page.evaluate(() => {
      const sizes = [...document.querySelectorAll<HTMLElement>("main, main *")]
        .filter((element) => element instanceof HTMLElement)
        .map((element) => ({ element, size: Number.parseFloat(getComputedStyle(element).fontSize) }));
      for (const { element, size } of sizes) {
        element.style.setProperty("font-size", `${size * 2}px`, "important");
        element.style.setProperty("line-height", "1.5", "important");
        element.style.setProperty("letter-spacing", "0.12em", "important");
        element.style.setProperty("word-spacing", "0.16em", "important");
        if (element.tagName === "P") element.style.setProperty("margin-bottom", "2em", "important");
      }
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    for (const control of [dashboard.reloadButton, ...await dashboard.legend.getByRole("button").all()]) {
      await expect(control).toBeVisible();
      expect(await control.evaluate((element) => element.scrollHeight <= element.clientHeight + 1 && element.scrollWidth <= element.clientWidth + 1))
        .toBe(true);
    }
  }
});

test("retains keyboard access and visible focus with forced colors and reduced motion", async ({ page, dashboard }) => {
  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  await dashboard.goto();
  await expect(dashboard.collapseButton("Company")).toBeVisible();
  await dashboard.legendButton("Unknown channel").focus();
  await expect(dashboard.legendButton("Unknown channel")).toHaveCSS("outline-style", "solid");
  await expect(dashboard.legendButton("Unknown channel")).toHaveCSS("outline-width", "2px");
  await page.keyboard.press("Space");
  await expect(dashboard.legendButton("Unknown channel")).toHaveAttribute("aria-pressed", "false");
  await expect(dashboard.bars.first()).toHaveCSS("transition-duration", "0s");
  await expect(dashboard.scaleMaximum).toHaveText("40");
  await dashboard.collapseButton("Company").focus();
  await page.keyboard.press("Enter");
  await expect(dashboard.expandButton("Company")).toBeFocused();
  await expect(dashboard.rows).toHaveCount(1);
});

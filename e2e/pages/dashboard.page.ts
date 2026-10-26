import type { Locator, Page } from "@playwright/test";

export class DashboardPage {
  readonly hierarchy: Locator;
  readonly rows: Locator;
  readonly employeeRows: Locator;
  readonly channelRows: Locator;
  readonly bars: Locator;
  readonly resetChart: Locator;
  readonly legend: Locator;
  readonly scaleMaximum: Locator;
  readonly status: Locator;
  readonly alert: Locator;
  readonly emptyState: Locator;
  readonly retryButton: Locator;
  readonly demoControls: Locator;
  readonly demoMode: Locator;
  readonly demoState: Locator;
  readonly reloadButton: Locator;

  constructor(private readonly page: Page) {
    this.hierarchy = page.getByRole("region", { name: /Monthly client hierarchy/ });
    this.rows = this.hierarchy.locator("[data-row-id]");
    this.employeeRows = this.hierarchy.locator('[data-node-kind="employee"]');
    this.channelRows = this.hierarchy.locator('[data-node-kind="channel"]');
    this.bars = page.locator("[data-chart-bar]");
    this.resetChart = page.getByRole("button", { name: "Reset chart", exact: true });
    this.legend = page.locator("figure figcaption");
    this.scaleMaximum = page.locator("[data-chart-scale] span").first();
    this.status = page.getByRole("status");
    this.alert = page.getByRole("alert");
    this.emptyState = page.getByRole("heading", { name: "No client data", exact: true });
    this.retryButton = page.getByRole("button", { name: "Try again", exact: true });
    this.demoControls = page.getByRole("complementary", { name: "Demo controls" });
    this.demoMode = page.getByRole("button", { name: "Demo mode", exact: true });
    this.demoState = this.demoControls.getByLabel("Server state");
    this.reloadButton = this.demoControls.getByRole("button", { name: "Reload data", exact: true });
  }

  async goto(url = "/") {
    await this.page.goto(url);
  }

  row(id: string) {
    return this.hierarchy.locator(`[data-row-id=${JSON.stringify(id)}]`);
  }

  expandButton(name: string) {
    return this.page.getByRole("button", { name: `Expand ${name}`, exact: true });
  }

  collapseButton(name: string) {
    return this.page.getByRole("button", { name: `Collapse ${name}`, exact: true });
  }

  disclosureButton(name: string) {
    return this.expandButton(name).or(this.collapseButton(name));
  }

  async expand(name: string) {
    await this.expandButton(name).click();
  }

  async selectScope(value: string | { label: string }) {
    let row: Locator;
    if (typeof value === "string") {
      row = this.row(value);
    } else {
      const separator = value.label.indexOf(": ");
      const kind = value.label.slice(0, separator).toLowerCase();
      const name = value.label.slice(separator + 2);
      row = this.rows.filter({ has: this.page.getByRole("button", { name: `Show chart for ${name}`, exact: true }) })
        .and(this.hierarchy.locator(`[data-node-kind="${kind}"]`));
    }
    while (await row.count() === 0) {
      const expand = this.hierarchy.getByRole("button", { name: /^Expand / }).first();
      if (await expand.count() === 0) throw new Error(`Chart row not found: ${JSON.stringify(value)}`);
      await expand.click();
    }
    await row.hover();
    await row.getByRole("button", { name: /^Show chart for / }).click();
  }

  legendButton(name: string) {
    return this.legend.getByRole("button", { name, exact: true });
  }
}

import { expect, test } from "./fixtures";
import { expectedRows, expectedScopeLabels } from "./data/assignment";
import { createClientsDataset } from "../server/clients";

test("shows parent and child discrepancies without rewriting the reported figures", async ({ page, request, dashboard }) => {
  const { data } = await (await request.get("/api/clients")).json();
  expect(data.reportedChildTotals[3]).toBe(279);
  expect(data.branches[0].reportedChildTotals[6]).toBe(216);
  expect(data.branches[1].reportedChildTotals).toBeNull();
  await dashboard.goto();
  const details = page.getByRole("region", { name: "Data discrepancy details" });
  const summary = page.locator("summary");
  await expect(summary).toHaveText("Data discrepancies for Company");
  await summary.click();
  await expect(details).toContainText("May 2024: reported total 301; branch total 279.");
  await expect(details).toContainText("There are also discrepancies at lower levels.");
  await dashboard.legendButton("Unknown channel").click();
  await expect(details).toContainText("May 2024: reported total 301; branch total 279.");
  await dashboard.selectScope({ label: "Branch: Branch 1" });
  await expect(details).toBeHidden();
  await summary.click();
  await expect(details).toContainText("Aug 2024: reported total 214; advisor total 216.");
  await dashboard.selectScope({ label: "Employee: Anna Blackwood" });
  await summary.click();
  await expect(details).toContainText("Sep 2024: reported total 27; channel total 28.");
  await expect(details).toContainText("The chart preserves the channel figures.");
  await dashboard.selectScope({ label: "Branch: Branch 2" });
  await expect(summary).toHaveCount(0);
});

test("explains a discrepancy below a level whose own totals reconcile", async ({ page, dashboard }) => {
  await page.route("**/api/clients", (route) => route.fulfill({ json: createClientsDataset({
    months: ["2024-02"],
    data: {
      id: "company", name: "Company", values: [10],
      branches: [{ id: "branch", name: "Branch", values: [10], employees: [{ id: "advisor", name: "Advisor", values: [7] }] }],
    },
  }) }));
  await dashboard.goto();
  await page.locator("summary").click();
  const details = page.getByRole("region", { name: "Data discrepancy details" });
  await expect(details).toContainText("There are also discrepancies at lower levels.");
  await expect(details.getByRole("listitem")).toHaveCount(0);
});

test("keeps full hierarchy labels readable and monthly cells aligned at narrow widths", async ({ page, request, dashboard }, testInfo) => {
  const clients = await (await request.get("/api/clients")).json();
  const longName = "Alexandria Verylongunbrokenadvisornamethatmustwrapwithoutclipping";
  clients.data.branches[0].employees[1].name = longName;
  await page.route("**/api/clients", (route) => route.fulfill({ json: clients }));
  for (const width of [375, 320]) {
    await page.setViewportSize({ width, height: 812 });
    await dashboard.goto();
    await dashboard.expand("Branch 1");
    await dashboard.expand("Anna Blackwood");
    for (const name of ["Anna Blackwood", "Existing clients", "New organic", "New paid", longName, "Maria Gutierrez", "Robert Chen", "Sarah Smith"]) {
      const label = dashboard.hierarchy.getByText(name, { exact: true });
      await expect(label).toBeVisible();
      expect(await label.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        const row = element.closest("tr")!;
        const header = row.querySelector("th")!.getBoundingClientRect();
        return element.scrollWidth <= element.clientWidth + 1 && element.scrollHeight <= element.clientHeight + 1 &&
          bounds.left >= header.left && bounds.right <= header.right &&
          [...row.querySelectorAll("td")].every((cell) => Math.abs(cell.getBoundingClientRect().height - header.height) < 1);
      }), `${name} must fit its row without clipping`).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await testInfo.attach(`hierarchy-${width}px`, { body: await dashboard.hierarchy.screenshot(), contentType: "image/png" });
  }
});

test("serves the assignment data through the REST API without rewriting totals", async ({
  request,
}) => {
  const response = await request.get("/api/clients");
  expect(response.ok()).toBeTruthy();
  expect(response.headers()["content-type"]).toContain("application/json");

  const { months, data: company } = await response.json();
  expect(months).toEqual([
    "2024-02", "2024-03", "2024-04", "2024-05", "2024-06", "2024-07",
    "2024-08", "2024-09", "2024-10", "2024-11", "2024-12", "2025-01",
  ]);
  const flattened: { name: string; values: number[] }[] = [];
  function visit(node: {
    name: string;
    values: number[];
    branches?: unknown[];
    employees?: unknown[];
    channels?: unknown[];
  }) {
    flattened.push({ name: node.name, values: node.values });
    const children = node.branches ?? node.employees ?? node.channels ?? [];
    for (const child of children) visit(child as typeof node);
  }
  visit(company);

  expect(flattened).toEqual(expectedRows.map(([name, values]) => ({ name, values })));
});

test("uses backend reporting months across charts, tables, and date ranges", async ({ page, dashboard }) => {
  const months = ["2026-11", "2026-12", "2027-01"];
  const data = {
    id: "company",
    name: "Company",
    values: [10, 20, 30],
    branches: [{
      id: "branch",
      name: "Branch 1",
      values: [10, 20, 30],
      employees: [{
        id: "advisor",
        name: "Renamed Advisor",
        values: [10, 20, 30],
        channels: [
          { id: "existing", name: "Existing clients", values: [6, 12, 18] },
          { id: "organic", name: "New organic", values: [2, 3, 4] },
          { id: "paid", name: "New paid", values: [1, 2, 3] },
        ],
      }],
    }],
  };
  await page.route("**/api/clients", (route) => route.fulfill({ json: createClientsDataset({ months, data }) }));
  await dashboard.goto();
  const bars = dashboard.bars;
  await expect(bars).toHaveCount(3);
  await expect(page.getByText(/Company · Nov 2026 – Jan 2027/)).toBeVisible();
  const hierarchy = dashboard.hierarchy;
  await expect(hierarchy.locator("thead th")).toHaveText([
    "Company, branch, employee or channel", "Nov 2026", "Dec 2026", "Jan 2027",
  ]);
  await expect(hierarchy.locator("caption")).toContainText("Nov 2026 – Jan 2027");
  await dashboard.expand("Branch 1");
  await dashboard.expand("Renamed Advisor");
  await expect(dashboard.row("existing").locator("td")).toHaveText(["6", "12", "18"]);
  await dashboard.selectScope("advisor");
  await expect(bars.nth(2).locator('[data-series="Existing clients"]')).toHaveAttribute("data-value", "18");
  await expect(bars.nth(2).locator('[data-series="New organic"]')).toHaveAttribute("data-value", "4");
  await expect(bars.nth(2).locator('[data-series="New paid"]')).toHaveAttribute("data-value", "3");
  await expect(bars.nth(2).locator('[data-series="Unknown channel"]')).toHaveAttribute("data-value", "5");
  await bars.nth(2).focus();
  await expect(dashboard.status).toContainText("Jan 2027 · Renamed Advisor");
});

test("renders a single reporting month supplied by the backend", async ({ page, dashboard }) => {
  await page.route("**/api/clients", (route) => route.fulfill({ json: createClientsDataset({
    months: ["2028-06"],
    data: { id: "company", name: "Company", values: [7] },
  }) }));
  await dashboard.goto();
  await expect(dashboard.bars).toHaveCount(1);
  await expect(page.getByText(/Company · Jun 2028\./)).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Jun 2028", exact: true })).toBeVisible();
});

test("rejects invalid reporting metadata and value counts", async ({ page, dashboard }) => {
  const { data } = createClientsDataset({ months: ["2026-11", "2026-12"], data: { id: "company", name: "Company", values: [1, 2] } });
  const invalidPayloads = [
    { data },
    { months: ["2026-13", "2027-01"], data },
    { months: ["2026-11", "2026-11"], data },
    { months: ["2027-01", "2026-12"], data },
    { months: [], data },
    { months: ["2026-11"], data },
    { months: ["2026-11", "2026-12"], data: {
      ...data, branches: [{ ...data, id: "branch", kind: "branch", values: [1] }],
    } },
  ];
  let payload: unknown;
  await page.route("**/api/clients", (route) => route.fulfill({ json: payload }));
  for (payload of invalidPayloads) {
    await dashboard.goto();
    await expect(dashboard.alert).toContainText("invalid client dataset");
    await expect(dashboard.bars).toHaveCount(0);
  }
});

test("rejects missing or malformed API-owned chart and identity fields", async ({ page, request, dashboard }) => {
  const original = await (await request.get("/api/clients")).json();
  let payload = original;
  await page.route("**/api/clients", (route) => route.fulfill({ json: payload }));
  const corruptions = [
    (data: typeof original.data) => { delete data.chart; },
    (data: typeof original.data) => { data.chart[0].known = [1, 2]; },
    (data: typeof original.data) => { data.chart[0].missing = -1; },
    (data: typeof original.data) => { data.chart[0].excess = "1"; },
    (data: typeof original.data) => { data.values[0] = 1.5; },
    (data: typeof original.data) => { data.hasReportedMismatch = "true"; },
    (data: typeof original.data) => { delete data.reportedChildTotals; },
    (data: typeof original.data) => { data.reportedChildTotals = [1]; },
    (data: typeof original.data) => { data.reportedChildTotals[0] = -1; },
    (data: typeof original.data) => { data.kind = "employee"; },
    (data: typeof original.data) => { delete data.branches[0].employees[0].avatarUrl; },
    (data: typeof original.data) => { data.branches[0].employees[0].avatarUrl = "javascript:alert(1)"; },
    (data: typeof original.data) => { data.branches[0].employees[1].unavailableChannels[0].values[0] = 0; },
    (data: typeof original.data) => { data.branches[0].employees[1].unavailableChannels[0].id = data.id; },
  ];
  for (const corrupt of corruptions) {
    payload = structuredClone(original);
    corrupt(payload.data);
    await dashboard.goto();
    await expect(dashboard.alert).toContainText("invalid client dataset");
    await expect(dashboard.bars).toHaveCount(0);
  }
});

test("visualizes API chart figures and unavailable rows without rebuilding them", async ({ page, request, dashboard }) => {
  const clients = await (await request.get("/api/clients")).json();
  // A partial hierarchy need not contain every observation used by backend reporting.
  clients.data.chart[0] = { known: [40, 5, 3], missing: 202, excess: 0 };
  clients.data.hasReportedMismatch = false;
  const employee = clients.data.branches[0].employees[1];
  employee.unavailableChannels = [{
    id: "backend-unavailable-paid", name: "New paid", kind: "channel",
    avatarUrl: null, values: Array(12).fill(null),
  }];
  await page.route("**/api/clients", (route) => route.fulfill({ json: clients }));
  await dashboard.goto();
  const firstBar = dashboard.bars.first();
  for (const [label, value] of [["Existing clients", "40"], ["New organic", "5"], ["New paid", "3"], ["Unknown channel", "202"]]) {
    await expect(firstBar.locator(`[data-series="${label}"]`)).toHaveAttribute("data-value", value);
  }
  await dashboard.expand("Branch 1");
  await dashboard.expand("James Walker");
  const unavailable = dashboard.row("backend-unavailable-paid");
  await expect(unavailable).toContainText("New paid");
  await expect(unavailable.locator("td")).toHaveText(Array(12).fill("-"));
  await expect(dashboard.channelRows).toHaveCount(1);
});

test("supports an empty dataset with backend month metadata", async ({ page, dashboard }) => {
  await page.route("**/api/clients", (route) => route.fulfill({ json: { months: [], data: null } }));
  await dashboard.goto();
  await expect(dashboard.emptyState).toBeVisible();
  await expect(dashboard.alert).toHaveCount(0);
});

test("expands and collapses the hierarchy by keyboard", async ({ page, dashboard }) => {
  await dashboard.goto();
  const company = dashboard.collapseButton("Company");
  await expect(company).toBeVisible();

  const branch = dashboard.expandButton("Branch 1");
  await branch.click();
  const anna = dashboard.expandButton("Anna Blackwood");
  await expect(anna).toBeVisible();
  await anna.focus();
  await page.keyboard.press("Space");
  await expect(
    dashboard.collapseButton("Anna Blackwood"),
  ).toBeVisible();
  await expect(page.getByRole("row", { name: /Existing clients/ })).toBeVisible();

  await page.keyboard.press("Enter");
  await expect(
    dashboard.expandButton("Anna Blackwood"),
  ).toBeVisible();
  await expect(page.getByRole("row", { name: /Existing clients/ })).toBeHidden();

  await page.keyboard.press("Home");
  await expect(company).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(dashboard.collapseButton("Branch 1")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(anna).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(dashboard.collapseButton("Branch 1")).toBeFocused();
  await page.keyboard.press("End");
  await expect(dashboard.expandButton("Sarah Smith")).toBeFocused();
});

test("keeps hierarchy state consistent after repeated toggles and with reduced motion", async ({ page, dashboard }) => {
  await dashboard.goto();
  const branch = dashboard.disclosureButton("Branch 1");
  await expect(branch).toBeVisible();
  await branch.click();
  await branch.click();
  await branch.click();
  await expect(dashboard.expandButton("Anna Blackwood")).toBeVisible();
  await expect(dashboard.employeeRows).toHaveCount(5);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await branch.click();
  await expect(dashboard.expandButton("Anna Blackwood")).toBeHidden();
  expect(await branch.locator("svg").evaluate((svg) => getComputedStyle(svg).transitionDuration)).toBe("0s");
  await expect(dashboard.employeeRows).toHaveCount(0);
});

test("expands missing advisor channels as dashes without changing reported data", async ({ page, dashboard }) => {
  await dashboard.goto();
  await dashboard.expand("Branch 1");
  const hierarchy = dashboard.hierarchy;

  for (const name of ["James Walker", "Maria Gutierrez", "Robert Chen", "Sarah Smith"]) {
    const expand = dashboard.expandButton(name);
    const advisorRow = hierarchy.getByRole("row").filter({ has: expand });
    const reportedValues = expectedRows.find(([rowName]) => rowName === name)![1];
    await expect(advisorRow.locator("td")).toHaveText(reportedValues.map(String));
    await expand.focus();
    await page.keyboard.press("Space");
    const collapse = dashboard.collapseButton(name);
    await expect(collapse).toHaveAttribute("aria-expanded", "true");

    for (const channel of ["Existing clients", "New organic", "New paid"]) {
      const row = hierarchy.getByRole("row", { name: new RegExp(`${channel} Level 4, within Company, Branch 1, ${name}`) });
      await expect(row).toBeVisible();
      await expect(row.locator("td")).toHaveText(Array(12).fill("-"));
      await expect(row.getByRole("button")).toHaveCount(0);
    }

    await dashboard.selectScope({ label: `Employee: ${name}` });
    const firstBar = dashboard.bars.first();
    await expect(firstBar.locator('[data-series="Unknown channel"]')).toHaveAttribute("data-value", String(reportedValues[0]));
    for (const channel of ["Existing clients", "New organic", "New paid"]) {
      await expect(firstBar.locator(`[data-series="${channel}"]`)).toHaveAttribute("data-value", "0");
    }
    await collapse.focus();
    await page.keyboard.press("Enter");
    await expect(expand).toHaveAttribute("aria-expanded", "false");
    await expect(hierarchy.locator('[data-node-kind="channel"]')).toHaveCount(0);
  }

  await dashboard.expand("Anna Blackwood");
  await expect(hierarchy.getByRole("row", { name: /Existing clients/ }).locator("td")).toHaveText(expectedRows[3][1].map(String));
  await expect(dashboard.expandButton("Branch 2")).toHaveCount(0);
  await expect(dashboard.expandButton("Branch 3")).toHaveCount(0);
});

test("uses API avatar URLs independently of employee IDs and names", async ({ page, request, dashboard }) => {
  const clients = await (await request.get("/api/clients")).json();
  const employees: { id: string; name: string; avatarUrl: string }[] = clients.data.branches[0].employees;
  employees[0].name = "Renamed Advisor";
  employees[0].id = "renamed-id";
  employees[0].avatarUrl = employees[1].avatarUrl;
  await page.route("**/api/clients", (route) => route.fulfill({ json: clients }));

  await dashboard.goto();
  await expect(dashboard.employeeRows).toHaveCount(0);
  await dashboard.expand("Branch 1");
  for (const employee of employees) {
    const avatar = dashboard.row(employee.id).locator("img");
    await expect(avatar).toHaveAttribute("src", employee.avatarUrl);
    await expect.poll(() => avatar.evaluate((image: HTMLImageElement) => image.naturalWidth))
      .toBeGreaterThan(0);
  }
  await expect(dashboard.expandButton("Renamed Advisor")).toBeVisible();
});

test("shows initials when employee portraits are missing or fail to load", async ({ page, request, dashboard }) => {
  const clients = await (await request.get("/api/clients")).json();
  const employees: { id: string; name: string; avatarUrl: string | null }[] = clients.data.branches[0].employees;
  employees[2].avatarUrl = null;
  await page.route("**/api/clients", (route) => route.fulfill({ json: clients }));
  await page.route(`**${employees[0].avatarUrl}`, (route) => route.fulfill({ status: 404 }));
  await page.route(`**${employees[1].avatarUrl}`, (route) => route.abort());

  await dashboard.goto();
  await dashboard.expand("Branch 1");
  for (const employee of employees.slice(0, 3)) {
    const row = dashboard.row(employee.id);
    await expect(row.locator("img")).toHaveCount(0);
    const initials = employee.name.split(" ").map((part) => part[0]).join("");
    await expect(row.getByText(initials, { exact: true })).toBeVisible();
  }
  await expect(dashboard.alert).toHaveCount(0);
});

test("renders the supplied totals for every chart scope and reporting month", async ({ dashboard }) => {
  const months = [
    "Feb 2024", "Mar 2024", "Apr 2024", "May 2024", "Jun 2024", "Jul 2024",
    "Aug 2024", "Sep 2024", "Oct 2024", "Nov 2024", "Dec 2024", "Jan 2025",
  ];
  await dashboard.goto();
  for (const [scope, values] of expectedRows) {
    await test.step(scope, async () => {
      await dashboard.selectScope({ label: expectedScopeLabels[scope] });
      await expect(dashboard.bars).toHaveCount(months.length);
      for (const [month, total] of values.entries()) {
        await expect(dashboard.bars.nth(month)).toHaveAccessibleName(
          new RegExp(`^${months[month]}, ${scope}: ${total} reported clients\\.`),
        );
      }
    });
  }
});

test("selects chart rows while preserving the backend hierarchy order", async ({ page, dashboard }) => {
  await page.route("**/api/clients", (route) => route.fulfill({ json: createClientsDataset({
    months: ["2026-10"],
    data: {
      id: "company", name: "Company", values: [10],
      branches: [
        {
          id: "branch-10", name: "Branch 10", values: [8],
          employees: [{
            id: "zoe", name: "Zoe", values: [8],
            channels: [
              { id: "paid", name: "New paid", values: [2] },
              { id: "existing", name: "Existing clients", values: [4] },
              { id: "organic", name: "New organic", values: [2] },
            ],
          }],
        },
        {
          id: "branch-2", name: "Branch 2", values: [2],
          employees: [{ id: "anna", name: "anna", values: [2] }],
        },
      ],
    },
  }) }));
  await dashboard.goto();
  await expect.poll(() => dashboard.rows.evaluateAll((rows) => rows.map((row) => row.getAttribute("data-row-id"))))
    .toEqual(["company", "branch-10", "branch-2"]);
  await dashboard.selectScope({ label: "Employee: anna" });
  await expect(dashboard.row("anna").getByRole("button", { name: "Show chart for anna" })).toHaveAttribute("aria-pressed", "true");
  await expect(dashboard.bars).toHaveAttribute("aria-label", /2 reported clients/);
});

test("distinguishes scopes with identical names by type and preserves ID-based selection", async ({ page, dashboard }) => {
  await page.route("**/api/clients", (route) => route.fulfill({ json: createClientsDataset({
    months: ["2026-10"],
    data: {
      id: "company", name: "Alex", values: [30],
      branches: [{
        id: "branch", name: "Alex", values: [20],
        employees: [{ id: "employee", name: "Alex", values: [10] }],
      }],
    },
  }) }));
  await dashboard.goto();
  for (const [label, id, total] of [
    ["Company: Alex", "company", "30"],
    ["Branch: Alex", "branch", "20"],
    ["Employee: Alex", "employee", "10"],
  ]) {
    await dashboard.selectScope({ label });
    await expect(dashboard.row(id).getByRole("button", { name: "Show chart for Alex" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText(`Chart scope: ${label}`, { exact: true })).toHaveAttribute("aria-live", "polite");
    await expect(dashboard.bars).toHaveAttribute("aria-label", new RegExp(`${total} reported clients`));
  }
});

test("toggles chart series with mouse and keyboard while preserving scope state", async ({ page, dashboard }) => {
  await dashboard.goto();
  const legend = dashboard.legend;
  const labels = ["Existing clients", "New organic", "New paid", "Unknown channel"];
  await expect(legend.getByRole("button")).toHaveText(labels);
  const unknown = dashboard.legendButton("Unknown channel");
  const existing = dashboard.legendButton("Existing clients");
  const scale = dashboard.scaleMaximum;
  const bars = dashboard.bars;
  await unknown.click();
  await expect(unknown).toHaveAttribute("aria-pressed", "false");
  await expect(scale).toHaveText("40");
  await existing.focus();
  await page.keyboard.press("Space");
  await expect(existing).toHaveAttribute("aria-pressed", "false");
  await expect(scale).toHaveText("4");
  await expect(bars.nth(3).locator('[data-series="Existing clients"]')).toHaveAttribute("data-value", "0");
  await expect(bars.nth(3).locator('[data-series="Unknown channel"]')).toHaveAttribute("data-value", "0");
  await expect(bars.nth(3).locator('[data-series="New organic"]')).toHaveAttribute("data-value", "1");
  await bars.nth(3).focus();
  await expect(dashboard.status).toContainText("New organic: 1");
  await expect(dashboard.status).not.toContainText("Existing clients:");
  await expect(dashboard.status).not.toContainText("Unknown channel:");
  for (const [scope, total] of [["Branch: Branch 2", "76"], ["Employee: James Walker", "12"]] as const) {
    await dashboard.selectScope({ label: scope });
    await expect(unknown).toHaveAttribute("aria-pressed", "false");
    await expect(existing).toHaveAttribute("aria-pressed", "false");
    await expect(dashboard.legendButton("New organic")).toHaveAttribute("aria-pressed", "true");
    await expect(dashboard.legendButton("New paid")).toHaveAttribute("aria-pressed", "true");
    await expect(dashboard.status).toContainText("A little quiet here!");
    await expect(bars).toHaveCount(0);
    await expect(scale).toHaveCount(0);
    await unknown.focus();
    await page.keyboard.press("Space");
    await expect(unknown).toBeFocused();
    await expect(bars).toHaveCount(12);
    await expect(bars.first().locator('[data-series="Unknown channel"]')).toHaveAttribute("data-value", total);
    await page.keyboard.press("Space");
    await expect(dashboard.status).toContainText("A little quiet here!");
  }
  await dashboard.selectScope({ label: "Company: Company" });
  await expect(bars).toHaveCount(12);
  await dashboard.legendButton("New organic").click();
  await dashboard.legendButton("New paid").click();
  for (const label of labels) {
    await expect(dashboard.legendButton(label)).toHaveAttribute("aria-pressed", "false");
  }
  await expect(dashboard.status).toHaveText("A little quiet here! Pick a channel in the legend below to bring the chart to life.");
  await expect(bars).toHaveCount(0);
  await expect(scale).toHaveCount(0);
  await expect(legend.getByRole("button")).toHaveCount(4);
  await unknown.focus();
  await page.keyboard.press("Space");
  await expect(unknown).toBeFocused();
  await expect(dashboard.status).toHaveCount(0);
  await expect(bars).toHaveCount(12);
  await expect(unknown).toHaveAttribute("aria-pressed", "true");
  await expect(bars.first().locator('[data-series="Unknown channel"]')).toHaveAttribute("data-value", "225");
});

test("renders bar heights and stack positions from the supplied figures", async ({ page, dashboard }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const cases = [
    { scope: "Company", month: 0, maximum: 400, plotted: 250, segments: [25, 0, 0, 225] },
    { scope: "Branch 2", month: 0, maximum: 100, plotted: 76, segments: [0, 0, 0, 76] },
    { scope: "Anna Blackwood", month: 3, maximum: 40, plotted: 31, segments: [28, 1, 1, 1] },
    { scope: "Anna Blackwood", month: 7, maximum: 40, plotted: 28, segments: [25, 1, 2, 0] },
    { scope: "New organic", month: 1, maximum: 4, plotted: 1, segments: [0, 1, 0, 0] },
  ];

  await dashboard.goto();
  for (const scenario of cases) {
    await test.step(`${scenario.scope}, month ${scenario.month + 1}`, async () => {
      await dashboard.selectScope({ label: expectedScopeLabels[scenario.scope] });
      const bar = dashboard.bars.nth(scenario.month);
      await expect(bar).toBeVisible();
      const bounds = await bar.evaluate((element) => ({
        height: element.getBoundingClientRect().height,
        bottom: element.getBoundingClientRect().bottom,
        plotHeight: element.parentElement!.getBoundingClientRect().height,
      }));
      const pixelsPerClient = bounds.plotHeight / scenario.maximum;
      expect(Math.abs(bounds.height - scenario.plotted * pixelsPerClient)).toBeLessThan(1);

      let clientsBelow = 0;
      for (const [index, value] of scenario.segments.entries()) {
        const segment = bar.locator("[data-series]").nth(index);
        const segmentBounds = await segment.evaluate((element) => ({
          height: element.getBoundingClientRect().height,
          bottom: element.getBoundingClientRect().bottom,
        }));
        expect(Math.abs(segmentBounds.height - value * pixelsPerClient)).toBeLessThan(1);
        if (value > 0) {
          await expect(segment).toBeVisible();
          expect(
            Math.abs(segmentBounds.bottom - (bounds.bottom - clientsBelow * pixelsPerClient)),
          ).toBeLessThan(1);
        }
        clientsBelow += value;
      }
    });
  }
});

test("dismisses chart tooltips with Escape after hover, focus, and click", async ({ page, dashboard }) => {
  await dashboard.goto();
  const bars = dashboard.bars;
  const tooltip = dashboard.status;
  await expect(bars).toHaveCount(12);

  await bars.nth(0).hover();
  await expect(bars.nth(0)).not.toBeFocused();
  await expect(tooltip).toContainText("Feb 2024 · Company");
  await expect(tooltip).toContainText("Unknown channel: 225");
  await page.keyboard.press("Escape");
  await expect(tooltip).toBeHidden();

  await bars.nth(1).hover();
  await expect(tooltip).toContainText("Mar 2024 · Company");
  await page.keyboard.press("Escape");
  await expect(tooltip).toBeHidden();

  await bars.nth(0).focus();
  await expect(tooltip).toContainText("Feb 2024 · Company");
  await page.keyboard.press("Escape");
  await expect(tooltip).toBeHidden();
  await expect(bars.nth(0)).toBeFocused();

  await bars.nth(1).click();
  await expect(tooltip).toContainText("Mar 2024 · Company");
  await page.keyboard.press("Escape");
  await expect(tooltip).toBeHidden();

  await dashboard.selectScope({ label: "Employee: Anna Blackwood" });
  await bars.nth(7).focus();
  await expect(tooltip).toContainText("Reported total: 27");
  await expect(tooltip).toContainText("Channel sum exceeds reported total by 1.");
});

test("keeps chart tooltips reachable and selectable at both chart edges", async ({ page, dashboard }) => {
  await dashboard.goto();
  const bars = dashboard.bars;
  const tooltip = dashboard.status;
  const labels = ["Existing clients", "New organic", "New paid", "Unknown channel"];

  for (const width of [1280, 375]) {
    await page.setViewportSize({ width, height: 800 });
    for (const index of [0, 11]) {
      await bars.nth(index).hover();
      await expect(tooltip).toBeVisible();
      await expect(tooltip).toBeInViewport({ ratio: 1 });
      if (width === 1280 && index === 0) {
        for (const label of labels) {
          const swatch = tooltip.getByText(new RegExp(`^${label}:`)).locator("..").locator('[aria-hidden="true"]');
          const legendSwatch = dashboard.legendButton(label).locator("span");
          await expect(swatch).toHaveCSS("background", await legendSwatch.evaluate((element) => getComputedStyle(element).background));
        }
      }
      await tooltip.hover();
      if (index === 0) {
        const text = tooltip.getByText(/^Existing clients:/);
        const bounds = (await text.boundingBox())!;
        await page.mouse.move(bounds.x + 1, bounds.y + bounds.height / 2);
        await page.mouse.down();
        await page.mouse.move(bounds.x + bounds.width - 1, bounds.y + bounds.height / 2, { steps: 10 });
        await page.mouse.up();
        expect(await page.evaluate(() => window.getSelection()?.toString())).toContain("Existing clients");
      }
      // Stay past the hover-dismiss grace period to catch premature closing.
      await page.waitForTimeout(350);
      await expect(tooltip).toBeVisible();
      await page.mouse.move(0, 0);
      await expect(tooltip).toBeHidden();
    }
  }
});

test("shows a loading state while the API request is pending", async ({ page, dashboard }) => {
  let releaseResponse!: () => void;
  const responseGate = new Promise<void>((resolve) => {
    releaseResponse = resolve;
  });
  await page.route("**/api/clients", async (route) => {
    await responseGate;
    await route.continue();
  });

  try {
    await dashboard.goto();
    await expect(dashboard.status).toContainText("Loading client data");
  } finally {
    releaseResponse();
  }
  await expect(dashboard.collapseButton("Company")).toBeVisible();
});

test("shows an API error and retries the request", async ({ page, dashboard }) => {
  let attempts = 0;
  await page.route("**/api/clients", async (route) => {
    attempts += 1;
    if (attempts === 1) {
      await route.fulfill({ status: 503, body: "Unavailable" });
      return;
    }
    await route.continue();
  });

  await dashboard.goto();
  await expect(dashboard.alert).toContainText("Client data unavailable");
  await dashboard.retryButton.click();
  await expect(dashboard.collapseButton("Company")).toBeVisible();
  expect(attempts).toBe(2);
});

test("keeps chart controls in the viewport and scrolls the hierarchy locally", async ({ page, dashboard }) => {
  await dashboard.goto();
  await expect(dashboard.collapseButton("Company")).toBeVisible();
  await dashboard.selectScope({ label: "Branch: Branch 2" });
  const scrollHint = page.getByText("Scroll horizontally to see all months.", { exact: true });
  for (const width of [320, 375, 768, 1280, 1600, 1280]) {
    await test.step(`${width}px viewport`, async () => {
      await page.setViewportSize({ width, height: 800 });
      await expect(dashboard.resetChart).toBeVisible();
      const bounds = (await dashboard.resetChart.boundingBox())!;
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
      expect(await page.evaluate(() => document.documentElement.scrollWidth))
        .toBeLessThanOrEqual(width);
      if (width === 1600) {
        await expect(scrollHint).toHaveCount(0);
        await expect(dashboard.hierarchy).not.toHaveAttribute("aria-describedby");
      } else {
        await expect(scrollHint).toBeVisible();
        await expect(dashboard.hierarchy).toHaveAccessibleDescription("Scroll horizontally to see all months.");
      }
      if (width <= 375) {
        await dashboard.hierarchy.evaluate((element) => { element.scrollLeft = element.scrollWidth; });
        await expect.poll(() => dashboard.hierarchy.evaluate((element) => element.scrollLeft))
          .toBeGreaterThan(0);
        await expect(dashboard.hierarchy.getByRole("columnheader", { name: "Jan 2025", exact: true }))
          .toBeInViewport();
      }
    });
  }
});


test("reveals row chart actions on hover and keyboard focus and resets chart customizations", async ({ page, dashboard }) => {
  await dashboard.goto();
  await expect(dashboard.collapseButton("Company")).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Chart scope" })).toHaveCount(0);
  await expect(dashboard.resetChart).toHaveCount(0);
  const branch = dashboard.rows.filter({ has: dashboard.expandButton("Branch 1") });
  const action = branch.getByRole("button", { name: "Show chart for Branch 1", exact: true });
  await expect(action).toHaveCSS("opacity", "0");
  await branch.locator("td").first().hover();
  await expect(action).toHaveCSS("opacity", "1");
  await action.hover();
  const tooltip = page.getByRole("tooltip");
  await expect(tooltip).toContainText("Show monthly clients for Branch 1.");
  await tooltip.hover();
  await expect(tooltip).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(tooltip).toHaveCount(0);
  await branch.hover();
  await action.click();
  await expect(page.getByRole("figure", { name: "Monthly clients for Branch 1", exact: true })).toBeVisible();
  await expect(dashboard.expandButton("Branch 1")).toBeVisible();
  await expect(dashboard.resetChart).toBeVisible();
  await dashboard.legendButton("Existing clients").click();
  await dashboard.resetChart.click();
  await expect(page.getByRole("figure", { name: "Monthly clients for Company", exact: true })).toBeVisible();
  await expect(dashboard.legendButton("Existing clients")).toHaveAttribute("aria-pressed", "true");
  await expect(dashboard.resetChart).toHaveCount(0);
  await dashboard.expandButton("Branch 1").focus();
  await page.keyboard.press("Tab");
  await expect(action).toBeFocused();
  await expect(action).toHaveCSS("opacity", "1");
  await expect(tooltip).toContainText("Filter chart");
  await page.keyboard.press("Enter");
  await expect(action).toHaveAttribute("aria-pressed", "true");
  await dashboard.resetChart.click();
  await dashboard.legendButton("New paid").click();
  await expect(dashboard.resetChart).toBeVisible();
  await dashboard.resetChart.click();
  await expect(dashboard.legendButton("New paid")).toHaveAttribute("aria-pressed", "true");
  await expect(dashboard.resetChart).toHaveCount(0);
});

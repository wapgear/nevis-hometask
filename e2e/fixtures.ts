import { test as base } from "@playwright/test";
import { DashboardPage } from "./pages/dashboard.page";

export { expect } from "@playwright/test";

export const test = base.extend<{ dashboard: DashboardPage }>({
  dashboard: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
});

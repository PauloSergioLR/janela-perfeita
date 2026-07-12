import { expect, test, type Page } from "@playwright/test";

const VIEWPORTS = [
  { width: 1280, height: 720 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1600, height: 900 },
  { width: 1920, height: 1080 },
] as const;

async function openDailyOverview(page: Page) {
  await page.goto("/?demo=true");
  await page.getByRole("radio", { name: "Consulta do dia" }).click();
  await page.getByLabel("Cidade").fill("demo");
  await page.getByRole("option", { name: /Cric/i }).first().click();

  const response = page.waitForResponse(
    (item) =>
      item.url().includes("/api/recommendation") &&
      item.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Consultar dia" }).click();
  await expect((await response).ok()).toBe(true);
  await expect(page.getByLabel("Timeline horária")).toBeVisible();
}

test.describe("navegação da Timeline horária", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(60_000);

  for (const viewport of VIEWPORTS) {
    test(`percorre 00:00–23:00 em ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await openDailyOverview(page);

      const timeline = page.getByLabel("Timeline horária");
      const scroller = timeline.getByTestId("hourly-timeline-scroll");
      const previous = timeline.getByRole("button", { name: "Ver horários anteriores" });
      const next = timeline.getByRole("button", { name: "Ver próximos horários" });

      await expect(timeline.getByRole("listitem")).toHaveCount(24);
      await expect(timeline.getByText("00:00", { exact: true })).toBeVisible();
      await expect(previous).toBeDisabled();
      await expect(next).toBeEnabled();

      if (viewport.width === 1440) {
        await timeline.screenshot({ path: "test-results/issue-223/timeline-inicial-1440x900.png" });
      }

      await next.click();
      await expect.poll(() => scroller.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
      await expect(previous).toBeEnabled();

      if (viewport.width === 1440) {
        await timeline.screenshot({ path: "test-results/issue-223/timeline-intermediaria-1440x900.png" });
      }

      for (let attempt = 0; attempt < 8; attempt += 1) {
        await next.evaluate((button: HTMLButtonElement) => {
          if (!button.disabled) button.click();
        });
        await page.waitForTimeout(500);
      }

      await expect(next).toBeDisabled();
      await expect(timeline.getByText("23:00", { exact: true })).toBeVisible();

      if (viewport.width === 1440) {
        await timeline.screenshot({ path: "test-results/issue-223/timeline-final-1440x900.png" });
      }

      for (let attempt = 0; attempt < 8; attempt += 1) {
        await previous.evaluate((button: HTMLButtonElement) => {
          if (!button.disabled) button.click();
        });
        await page.waitForTimeout(500);
      }

      await expect(previous).toBeDisabled();
      await expect(timeline.getByText("00:00", { exact: true })).toBeVisible();
    });
  }
});

import { expect, test, type Page } from "@playwright/test";

const MOBILE_VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 360, height: 800 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 412, height: 915 },
  { width: 430, height: 932 },
] as const;

const TABLET_VIEWPORTS = [
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
] as const;

const MODES = [
  { cta: "Encontrar janela", name: "Janela perfeita" },
  { cta: "Ver o que fazer", name: "O que fazer hoje?" },
  { cta: "Consultar dia", name: "Consulta do dia" },
  { cta: "Consultar semana", name: "Consulta da semana" },
] as const;

async function openMobileDemo(page: Page) {
  await page.goto("/?demo=true");
  await expect(
    page.getByRole("heading", { name: "Janela Perfeita" }),
  ).toBeVisible();
}

async function expectNoPageOverflow(page: Page, context: string) {
  const sizes = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    document: document.documentElement.scrollWidth,
    viewport: window.innerWidth,
  }));

  expect(
    sizes.body,
    `${context}: body não deve rolar horizontalmente`,
  ).toBeLessThanOrEqual(sizes.viewport + 2);
  expect(
    sizes.document,
    `${context}: documento não deve rolar horizontalmente`,
  ).toBeLessThanOrEqual(sizes.viewport + 2);
}

async function selectDemoCity(page: Page) {
  await page.getByLabel("Cidade").fill("demo");
  await page.getByRole("option", { name: /Cric/i }).first().click();
}

test.describe("experiência mobile", () => {
  for (const viewport of MOBILE_VIEWPORTS) {
    test(`mantém controles e modos acessíveis em ${viewport.width}x${viewport.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await openMobileDemo(page);

      for (const mode of MODES) {
        const control = page.getByRole("radio", { name: mode.name });
        await control.scrollIntoViewIfNeeded();
        await control.click();
        await expect(control).toHaveAttribute("aria-checked", "true");

        const cta = page.getByRole("button", { name: mode.cta });
        await cta.scrollIntoViewIfNeeded();
        await expect(cta).toBeVisible();
      }

      await expectNoPageOverflow(
        page,
        `modo Consulta da semana em ${viewport.width}px`,
      );
    });
  }

  for (const viewport of TABLET_VIEWPORTS) {
    test(`mantém a transição para desktop sem overflow em ${viewport.width}x${viewport.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await openMobileDemo(page);
      await expectNoPageOverflow(page, `transição em ${viewport.width}px`);
    });
  }

  test("consulta diária mantém a timeline em rolagem horizontal própria", async ({ page }) => {
    await openMobileDemo(page);
    await page.getByRole("radio", { name: "Consulta do dia" }).click();
    await selectDemoCity(page);

    const response = page.waitForResponse(
      (item) =>
        item.url().includes("/api/recommendation") &&
        item.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Consultar dia" }).click();
    await expect((await response).ok()).toBe(true);

    const timeline = page.getByLabel("Timeline horária");
    await timeline.scrollIntoViewIfNeeded();
    const scroller = timeline.getByTestId("hourly-timeline-scroll");
    await expect
      .poll(() =>
        scroller.evaluate((element) => element.scrollWidth > element.clientWidth),
      )
      .toBe(true);
    await page.getByRole("button", { name: "Ver próximos horários" }).click();
    await expect.poll(() => scroller.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    await expectNoPageOverflow(page, "timeline diária");
  });

  test("preserva resultado, histórico, tema, compartilhamento e timeline da recomendação", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("theme", "light");
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: async () => undefined,
      });
    });
    await openMobileDemo(page);

    await page.getByRole("button", { name: "Mudar para tema escuro" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);

    await selectDemoCity(page);
    await page.getByRole("radio", { name: "Correr" }).click();
    await page.getByRole("button", { name: "Hoje" }).click();

    const response = page.waitForResponse(
      (item) =>
        item.url().includes("/api/recommendation") &&
        item.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Encontrar janela" }).click();
    await expect((await response).ok()).toBe(true);
    await expect(page.getByText("Janela recomendada")).toBeVisible();

    await page.getByRole("button", { name: "Compartilhar" }).click();
    await expect(page.getByText("Compartilhado")).toBeVisible();

    const history = page.locator("details").first();
    await history.locator("summary").click();
    await expect(history.getByText("Buscas recentes")).toBeVisible();

    await page.getByRole("tab", { name: "Por hora" }).click();
    const opportunityScroller = page.getByTestId("opportunity-timeline-scroll");
    await opportunityScroller.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        opportunityScroller.evaluate(
          (element) => element.scrollWidth > element.clientWidth,
        ),
      )
      .toBe(true);
    await expectNoPageOverflow(page, "resultado da recomendação");
  });
});

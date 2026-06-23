import { expect, test, type Page } from "@playwright/test";

async function openHome(page: Page) {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Janela Perfeita" }),
  ).toBeVisible();
}

async function selectCity(page: Page, query: string) {
  await page.getByLabel("Cidade").fill(query);
  await page.getByRole("option", { name: /Cric/i }).first().click();
}

test("fluxo principal gera recomendação real", async ({ page }) => {
  await openHome(page);
  await selectCity(page, "Criciuma");
  await page.getByRole("radio", { name: /Correr/ }).click();
  await page.getByRole("button", { name: "Hoje" }).click();

  const recommendationResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/recommendation") &&
      response.request().method() === "POST",
  );

  await page.getByRole("button", { name: "Encontrar janela" }).click();
  await expect((await recommendationResponse).ok()).toBe(true);

  await expect(page.getByText("Recomendação", { exact: true })).toBeVisible();
  await expect(page.getByText("Score", { exact: true })).toBeVisible();
  await expect(page.getByText("Janela recomendada")).toBeVisible();
  await expect(
    page.getByText("Motivos da recomendação", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Estatísticas climáticas", { exact: true }),
  ).toBeVisible();
  const timeline = page.getByLabel("Timeline de oportunidade");
  await timeline.getByRole("button", { name: /score \d+ de 100/i }).nth(1).click();
  await expect(timeline.getByLabel(/Detalhes de/)).toBeVisible();
  await expect(page.getByLabel("Previsão dos próximos dias")).toBeVisible();
  await expect(page.getByText(/\/100/).first()).toBeVisible();
  await expect(page.getByText("Timeline de scores")).toBeVisible();
});

test("busca de cidade exibe estado sem resultado real", async ({ page }) => {
  await openHome(page);
  await page.getByLabel("Cidade").fill("cidadeinexistentejanela");

  await expect(
    page.getByRole("heading", { name: "Nenhuma cidade encontrada" }),
  ).toBeVisible();
});

test("cockpit desktop mantem paineis na viewport", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await openHome(page);

  const controlPanel = page.getByText("Painel de controle", { exact: true });
  const resultPanel = page.getByLabel(/Resultado/);
  const submitButton = page.getByRole("button", {
    name: "Encontrar janela",
  });

  await expect(controlPanel).toBeVisible();
  await expect(resultPanel).toBeVisible();
  await expect(page.getByLabel("Cidade")).toBeVisible();
  await expect(submitButton).toBeVisible();
  await expect(page.locator("details")).not.toHaveAttribute("open", "");

  const availableFrom = page.locator("#available-from");
  const date = page.locator("#date");
  const activity = page
    .getByRole("radiogroup", { name: "Atividade" })
    .getByRole("radio")
    .first();

  await availableFrom.scrollIntoViewIfNeeded();
  await expect(availableFrom).toBeVisible();
  await date.scrollIntoViewIfNeeded();
  await expect(date).toBeVisible();
  await activity.scrollIntoViewIfNeeded();
  await expect(activity).toBeVisible();
  await expect(submitButton).toBeVisible();

  const layout = await page.evaluate(() => {
    const control = document
      .querySelector("aside")
      ?.getBoundingClientRect();
    const result = document
      .querySelector('[aria-label^="Resultado"]')
      ?.getBoundingClientRect();

    return {
      pageHeight: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight,
      controlRight: control?.right ?? 0,
      resultLeft: result?.left ?? 0,
    };
  });

  expect(layout.pageHeight).toBeLessThanOrEqual(layout.viewportHeight);
  expect(layout.resultLeft).toBeGreaterThan(layout.controlRight);
});

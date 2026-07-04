import { expect, test, type Page } from "@playwright/test";

async function openHome(page: Page, path = "/") {
  await page.goto(path);
  await expect(
    page.getByRole("heading", { name: "Janela Perfeita" }),
  ).toBeVisible();
}

async function selectCity(page: Page, query: string) {
  await page.getByLabel("Cidade").fill(query);
  await page.getByRole("option", { name: /Cric/i }).first().click();
}

test("fluxo principal gera recomendação em modo demo", async ({ page }) => {
  await openHome(page, "/?demo=true");
  await selectCity(page, "demo");
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

test("busca de cidade exibe estado sem resultado", async ({ page }) => {
  await page.route("**/api/geocoding**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: { cities: [] },
      status: 200,
    });
  });

  await openHome(page);
  await page.getByLabel("Cidade").fill("cidadeinexistentejanela");

  await expect(
    page.getByRole("heading", { name: "Nenhuma cidade encontrada" }),
  ).toBeVisible();
});

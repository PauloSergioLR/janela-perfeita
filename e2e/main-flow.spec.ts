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
  await expect(page.getByText(/\/100/).first()).toBeVisible();
  await expect(page.getByText("Timeline de scores")).toBeVisible();
});

test("busca de cidade exibe estado sem resultado real", async ({ page }) => {
  await openHome(page);
  await page.getByLabel("Cidade").fill("cidadeinexistentejanela");

  await expect(
    page.getByText("Nenhuma cidade encontrada. Tente ajustar o nome."),
  ).toBeVisible();
});

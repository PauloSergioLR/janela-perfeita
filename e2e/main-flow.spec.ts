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
  await page.setViewportSize({ width: 1366, height: 768 });
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

  await expect(page.getByText("Melhor janela para", { exact: true })).toBeVisible();
  await expect(page.getByText("Score", { exact: true })).toBeVisible();
  await expect(page.getByText("Janela recomendada")).toBeVisible();
  await expect(
    page.getByText("Por que esta é uma boa janela?", { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Estatísticas climáticas")).toBeVisible();
  const timeline = page.getByLabel("Timeline de oportunidade");
  const selectedHour = timeline.getByRole("button", { name: /score \d+ de 100/i }).nth(1);
  await selectedHour.click();
  await expect(selectedHour).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Previsão dos próximos dias")).toBeVisible();
  await expect(page.getByText(/\/100/).first()).toBeVisible();
  await expect(
    page.getByText("Pontuação de oportunidade por hora", { exact: true }),
  ).toBeVisible();

  const cockpitBounds = await page.evaluate(() => {
    const elements = [
      document.querySelector('[aria-label="Resultado da decisão"]'),
      document.querySelector('[aria-label="Previsão dos próximos dias"]'),
    ];

    return {
      bottoms: elements.map((element) => element?.getBoundingClientRect().bottom ?? 0),
      viewportHeight: window.innerHeight,
    };
  });

  expect(
    cockpitBounds.bottoms.every((bottom) => bottom <= cockpitBounds.viewportHeight),
  ).toBe(true);
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

for (const [label, width, height] of [
  ["1366x768", 1366, 768],
  ["1440x900", 1440, 900],
  ["1600x900", 1600, 900],
  ["1920x1080", 1920, 1080],
] as const) {
  test(`cockpit desktop ${label} não cria página longa`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await openHome(page);

    const layout = await page.evaluate(() => ({
      pageHeight: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight,
    }));

    await expect(page.getByLabel("Cidade")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Encontrar janela" }),
    ).toBeVisible();
    expect(layout.pageHeight).toBeLessThanOrEqual(layout.viewportHeight);
  });
}

test("cockpit mobile preserva formulário e rolagem normal", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openHome(page);

  const submitButton = page.getByRole("button", {
    name: "Encontrar janela",
  });

  await expect(page.getByLabel("Cidade")).toBeVisible();
  await submitButton.scrollIntoViewIfNeeded();
  await expect(submitButton).toBeVisible();
});

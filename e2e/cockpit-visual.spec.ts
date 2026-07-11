import { expect, test, type Locator, type Page } from "@playwright/test";

const DESKTOP_VIEWPORTS = [
  { width: 1280, height: 720 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1600, height: 900 },
  { width: 1920, height: 1080 },
] as const;

const MAIN_MODES = [
  { cta: "Encontrar janela", name: "Janela perfeita" },
  { cta: "Ver o que fazer", name: "O que fazer hoje?" },
  { cta: "Consultar dia", name: "Consulta do dia" },
  { cta: "Consultar semana", name: "Consulta da semana" },
] as const;

const LAYOUT_TOLERANCE_PX = 4;

async function expectNoIntersection(
  first: Locator,
  second: Locator,
  label: string,
) {
  const [firstBox, secondBox] = await Promise.all([
    first.boundingBox(),
    second.boundingBox(),
  ]);

  expect(firstBox, `${label}: primeiro elemento deve existir`).not.toBeNull();
  expect(secondBox, `${label}: segundo elemento deve existir`).not.toBeNull();

  if (!firstBox || !secondBox) {
    return;
  }

  const horizontalGap = Math.max(
    secondBox.x - (firstBox.x + firstBox.width),
    firstBox.x - (secondBox.x + secondBox.width),
  );
  const verticalGap = Math.max(
    secondBox.y - (firstBox.y + firstBox.height),
    firstBox.y - (secondBox.y + secondBox.height),
  );

  expect(
    Math.max(horizontalGap, verticalGap),
    `${label}: elementos não devem se sobrepor`,
  ).toBeGreaterThanOrEqual(-LAYOUT_TOLERANCE_PX);
}

async function expectContained(
  container: Locator,
  child: Locator,
  label: string,
) {
  const [containerBox, childBox] = await Promise.all([
    container.boundingBox(),
    child.boundingBox(),
  ]);

  expect(containerBox, `${label}: container deve existir`).not.toBeNull();
  expect(childBox, `${label}: conteúdo deve existir`).not.toBeNull();

  if (!containerBox || !childBox) {
    return;
  }

  expect(childBox.x).toBeGreaterThanOrEqual(
    containerBox.x - LAYOUT_TOLERANCE_PX,
  );
  expect(childBox.y).toBeGreaterThanOrEqual(
    containerBox.y - LAYOUT_TOLERANCE_PX,
  );
  expect(childBox.x + childBox.width).toBeLessThanOrEqual(
    containerBox.x + containerBox.width + LAYOUT_TOLERANCE_PX,
  );
  expect(childBox.y + childBox.height).toBeLessThanOrEqual(
    containerBox.y + containerBox.height + LAYOUT_TOLERANCE_PX,
  );
}

async function openCockpitDemo(page: Page) {
  await page.goto("/?demo=true");
  await expect(
    page.getByRole("heading", { name: "Janela Perfeita" }),
  ).toBeVisible();
}

async function selectDemoCity(page: Page) {
  await page.getByLabel("Cidade").fill("demo");
  await page.getByRole("option", { name: /Cric/i }).first().click();
}

async function expectNoHorizontalOverflow(page: Page, context: string) {
  const metrics = await page.evaluate(() => {
    const main = document.querySelector("main");
    const resultPanel = document.querySelector(
      '[aria-label="Resultado da decisão"]',
    );

    return {
      bodyClientWidth: document.body.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
      documentClientWidth: document.documentElement.clientWidth,
      documentScrollWidth: document.documentElement.scrollWidth,
      mainClientWidth: main?.clientWidth ?? 0,
      mainScrollWidth: main?.scrollWidth ?? 0,
      resultClientWidth: resultPanel?.clientWidth ?? 0,
      resultScrollWidth: resultPanel?.scrollWidth ?? 0,
    };
  });

  expect(
    metrics.documentScrollWidth,
    `${context}: documento não deve gerar overflow horizontal`,
  ).toBeLessThanOrEqual(metrics.documentClientWidth + LAYOUT_TOLERANCE_PX);
  expect(
    metrics.bodyScrollWidth,
    `${context}: body não deve gerar overflow horizontal`,
  ).toBeLessThanOrEqual(metrics.bodyClientWidth + LAYOUT_TOLERANCE_PX);
  expect(
    metrics.mainScrollWidth,
    `${context}: cockpit principal não deve gerar overflow horizontal`,
  ).toBeLessThanOrEqual(metrics.mainClientWidth + LAYOUT_TOLERANCE_PX);
  expect(
    metrics.resultScrollWidth,
    `${context}: painel de resultado não deve gerar overflow horizontal`,
  ).toBeLessThanOrEqual(metrics.resultClientWidth + LAYOUT_TOLERANCE_PX);
}

async function expectNoDesktopPageScroll(page: Page, context: string) {
  const metrics = await page.evaluate(() => ({
    bodyScrollHeight: document.body.scrollHeight,
    documentScrollHeight: document.documentElement.scrollHeight,
    viewportHeight: window.innerHeight,
  }));

  expect(
    metrics.documentScrollHeight,
    `${context}: documento não deve virar página longa no desktop`,
  ).toBeLessThanOrEqual(metrics.viewportHeight + LAYOUT_TOLERANCE_PX);
  expect(
    metrics.bodyScrollHeight,
    `${context}: body não deve virar página longa no desktop`,
  ).toBeLessThanOrEqual(metrics.viewportHeight + LAYOUT_TOLERANCE_PX);
}

async function expectWithinViewport(locator: Locator, page: Page, label: string) {
  await expect(locator, `${label} deve estar visível`).toBeVisible();

  const box = await locator.boundingBox();
  const viewport = page.viewportSize();

  expect(box, `${label} deve ter área renderizada`).not.toBeNull();
  expect(viewport, "viewport deve estar definido").not.toBeNull();

  if (!box || !viewport) {
    return;
  }

  expect(box.x, `${label} não deve vazar à esquerda`).toBeGreaterThanOrEqual(
    -LAYOUT_TOLERANCE_PX,
  );
  expect(box.x + box.width, `${label} não deve vazar à direita`).toBeLessThanOrEqual(
    viewport.width + LAYOUT_TOLERANCE_PX,
  );
  expect(box.y, `${label} não deve vazar acima`).toBeGreaterThanOrEqual(
    -LAYOUT_TOLERANCE_PX,
  );
  expect(box.y + box.height, `${label} não deve vazar abaixo`).toBeLessThanOrEqual(
    viewport.height + LAYOUT_TOLERANCE_PX,
  );
}

async function expectCockpitLayout(page: Page, context: string) {
  await expectNoHorizontalOverflow(page, context);
  await expectNoDesktopPageScroll(page, context);
  await expectWithinViewport(
    page.getByRole("radiogroup", { name: "Modo" }),
    page,
    `${context}: modos`,
  );
  await expectWithinViewport(
    page.getByLabel("Resultado da decisão"),
    page,
    `${context}: painel principal`,
  );
  await expectWithinViewport(
    page
      .locator(
        'section[aria-label="Resumo da consulta"]:visible, section[aria-label="Previsão dos próximos dias"]:visible, section[aria-label="Faixa climática dos próximos dias"]:visible',
      )
      .first(),
    page,
    `${context}: faixa inferior`,
  );
  await expectNoIntersection(
    page.getByTestId("theme-toggle"),
    page.getByTestId("how-it-works-link"),
    `${context}: tema e Como funciona`,
  );
  await expectNoIntersection(
    page.getByTestId("control-panel"),
    page.getByLabel("Resultado da decisão"),
    `${context}: painel lateral e resultado`,
  );
}

async function expectPerfectWindowControlPanel(page: Page, context: string) {
  const metrics = await page.getByTestId("control-panel").evaluate((panel) => {
    const content = panel.querySelector<HTMLElement>(
      '[data-testid="control-panel-content"]',
    );

    return {
      contentClientHeight: content?.clientHeight ?? 0,
      contentOverflowY: content ? getComputedStyle(content).overflowY : "",
      contentScrollHeight: content?.scrollHeight ?? 0,
      panelWidth: panel.getBoundingClientRect().width,
    };
  });

  expect(
    metrics.panelWidth,
    `${context}: painel lateral deve ficar mais largo`,
  ).toBeGreaterThanOrEqual(420);
  expect(
    metrics.panelWidth,
    `${context}: painel lateral não deve dominar o cockpit`,
  ).toBeLessThanOrEqual(481);
  expect(
    metrics.contentOverflowY,
    `${context}: conteúdo não deve usar rolagem interna`,
  ).toBe("visible");
  expect(
    metrics.contentScrollHeight,
    `${context}: conteúdo deve caber sem cortes`,
  ).toBeLessThanOrEqual(metrics.contentClientHeight + LAYOUT_TOLERANCE_PX);
}

test.describe("QA visual do cockpit desktop", () => {
  for (const viewport of DESKTOP_VIEWPORTS) {
    test(`não gera scroll ou cortes em ${viewport.width}x${viewport.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await openCockpitDemo(page);

      await expectCockpitLayout(page, "estado inicial");
      await expectPerfectWindowControlPanel(page, "estado inicial");
      await expectWithinViewport(
        page.getByRole("button", { name: "Encontrar janela" }),
        page,
        "CTA inicial",
      );

      await selectDemoCity(page);
      await page.getByRole("radio", { name: "Correr" }).click();
      await expectNoIntersection(
        page.getByTestId("activity-selector"),
        page.getByRole("button", { name: "Encontrar janela" }),
        "atividades e CTA",
      );

      const recommendationResponse = page.waitForResponse(
        (response) =>
          response.url().includes("/api/recommendation") &&
          response.request().method() === "POST",
      );

      await page.getByRole("button", { name: "Encontrar janela" }).click();
      await expect((await recommendationResponse).ok()).toBe(true);
      await expect(page.getByText("Janela recomendada")).toBeVisible();
      await expectCockpitLayout(page, "resultado calculado");
      await expectPerfectWindowControlPanel(page, "resultado calculado");
      await expectNoIntersection(
        page.getByTestId("recommendation-summary-main"),
        page.getByTestId("recommendation-reasons"),
        "resumo e motivos",
      );
      await expectContained(
        page.getByLabel("Resultado da decisão"),
        page.getByTestId("weather-stats"),
        "estatísticas dentro do resultado",
      );

      if (viewport.width >= 1800) {
        await expectNoIntersection(
          page.getByTestId("recommendation-reasons"),
          page.getByTestId("recommendation-timeline"),
          "motivos e timeline",
        );
        await expectContained(
          page.getByLabel("Resultado da decisão"),
          page.getByTestId("recommendation-timeline"),
          "timeline dentro do resultado",
        );
      }

      for (const mode of MAIN_MODES) {
        await page.getByRole("radio", { name: mode.name }).click();
        await expect(
          page.getByRole("radio", { name: mode.name }),
        ).toHaveAttribute("aria-checked", "true");
        await expectWithinViewport(
          page.getByRole("button", { name: mode.cta }),
          page,
          `CTA do modo ${mode.name}`,
        );
        await expectCockpitLayout(page, `modo ${mode.name}`);
      }

      await page.goto("/");
      await expect(page.getByText("Comparar modelos Open-Meteo")).toBeVisible();
      await expectPerfectWindowControlPanel(page, "modo padrão");
      await expectWithinViewport(
        page.getByRole("button", { name: "Encontrar janela" }),
        page,
        "CTA com comparação de modelos",
      );
    });
  }
});

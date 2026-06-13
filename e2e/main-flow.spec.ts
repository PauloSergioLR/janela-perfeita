import { expect, test, type Page, type Route } from "@playwright/test";

const city = {
  id: 3460428,
  name: "Criciúma",
  country: "Brasil",
  admin1: "Santa Catarina",
  timezone: "America/Sao_Paulo",
  coordinates: {
    lat: -28.6775,
    lon: -49.3697,
  },
};

const activity = {
  id: "correr",
  name: "Correr",
  shortDescription: "Melhor janela para corrida ao ar livre.",
  minRecommendedScore: 60,
  minDurationHours: 1,
};

function buildScore(time: string, score: number) {
  return {
    time,
    hourLabel: time.slice(11, 16),
    score,
    weather: {
      time,
      temperature_2m: 21,
      apparent_temperature: 21,
      precipitation: 0,
      precipitation_probability: 5,
      rain: 0,
      showers: 0,
      weather_code: 0,
      wind_speed_10m: 8,
      wind_gusts_10m: 14,
      cloud_cover: 30,
      cloud_cover_low: 10,
      cloud_cover_mid: 25,
      cloud_cover_high: 35,
      visibility: 15000,
      sunshine_duration: 2400,
      uv_index: 2,
      relative_humidity_2m: 62,
    },
    breakdown: [
      {
        factor: "temperatura",
        label: "Temperatura",
        score: 90,
        weight: 40,
        reason: "Temperatura confortável para correr.",
      },
      {
        factor: "chuva",
        label: "Chuva",
        score: 100,
        weight: 30,
        reason: "Sem chuva prevista na janela.",
      },
      {
        factor: "vento",
        label: "Vento",
        score: 85,
        weight: 20,
        reason: "Vento fraco para a atividade.",
      },
      {
        factor: "uv",
        label: "UV",
        score: 80,
        weight: 10,
        reason: "Índice UV moderado no horário.",
      },
    ],
  };
}

function buildRecommendation(date: string) {
  const firstScore = buildScore(`${date}T07:00`, 90);
  const secondScore = buildScore(`${date}T08:00`, 86);
  const bestWindow = {
    startTime: firstScore.time,
    endTime: secondScore.time,
    startLabel: "07:00",
    endLabel: "08:00",
    durationHours: 1,
    avgScore: 90,
    peakScore: 90,
    confidence: {
      level: "alta",
      score: 92,
      reason: "Condições estáveis na janela recomendada.",
    },
    highlights: [
      "Sem chuva prevista na janela.",
      "Temperatura confortável para correr.",
    ],
    scores: [firstScore],
  };

  return {
    activity,
    city,
    date,
    generatedAt: `${date}T06:00:00.000Z`,
    scores: [firstScore, secondScore],
    windows: [bestWindow],
    bestWindow,
    disclaimer:
      "Recomendação estimada com base na previsão meteorológica da Open-Meteo.",
  };
}

async function mockGeocoding(page: Page) {
  await page.route("**/api/geocoding?q=*", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ cities: [city] }),
    });
  });
}

async function fillSearch(page: Page) {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Janela Perfeita" }),
  ).toBeVisible();

  await page.getByLabel("Cidade").fill("Criciúma");
  await page.getByRole("option", { name: /Criciúma/ }).click();
  await page.getByRole("radio", { name: /Correr/ }).click();
  await page.getByRole("button", { name: "Hoje" }).click();
}

test("fluxo principal gera recomendação", async ({ page }) => {
  await mockGeocoding(page);
  await page.route("**/api/recommendation", async (route: Route) => {
    const requestBody = route.request().postDataJSON() as { date: string };

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        recommendation: buildRecommendation(requestBody.date),
      }),
    });
  });

  await fillSearch(page);
  await page.getByRole("button", { name: "Encontrar janela" }).click();

  await expect(page.getByText("Recomendação", { exact: true })).toBeVisible();
  await expect(page.getByText("Janela ideal")).toBeVisible();
  await expect(
    page.getByText("07:00 - 08:00", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Timeline de scores")).toBeVisible();
});

test("fluxo principal exibe erro da API", async ({ page }) => {
  await mockGeocoding(page);
  await page.route("**/api/recommendation", async (route: Route) => {
    await route.fulfill({
      status: 502,
      contentType: "application/json",
      body: JSON.stringify({
        error: {
          message: "Não foi possível buscar a previsão agora.",
        },
      }),
    });
  });

  await fillSearch(page);
  await page.getByRole("button", { name: "Encontrar janela" }).click();

  await expect(
    page.getByText("Não foi possível buscar a previsão agora."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Tentar novamente" }),
  ).toBeVisible();
});

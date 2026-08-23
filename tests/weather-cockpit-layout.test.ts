import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readHomePage() {
  return readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8");
}

function readForecastStrip() {
  return readFileSync(
    join(process.cwd(), "src/components/result/forecast-strip.tsx"),
    "utf8",
  );
}

function readRecommendationCard() {
  return readFileSync(
    join(process.cwd(), "src/components/result/recommendation-card.tsx"),
    "utf8",
  );
}

function readActivityRankingCard() {
  return readFileSync(
    join(process.cwd(), "src/components/result/activity-ranking-card.tsx"),
    "utf8",
  );
}

function readDailyOverviewCard() {
  return readFileSync(
    join(process.cwd(), "src/components/result/daily-overview-card.tsx"),
    "utf8",
  );
}

function readHourlyTimeline() {
  return readFileSync(
    join(process.cwd(), "src/components/result/hourly-timeline.tsx"),
    "utf8",
  );
}

function readWeeklyOverviewCard() {
  return readFileSync(
    join(process.cwd(), "src/components/result/weekly-overview-card.tsx"),
    "utf8",
  );
}

function readOpportunityTimeline() {
  return readFileSync(
    join(process.cwd(), "src/components/result/opportunity-timeline.tsx"),
    "utf8",
  );
}

function readScoreBreakdown() {
  return readFileSync(
    join(process.cwd(), "src/components/result/score-breakdown.tsx"),
    "utf8",
  );
}

function cockpitPreviewExists() {
  return existsSync(join(process.cwd(), "src/app/cockpit-preview"));
}

describe("layout Weather Decision Cockpit", () => {
  const page = readHomePage();

  it("usa a base visual climatica no layout principal", () => {
    expect(page).toContain("<WeatherStage variant={weatherStageVariant} />");
    expect(page).toContain("weatherStageVariant");
    expect(page).toContain("glass-panel");
    expect(page).toContain("glass-card");
    expect(page).toContain("bg-weather-card");
  });

  it("separa seletor de modo, painel lateral e area de resultado", () => {
    expect(page).toContain("<ModeSelector");
    expect(page).toContain("xl:h-full xl:min-h-0 xl:gap-2");
    expect(page).toContain('aria-label="Resultado da decisão"');
    expect(page).toContain("w-full max-w-none");
    expect(page).not.toContain("max-w-7xl");
    expect(page).not.toContain("xl:overflow-hidden");
    expect(page).toContain(
      "xl:grid-cols-[clamp(420px,34vw,480px)_minmax(0,1fr)]",
    );
    expect(page).toContain(
      "xl:grid-cols-[clamp(280px,22vw,340px)_minmax(0,1fr)]",
    );
    expect(page).toContain(
      "xl:grid-rows-[auto_auto_minmax(0,1fr)_auto_auto]",
    );
    expect(page).toContain("grid min-w-0 gap-6");
  });

  it("mantem faixa inferior de resumo sem adicionar mapa", () => {
    expect(page).toContain('aria-label="Resumo da consulta"');
    expect(page).toContain("contextualForecastOverview");
    expect(page).toContain("forecastOverview={forecastStrip}");
    expect(page).not.toContain("xl:sr-only");
    expect(page).not.toContain("MapLibre");
    expect(page).not.toContain("maptiler");
    expect(page).not.toContain("google.maps");
  });

  it("usa carrossel compacto sem scrollbar visivel na faixa de previsao", () => {
    const forecastStrip = readForecastStrip();

    expect(forecastStrip).toContain("scrollbar-none");
    expect(forecastStrip).toContain("overflow-x-auto");
    expect(forecastStrip).toContain("Ver próximos dias");
    expect(forecastStrip).not.toContain("min-w-max");
    expect(forecastStrip).not.toContain("w-44");
  });

  it("mantem a home como entrega unica do cockpit", () => {
    expect(cockpitPreviewExists()).toBe(false);
    expect(page).toContain("Janela perfeita");
    expect(page).toContain("O que fazer hoje?");
    expect(page).toContain("Consulta do dia");
    expect(page).toContain("Consulta da semana");
  });

  it("apresenta marca, subtitulo e acao discreta no header", () => {
    expect(page).toContain("CircleHelp");
    expect(page).toContain("Clima por decisão");
    expect(page).toContain("Previsão por hora");
    expect(page).toContain("glow-primary");
  });

  it("compacta painel de controle sem mover funcionalidade principal", () => {
    expect(page).toContain("xl:overflow-visible xl:pr-0");
    expect(page).toContain(
      "xl:grid xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]",
    );
    expect(page).toContain('widePanel={searchMode === "janela"}');
    expect(page).toContain('"xl:overflow-y-auto xl:pr-2"');
    expect(page).not.toContain("xl:overflow-y-auto xl:pr-1");
    expect(page).toContain("Usar localização");
    expect(page).toContain("h-11 w-full");
    expect(page).toContain("<details");
    expect(page).toContain("max-h-40");
    expect(page).toContain("overflow-visible rounded-xl");
    expect(page).not.toContain("<CardTitle>Buscas recentes</CardTitle>");
  });

  it("concentra Janela perfeita em um card protagonista sem duplicar timeline", () => {
    const recommendationCard = readRecommendationCard();

    expect(recommendationCard).toContain('role="tablist"');
    expect(recommendationCard).toContain("Explorar resultado");
    expect(recommendationCard).toContain("Resumo");
    expect(recommendationCard).toContain("Por hora");
    expect(recommendationCard).toContain("Próximos dias");
    expect(recommendationCard).toContain("Semana");
    expect(recommendationCard).toContain("Estatísticas");
    expect(recommendationCard).toContain("Alternativas");
    expect(recommendationCard).toContain('variant="embedded"');
    expect(recommendationCard).toContain('variant="compact"');
    expect(recommendationCard).toContain('density="compact"');
    expect(recommendationCard).toContain("limit={4}");
    expect(recommendationCard).toContain("showViewTabs={false}");
    expect(recommendationCard).toContain('defaultView="weekly"');
    expect(recommendationCard).toContain("<WeatherStatsPanel");
    expect(recommendationCard).toContain("<OpportunityTimeline");
    expect(recommendationCard).toContain("<ScoreBreakdown");
    expect(page).not.toContain(
      "<OpportunityTimeline recommendation={recommendation} />",
    );
    expect(page).not.toContain(
      "<ScoreBreakdown recommendation={recommendation} />",
    );
  });

  it("usa timeline embutida com rolagem própria no mobile e grade no desktop", () => {
    const opportunityTimeline = readOpportunityTimeline();
    const scoreBreakdown = readScoreBreakdown();

    expect(opportunityTimeline).toContain('variant?: "card" | "embedded"');
    expect(opportunityTimeline).toContain(
      'data-testid="opportunity-timeline-scroll"',
    );
    expect(opportunityTimeline).toContain("overflow-x-auto overscroll-x-contain");
    expect(opportunityTimeline).toContain(
      "xl:grid-cols-[repeat(var(--timeline-count),minmax(0,1fr))]",
    );
    expect(scoreBreakdown).toContain('variant?: "card" | "compact"');
    expect(scoreBreakdown).toContain("<details");
  });

  it("mantem modos contextuais compactos no mesmo painel principal", () => {
    const activityRankingCard = readActivityRankingCard();
    const dailyOverviewCard = readDailyOverviewCard();
    const hourlyTimeline = readHourlyTimeline();
    const weeklyOverviewCard = readWeeklyOverviewCard();

    expect(page).toContain("<ActivityRankingCard ranking={activityRanking} />");
    expect(page).toContain("<DailyOverviewCard overview={dailyOverview} />");
    expect(page).toContain("<WeeklyOverviewCard overview={weeklyOverview} />");
    expect(page).toContain(
      "flex min-h-0 min-w-0 flex-col gap-4 xl:h-full xl:gap-2",
    );
    expect(activityRankingCard).toContain("xl:h-full xl:min-h-0");
    expect(activityRankingCard).toContain("xl:grid-cols-2");
    expect(dailyOverviewCard).toContain("<HourlyTimeline hourly={overview.hourly} />");
    expect(hourlyTimeline).toContain("w-24 shrink-0");
    expect(hourlyTimeline).toContain("overflow-x-auto");
    expect(weeklyOverviewCard).toContain("Resumo da semana");
    expect(weeklyOverviewCard).not.toContain("overflow-x-auto");
  });
});

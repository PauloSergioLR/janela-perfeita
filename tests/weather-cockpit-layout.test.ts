import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readHomePage() {
  return readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8");
}

function readBottomForecastStrip() {
  return readFileSync(
    join(process.cwd(), "src/components/result/bottom-forecast-strip.tsx"),
    "utf8",
  );
}

describe("layout Weather Decision Cockpit", () => {
  const page = readHomePage();
  const bottomStrip = readBottomForecastStrip();

  it("usa a rota principal como cockpit real unico", () => {
    expect(
      existsSync(join(process.cwd(), "src/app/cockpit-preview/page.tsx")),
    ).toBe(false);
    expect(page).toContain("export default function Home");
    expect(page).toContain("<WeatherStage variant={weatherStageVariant} />");
    expect(page).toContain('aria-label="Cockpit principal"');
    expect(page).not.toContain("cockpit-preview");
  });

  it("mantem fluxo real de cidade, busca e recomendacao", () => {
    expect(page).toContain('htmlFor="city"');
    expect(page).toContain('id="city"');
    expect(page).toContain('role="combobox"');
    expect(page).toContain('role="option"');
    expect(page).toContain("handleCitySelect(city)");
    expect(page).toContain("Nenhuma cidade encontrada");
    expect(page).toContain('fetch(`/api/geocoding?${params.toString()}`)');
    expect(page).toContain('fetch("/api/recommendation"');
    expect(page).toContain("const recommendationMutation = useMutation");
    expect(page).toContain("function handleSubmit");
    expect(page).toContain("function runSearch");
    expect(page).toContain("Encontrar janela");
    expect(page).not.toContain("Busca simulada");
    expect(page).not.toContain("Preview estatico");
  });

  it("organiza cockpit em header, ModeBar, painel lateral e painel principal", () => {
    expect(page).toContain("<ModeSelector");
    expect(page).toContain("Janela perfeita");
    expect(page).toContain("O que fazer hoje?");
    expect(page).toContain("Consulta do dia");
    expect(page).toContain("Consulta da semana");
    expect(page).toContain("<CardTitle>Painel de controle</CardTitle>");
    expect(page).toContain('aria-label="Resultado da decisão"');
    expect(page).toContain("<CockpitRecommendationPanel");
    expect(page).toContain("<ActivityRankingCard");
    expect(page).toContain("<DailyOverviewCard");
    expect(page).toContain("<WeeklyOverviewCard");
  });

  it("mantem secundarios compactos no painel lateral", () => {
    expect(page).toContain("Usar localização atual");
    expect(page).toContain("Disponibilidade opcional");
    expect(page).toContain("Buscas recentes");
    expect(page).toContain("searchHistory.slice(0, 3)");
    expect(page).toContain("<details");
    expect(page).toContain("Comparar modelos Open-Meteo");
    expect(page).not.toContain("LeftPanel placeholder");
  });

  it("controla altura da aplicacao sem pagina longa", () => {
    expect(page).toContain("lg:h-dvh");
    expect(page).toContain("lg:overflow-hidden");
    expect(page).toContain(
      "lg:grid-rows-[auto_auto_minmax(0,1fr)_7rem_auto]",
    );
    expect(page).toContain("min-h-0");
    expect(page).toContain("overflow-y-auto");
    expect(page).not.toContain("transform: scale");
    expect(page).not.toContain("zoom");
  });

  it("mantem faixa inferior real e sem mapas", () => {
    expect(page).toContain("<BottomForecastStrip");
    expect(bottomStrip).toContain("overview?: WeeklyWeatherOverview");
    expect(bottomStrip).toContain('aria-label="Previsão dos próximos dias"');
    expect(bottomStrip).toContain("setPageIndex");
    expect(`${page}\n${bottomStrip}`).not.toContain("MapLibre");
    expect(`${page}\n${bottomStrip}`).not.toContain("maptiler");
    expect(`${page}\n${bottomStrip}`).not.toContain("google.maps");
  });
});

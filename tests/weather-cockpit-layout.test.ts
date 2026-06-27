import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readCockpitPreviewPage() {
  return readFileSync(
    join(process.cwd(), "src/app/cockpit-preview/page.tsx"),
    "utf8",
  );
}

describe("layout Weather Decision Cockpit", () => {
  const page = readCockpitPreviewPage();

  it("usa a base visual climatica no shell desktop", () => {
    expect(page).toContain('<WeatherStage variant="night" />');
    expect(page).toContain("glass-panel");
    expect(page).toContain("glass-card");
    expect(page).toContain("bg-weather-card");
  });

  it("separa ModeBar, painel lateral real e painel principal definitivo", () => {
    expect(page).toContain('aria-label="ModeBar"');
    expect(page).toContain("function LeftControlPanel");
    expect(page).toContain('aria-label="LeftControlPanel"');
    expect(page).toContain('aria-label="MainPanel"');
    expect(page).toContain("function PerfectWindowView");
    expect(page).toContain("lg:grid-cols-[340px_minmax(0,1fr)]");
    expect(page).not.toContain('aria-label="MainPanel placeholder"');
  });

  it("implementa painel lateral completo sem cortes planejados", () => {
    expect(page).toContain("Cidade");
    expect(page).toContain("Usar localização atual");
    expect(page).toContain("Data");
    expect(page).toContain("Disponibilidade opcional");
    expect(page).toContain("O que você quer fazer?");
    expect(page).toContain("Encontrar janela");
    expect(page).toContain("mt-auto flex h-10 shrink-0");
    expect(page).not.toContain('aria-label="LeftPanel placeholder"');
    expect(page).not.toContain("CTA placeholder");
  });

  it("mantem buscas recentes em painel compacto no cockpit-preview", () => {
    expect(page).toContain("CockpitRecentSearch");
    expect(page).toContain('aria-controls="cockpit-recent-searches"');
    expect(page).toContain('aria-label="Buscas recentes"');
    expect(page).toContain("handleRecentSearchSelect");
    expect(page).toContain("setCityValue(search.city)");
    expect(page).toContain("setDateValue(search.date)");
    expect(page).toContain("setRecentSearches([])");
    expect(page).toContain("Recentes");
    expect(page).toContain("Repetir");
    expect(page).toContain("Limpar");
    expect(page).not.toContain("overflow-hidden");
  });

  it("mantem faixa inferior de previsao sem adicionar mapa", () => {
    expect(page).toContain('aria-label="BottomForecastStrip placeholder"');
    expect(page).not.toContain("MapLibre");
    expect(page).not.toContain("maptiler");
    expect(page).not.toContain("google.maps");
  });

  it("apresenta marca, subtitulo e acao discreta no header", () => {
    expect(page).toContain("CircleHelp");
    expect(page).toContain("Clima por decisao");
    expect(page).toContain("Previsao por hora");
    expect(page).toContain("glow-primary");
  });

  it("implementa ModeBar ativa sem criar secoes fora do MainPanel", () => {
    expect(page).toContain("useState");
    expect(page).toContain("aria-pressed={isActive}");
    expect(page).toContain("Janela perfeita");
    expect(page).toContain("O que fazer hoje?");
    expect(page).toContain("Consulta do dia");
    expect(page).toContain("Consulta da semana");
    expect(page).toContain("Conteudo muda dentro do MainPanel");
  });

  it("cria view principal de Janela perfeita dentro do MainPanel", () => {
    expect(page).toContain('aria-label="MainPanel Janela perfeita"');
    expect(page).toContain("ScoreRing");
    expect(page).toContain("Melhor janela para");
    expect(page).toContain("09h - 11h");
    expect(page).toContain("Confianca alta");
    expect(page).toContain("perfectWindowReasons");
    expect(page).toContain('aria-label="Estatisticas climaticas"');
    expect(page).toContain('aria-label="Timeline Janela perfeita"');
    expect(page).toContain("setSelectedTimelineIndex");
    expect(page).not.toContain("Timeline placeholder");
  });

  it("mantem estado vazio premium antes da busca", () => {
    expect(page).toContain('aria-label="Estado vazio Janela perfeita"');
    expect(page).toContain("Cockpit pronto");
    expect(page).toContain("Preencha cidade, atividade e data");
    expect(page).toContain("hasPerfectWindowResult");
    expect(page).toContain("onSearch");
  });

  it("cria view O que fazer hoje dentro do MainPanel", () => {
    expect(page).toContain("function TodayRankingView");
    expect(page).toContain('aria-label="MainPanel O que fazer hoje"');
    expect(page).toContain("todayRankingCards");
    expect(page).toContain("Mais recomendada");
    expect(page).toContain('aria-label="Ranking de atividades do dia"');
    expect(page).toContain("Ranking compacto");
    expect(page).toContain("Proximas atividades");
    expect(page).toContain("Paginacao do ranking");
    expect(page).toContain("Compartilhar ranking");
    expect(page).toContain('activeMode.id === "fazer-hoje"');
  });

  it("cria view Consulta do dia dentro do MainPanel", () => {
    expect(page).toContain("function DailyOverviewView");
    expect(page).toContain('aria-label="MainPanel Consulta do dia"');
    expect(page).toContain("dailyOverviewMetrics");
    expect(page).toContain("dailyOverviewTimeline");
    expect(page).toContain("Parcialmente nublado");
    expect(page).toContain("Umidade");
    expect(page).toContain("UV");
    expect(page).toContain("06:42 / 17:31");
    expect(page).toContain('aria-label="Cards climaticos da consulta do dia"');
    expect(page).toContain(
      'aria-label="Timeline horaria compacta Consulta do dia"',
    );
    expect(page).toContain('activeMode.id === "consulta-dia"');
    expect(page).not.toContain("test.skip");
  });

  it("cria view Consulta da semana dentro do MainPanel", () => {
    expect(page).toContain("function WeeklyOverviewView");
    expect(page).toContain('aria-label="MainPanel Consulta da semana"');
    expect(page).toContain("weeklyOverviewDays");
    expect(page).toContain("Melhor dia");
    expect(page).toContain("Pior dia");
    expect(page).toContain("Maior chance de chuva");
    expect(page).toContain("Tendencia geral");
    expect(page).toContain('aria-label="Cards dos 7 dias da consulta da semana"');
    expect(page).toContain('aria-label="Dia anterior da consulta da semana"');
    expect(page).toContain('aria-label="Proximo dia da consulta da semana"');
    expect(page).toContain('activeMode.id === "consulta-semana"');
    expect(page).not.toContain("test.skip");
  });
});

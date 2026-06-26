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

  it("separa ModeBar, painel lateral e painel principal placeholders", () => {
    expect(page).toContain('aria-label="ModeBar"');
    expect(page).toContain('aria-label="LeftPanel placeholder"');
    expect(page).toContain('aria-label="MainPanel placeholder"');
    expect(page).toContain("lg:grid-cols-[340px_minmax(0,1fr)]");
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
});

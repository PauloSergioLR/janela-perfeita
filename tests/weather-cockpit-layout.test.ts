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

  it("separa ModeBar, painel lateral real e painel principal placeholder", () => {
    expect(page).toContain('aria-label="ModeBar"');
    expect(page).toContain("function LeftControlPanel");
    expect(page).toContain('aria-label="LeftControlPanel"');
    expect(page).toContain('aria-label="MainPanel placeholder"');
    expect(page).toContain("lg:grid-cols-[340px_minmax(0,1fr)]");
  });

  it("implementa painel lateral completo sem cortes planejados", () => {
    expect(page).toContain("Cidade");
    expect(page).toContain("Usar localização atual");
    expect(page).toContain("Data");
    expect(page).toContain("Disponibilidade opcional");
    expect(page).toContain("O que você quer fazer?");
    expect(page).toContain("Encontrar janela");
    expect(page).toContain("mt-auto flex h-11 shrink-0");
    expect(page).not.toContain('aria-label="LeftPanel placeholder"');
    expect(page).not.toContain("CTA placeholder");
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

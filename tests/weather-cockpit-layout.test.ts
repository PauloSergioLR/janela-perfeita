import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readHomePage() {
  return readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8");
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

  it("separa seletor de modo, painel lateral e área de resultado sem scroll interno", () => {
    expect(page).toContain("<ModeSelector");
    expect(page).toContain("lg:h-dvh lg:overflow-hidden");
    expect(page).toContain("lg:min-h-0 lg:flex-1");
    expect(page).not.toContain("lg:overflow-y-auto");
    expect(page).toContain('aria-label="Resultado da decisão"');
    expect(page).toContain(
      "lg:grid-cols-[minmax(280px,320px)_minmax(0,1fr)]",
    );
  });

  it("prioriza o formulário e deixa buscas recentes como painel contextual", () => {
    expect(page).toContain("Usar localização atual");
    expect(page).toContain("<ActivitySelector");
    expect(page).toContain("compact");
    expect(page).toContain("lg:absolute lg:bottom-full");
    expect(page).not.toContain("max-h-52 overflow-y-auto");
  });

  it("mantem faixa inferior de resumo sem adicionar mapa", () => {
    expect(page).toContain('aria-label="Resumo da consulta"');
    expect(page).not.toContain("MapLibre");
    expect(page).not.toContain("maptiler");
    expect(page).not.toContain("google.maps");
  });

  it("apresenta marca, subtitulo e acao discreta no header", () => {
    expect(page).toContain("CircleHelp");
    expect(page).toContain("Clima por decisão");
    expect(page).toContain("Previsão por hora");
    expect(page).toContain("glow-primary");
  });
});

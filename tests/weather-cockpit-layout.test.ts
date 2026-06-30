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
    expect(page).toContain("xl:sticky xl:top-3");
    expect(page).toContain('aria-label="Resultado da decisão"');
    expect(page).toContain(
      "xl:grid-cols-[clamp(300px,26vw,380px)_minmax(0,1fr)]",
    );
    expect(page).toContain(
      "xl:grid-rows-[auto_auto_minmax(0,1fr)_auto_auto]",
    );
    expect(page).toContain("grid min-w-0 gap-6");
  });

  it("mantem faixa inferior de resumo sem adicionar mapa", () => {
    expect(page).toContain('aria-label="Resumo da consulta"');
    expect(page).not.toContain("MapLibre");
    expect(page).not.toContain("maptiler");
    expect(page).not.toContain("google.maps");
  });

  it("evita scroll horizontal na faixa de previsao", () => {
    const forecastStrip = readForecastStrip();

    expect(forecastStrip).toContain("grid min-w-0 gap-2");
    expect(forecastStrip).not.toContain("overflow-x-auto");
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
});

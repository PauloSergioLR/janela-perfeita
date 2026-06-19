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

  it("separa seletor de modo, painel lateral e area de resultado", () => {
    expect(page).toContain('aria-labelledby="modo-label"');
    expect(page).toContain("xl:sticky xl:top-6");
    expect(page).toContain('aria-label="Resultado da decisão"');
    expect(page).toContain(
      "xl:grid-cols-[minmax(320px,0.76fr)_minmax(0,1.24fr)]",
    );
  });

  it("mantem faixa inferior de resumo sem adicionar mapa", () => {
    expect(page).toContain('aria-label="Resumo da consulta"');
    expect(page).not.toContain("MapLibre");
    expect(page).not.toContain("maptiler");
    expect(page).not.toContain("google.maps");
  });
});

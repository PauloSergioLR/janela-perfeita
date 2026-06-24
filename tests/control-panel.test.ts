import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readFile(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("painel lateral de controle", () => {
  const page = readFile("src/app/page.tsx");
  const section = readFile("src/components/search/control-panel-section.tsx");

  it("organiza a busca em Onde, Quando e atividade", () => {
    expect(page).toContain('number="1"');
    expect(page).toContain('title="Onde?"');
    expect(page).toContain('number="2"');
    expect(page).toContain('title="Quando?"');
    expect(page).toContain('number="3"');
    expect(page).toContain('title="O que você quer fazer?"');
  });

  it("mantem painel glass com acao principal destacada", () => {
    expect(page).toContain("glass-card");
    expect(page).toContain("glow-primary h-10 w-full");
    expect(page).toContain("shrink-0 border-t border-soft bg-weather-card/70");
    expect(page).toContain("<details className=\"glass-card shrink-0");
    expect(section).toContain("border-t border-soft");
    expect(section).not.toContain("MapLibre");
    expect(section).not.toContain("maptiler");
  });
});

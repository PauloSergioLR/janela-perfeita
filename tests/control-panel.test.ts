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
    expect(page).toContain("glow-primary h-11 w-full");
    expect(page).toContain("xl:shrink-0");
    expect(page).toContain('searchMode === "janela"');
    expect(page).toContain(
      "xl:grid xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] xl:gap-1 xl:space-y-0 xl:overflow-visible xl:pr-0",
    );
    expect(page).toContain(
      '"xl:overflow-y-auto xl:pr-2"',
    );
    expect(page).toContain(
      "xl:grid-cols-[clamp(420px,34vw,480px)_minmax(0,1fr)]",
    );
    expect(page).toContain('widePanel={searchMode === "janela"}');
    expect(page).toContain("space-y-3 border-t border-soft pt-3");
    expect(page).toContain("min-h-0 space-y-3 xl:flex-1 xl:space-y-2");
    expect(page).not.toContain("xl:overflow-y-auto xl:pr-1");
    expect(section).toContain("border-t border-soft");
    expect(section).not.toContain("MapLibre");
    expect(section).not.toContain("maptiler");
  });
});

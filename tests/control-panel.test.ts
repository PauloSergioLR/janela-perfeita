import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readFile(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("painel lateral de controle", () => {
  const page = readFile("src/app/page.tsx");

  it("organiza a busca real em blocos compactos", () => {
    expect(page).toContain("Onde?");
    expect(page).toContain('Label htmlFor="city"');
    expect(page).toContain("Atividade");
    expect(page).toContain('role="radiogroup"');
    expect(page).toContain('role="radio"');
    expect(page).toContain("Quando?");
    expect(page).toContain('id="date"');
  });

  it("mantem painel glass com acao principal destacada", () => {
    expect(page).toContain("glass-card");
    expect(page).toContain("glow-primary mt-auto h-10");
    expect(page).toContain("Buscas recentes");
    expect(page).not.toContain("MapLibre");
    expect(page).not.toContain("maptiler");
  });
});

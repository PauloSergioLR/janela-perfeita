import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readFile(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("painel lateral de controle", () => {
  const page = readFile("src/app/page.tsx");
  const section = readFile("src/components/search/control-panel-section.tsx");

  it("mantem shell placeholder sem formulario real nesta etapa", () => {
    expect(page).toContain('aria-label="LeftPanel placeholder"');
    expect(page).toContain("Controle futuro");
    expect(page).toContain("CTA placeholder");
    expect(page).not.toContain("<form");
    expect(page).not.toContain("Buscas recentes");
  });

  it("mantem painel glass com acao principal destacada", () => {
    expect(page).toContain("glass-card");
    expect(page).toContain("glow-primary");
    expect(section).toContain("border-t border-soft");
    expect(section).not.toContain("MapLibre");
    expect(section).not.toContain("maptiler");
  });
});

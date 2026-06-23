import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readModeSelector() {
  return readFileSync(
    join(process.cwd(), "src/components/search/mode-selector.tsx"),
    "utf8",
  );
}

describe("ModeSelector", () => {
  const source = readModeSelector();

  it("mantem selecao acessivel com cards responsivos", () => {
    expect(source).toContain('role="radiogroup"');
    expect(source).toContain('role="radio"');
    expect(source).toContain("aria-checked={selected}");
    expect(source).toContain("sm:grid-cols-2 lg:grid-cols-4");
  });

  it("destaca modo ativo com icone e sem mapa", () => {
    expect(source).toContain("Check");
    expect(source).toContain("shadow-weather-glow");
    expect(source).toContain("getSearchModeIcon");
    expect(source).not.toContain("MapLibre");
    expect(source).not.toContain("maptiler");
  });
});

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readBottomForecastStrip() {
  return readFileSync(
    join(process.cwd(), "src/components/result/bottom-forecast-strip.tsx"),
    "utf8",
  );
}

describe("BottomForecastStrip", () => {
  it("mantém faixa inferior paginada, acessível e ligada a dados reais", () => {
    const source = readBottomForecastStrip();

    expect(source).toContain('aria-label="Previsão dos próximos dias"');
    expect(source).toContain("overview.days.map");
    expect(source).toContain('aria-label="Cards anteriores"');
    expect(source).toContain('aria-label="Próximos cards"');
    expect(source).toContain("PAGE_SIZE");
    expect(source).not.toContain("overflow-x-auto");
    expect(source).not.toContain("MapLibre");
    expect(source).not.toContain("maptiler");
  });
});

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readWeeklyOverviewCard() {
  return readFileSync(
    join(process.cwd(), "src/components/result/weekly-overview-card.tsx"),
    "utf8",
  );
}

describe("WeeklyOverviewCard", () => {
  it("mantém visão semanal premium com destaques exigidos", () => {
    const source = readWeeklyOverviewCard();

    expect(source).toContain("Consulta da semana");
    expect(source).toContain("Próximos 7 dias");
    expect(source).toContain("Melhor dia");
    expect(source).toContain("Pior dia");
    expect(source).toContain("Maior chance de chuva");
    expect(source).toContain("getWeatherIcon");
  });

  it("mantém cards acessíveis e rolagem horizontal em telas menores", () => {
    const source = readWeeklyOverviewCard();

    expect(source).toContain('aria-label="Previsão dos próximos 7 dias"');
    expect(source).toContain("overflow-x-auto");
    expect(source).toContain('role="list"');
    expect(source).toContain('role="listitem"');
    expect(source).toContain("motion-reduce:transition-none");
    expect(source).not.toContain("MapLibre");
    expect(source).not.toContain("maptiler");
  });
});

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
    expect(source).toContain("Resumo da semana");
    expect(source).toContain("Melhor dia");
    expect(source).toContain("Pior dia");
    expect(source).toContain("Maior chance de chuva");
    expect(source).toContain("Mais quente");
    expect(source).toContain("Mais frio");
  });

  it("mantém resumo compacto sem carrossel duplicado no painel principal", () => {
    const source = readWeeklyOverviewCard();

    expect(source).toContain('aria-label="Resumo climático da semana"');
    expect(source).toContain("xl:h-full xl:min-h-0");
    expect(source).not.toContain("xl:overflow-y-auto");
    expect(source).not.toContain("overflow-x-auto");
    expect(source).not.toContain('role="list"');
    expect(source).not.toContain("MapLibre");
    expect(source).not.toContain("maptiler");
  });
});

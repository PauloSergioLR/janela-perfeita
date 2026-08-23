import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildOpportunityTooltip,
  getOpportunityBarHeight,
  getOpportunityTone,
} from "@/lib/ui/opportunity-timeline";
import type { TimelineDatum } from "@/lib/ui/recommendation-result";

function makeDatum(overrides: Partial<TimelineDatum> = {}): TimelineDatum {
  return {
    time: "2030-06-05T09:00",
    hourLabel: "09:00",
    score: 75,
    reason: "Vento leve favorece a atividade.",
    isRecommended: true,
    isBestWindow: false,
    rainRisk: "Risco de chuva: 20%",
    wind: "Vento: 12 km/h",
    confidenceLevel: "alta",
    ...overrides,
  };
}

function readOpportunityTimeline() {
  return readFileSync(
    join(process.cwd(), "src/components/result/opportunity-timeline.tsx"),
    "utf8",
  );
}

describe("OpportunityTimeline", () => {
  it("aplica cores coerentes para melhor janela e faixas de score", () => {
    expect(getOpportunityTone(makeDatum({ isBestWindow: true })).label).toBe(
      "Melhor janela",
    );
    expect(getOpportunityTone(makeDatum()).label).toBe("Recomendado");
    expect(
      getOpportunityTone(makeDatum({ score: 55, isRecommended: false })).label,
    ).toBe("Atenção");
    expect(
      getOpportunityTone(makeDatum({ score: 20, isRecommended: false })).label,
    ).toBe("Pouco favorável");
  });

  it("mantém pontos visíveis e prepara tooltip com previsão relevante", () => {
    expect(getOpportunityBarHeight(-1)).toBe(8);
    expect(getOpportunityBarHeight(72)).toBe(72);
    expect(getOpportunityBarHeight(120)).toBe(100);
    expect(buildOpportunityTooltip(makeDatum())).toBe(
      "09:00: 75/100\nVento leve favorece a atividade.\nRisco de chuva: 20%\nVento: 12 km/h",
    );
  });

  it("mantém seleção acessível, detalhes ao clique e faixa compacta", () => {
    const source = readOpportunityTimeline();

    expect(source).toContain("aria-pressed={isSelected}");
    expect(source).toContain("title={buildOpportunityTooltip(datum)}");
    expect(source).toContain('aria-label="Timeline de oportunidade"');
    expect(source).toContain(
      "xl:grid-cols-[repeat(var(--timeline-count),minmax(0,1fr))]",
    );
    expect(source).toContain("datum.hourLabel.slice(0, 2)");
    expect(source).toContain('data-testid="opportunity-timeline-scroll"');
    expect(source).toContain("overflow-x-auto overscroll-x-contain");
    expect(source).toContain(
      "min-w-[calc(var(--timeline-count)*3.5rem)]",
    );
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain("selectedDatum.rainRisk");
    expect(source).toContain("selectedDatum.wind");
    expect(source).not.toContain("MapLibre");
    expect(source).not.toContain("maptiler");
  });
});

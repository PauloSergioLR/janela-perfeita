import { describe, expect, it } from "vitest";
import { getActivityById } from "@/lib/domain/activities";
import {
  buildTimelineData,
  formatDurationHours,
  getAlternativeWindows,
  getBreakdownSource,
  getPrimaryReason,
} from "@/lib/ui/recommendation-result";
import type {
  City,
  HourScore,
  Recommendation,
  RuleResult,
  WindowResult,
} from "@/types";

const activity = getActivityById("correr")!;

const city: City = {
  name: "Criciuma",
  country: "Brasil",
  admin1: "Santa Catarina",
  coordinates: {
    lat: -28.6775,
    lon: -49.3697,
  },
};

function makeRule(
  factor: string,
  score: number,
  weight: number,
  reason: string,
): RuleResult {
  return {
    factor,
    label: factor,
    score,
    weight,
    reason,
  };
}

function makeScore(
  hourLabel: string,
  score: number,
  breakdown: RuleResult[] = [
    makeRule("temperatura", score, 40, `Temperatura com score ${score}.`),
  ],
): HourScore {
  return {
    time: `2030-06-05T${hourLabel}`,
    hourLabel,
    score,
    breakdown,
  };
}

function makeWindow(scores: HourScore[]): WindowResult {
  const firstScore = scores[0];
  const lastScore = scores[scores.length - 1];

  return {
    startTime: firstScore.time,
    endTime: `2030-06-05T${String(Number(lastScore.hourLabel.slice(0, 2)) + 1).padStart(2, "0")}:00`,
    startLabel: firstScore.hourLabel,
    endLabel: `${String(Number(lastScore.hourLabel.slice(0, 2)) + 1).padStart(2, "0")}:00`,
    durationHours: scores.length,
    avgScore: Math.round(
      scores.reduce((sum, current) => sum + current.score, 0) / scores.length,
    ),
    peakScore: Math.max(...scores.map((current) => current.score)),
    highlights: ["Janela com bom score."],
    scores,
  };
}

function makeRecommendation(
  scores: HourScore[],
  windows: WindowResult[],
): Recommendation {
  return {
    activity,
    city,
    date: "2030-06-05",
    generatedAt: "2030-06-05T09:00:00.000Z",
    scores,
    windows,
    bestWindow: windows[0] ?? null,
    disclaimer: "Recomendacao estimada pela Open-Meteo.",
  };
}

describe("helpers da visualizacao de resultado", () => {
  it("seleciona motivo principal por penalidade quando o score e baixo", () => {
    const score = makeScore("10:00", 35, [
      makeRule("temperatura", 20, 40, "Temperatura limita a janela."),
      makeRule("chuva", 90, 30, "Pouca chuva prevista."),
    ]);

    expect(getPrimaryReason(score)).toBe("Temperatura limita a janela.");
  });

  it("monta dados da timeline com referencia de recomendacao", () => {
    const data = buildTimelineData(
      [makeScore("08:00", 59), makeScore("09:00", 60)],
      60,
    );

    expect(data).toEqual([
      expect.objectContaining({
        hourLabel: "08:00",
        score: 59,
        isRecommended: false,
      }),
      expect.objectContaining({
        hourLabel: "09:00",
        score: 60,
        isRecommended: true,
      }),
    ]);
  });

  it("separa alternativas sem repetir a melhor janela", () => {
    const bestWindow = makeWindow([makeScore("08:00", 85)]);
    const alternative = makeWindow([makeScore("10:00", 80)]);

    expect(getAlternativeWindows([bestWindow, alternative])).toEqual([
      alternative,
    ]);
  });

  it("usa o pico da melhor janela para o breakdown", () => {
    const bestWindow = makeWindow([
      makeScore("08:00", 70),
      makeScore("09:00", 92),
    ]);
    const recommendation = makeRecommendation(bestWindow.scores, [bestWindow]);
    const source = getBreakdownSource(recommendation);

    expect(source.title).toBe("Fatores da melhor janela");
    expect(source.score?.hourLabel).toBe("09:00");
    expect(source.subtitle).toContain("92/100");
  });

  it("explica o melhor horario disponivel quando nao ha janela boa", () => {
    const scores = [makeScore("08:00", 40), makeScore("09:00", 55)];
    const recommendation = makeRecommendation(scores, []);
    const source = getBreakdownSource(recommendation);

    expect(source.title).toBe("Fatores do melhor horario disponivel");
    expect(source.score?.hourLabel).toBe("09:00");
  });

  it("formata duracao de janela no singular e plural", () => {
    expect(formatDurationHours(1)).toBe("1 hora");
    expect(formatDurationHours(2)).toBe("2 horas");
  });
});

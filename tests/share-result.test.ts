import { describe, expect, it } from "vitest";
import { getActivityById } from "@/lib/domain/activities";
import {
  buildActivityRankingShareText,
  buildRecommendationShareText,
  buildWeekComparisonShareText,
} from "@/lib/ui/share-result";
import type {
  ActivityRanking,
  HourScore,
  Recommendation,
  RuleResult,
  WeekComparison,
  WindowResult,
} from "@/types";
import { criciumaCity, makeHourlyWeather } from "./fixtures/weather";

const activity = getActivityById("correr")!;

function makeRule(score: number): RuleResult {
  return {
    factor: "temperatura",
    label: "Temperatura",
    score,
    weight: 1,
    reason: `Temperatura com score ${score}.`,
  };
}

function makeScore(hour: string, score: number): HourScore {
  return {
    time: `2030-06-05T${hour}`,
    hourLabel: hour,
    score,
    weather: makeHourlyWeather(`2030-06-05T${hour}`),
    breakdown: [makeRule(score)],
  };
}

function makeWindow(scores: HourScore[]): WindowResult {
  return {
    startTime: scores[0].time,
    endTime: "2030-06-05T09:00",
    startLabel: scores[0].hourLabel,
    endLabel: "09:00",
    durationHours: scores.length,
    avgScore: 86,
    peakScore: 90,
    confidence: {
      level: "alta",
      score: 95,
      reason: "Confiança alta.",
    },
    highlights: ["Temperatura agradável e vento baixo."],
    scores,
  };
}

function makeRecommendation(bestWindow: WindowResult | null): Recommendation {
  const scores = [makeScore("07:00", 86), makeScore("08:00", 90)];

  return {
    activity,
    city: criciumaCity,
    date: "2030-06-05",
    generatedAt: "2030-06-05T06:00:00.000Z",
    scores,
    windows: bestWindow ? [bestWindow] : [],
    bestWindow,
    disclaimer: "Open-Meteo.",
  };
}

describe("texto de compartilhamento", () => {
  it("gera resumo de recomendacao com melhor janela", () => {
    const recommendation = makeRecommendation(
      makeWindow([makeScore("07:00", 86), makeScore("08:00", 90)]),
    );
    const text = buildRecommendationShareText(recommendation);

    expect(text).toContain("Janela Perfeita para correr");
    expect(text).toContain("07:00 às 09:00");
    expect(text).toContain("Score: 86/100");
    expect(text).toContain("Temperatura agradável");
  });

  it("gera resumo quando nao existe janela ideal", () => {
    const text = buildRecommendationShareText(makeRecommendation(null));

    expect(text).toContain("sem janela ideal");
    expect(text).toContain("Score: 90/100");
  });

  it("gera resumo do ranking de atividades", () => {
    const recommendation = makeRecommendation(makeWindow([makeScore("07:00", 86)]));
    const ranking: ActivityRanking = {
      city: criciumaCity,
      date: "2030-06-05",
      generatedAt: "2030-06-05T06:00:00.000Z",
      items: [
        {
          position: 1,
          recommendation,
          score: 86,
          isRecommended: true,
        },
      ],
      bestActivity: {
        position: 1,
        recommendation,
        score: 86,
        isRecommended: true,
      },
      disclaimer: "Open-Meteo.",
    };

    expect(buildActivityRankingShareText(ranking)).toContain(
      "Melhor atividade: Correr",
    );
  });

  it("gera resumo da comparacao semanal", () => {
    const recommendation = makeRecommendation(makeWindow([makeScore("07:00", 86)]));
    const comparison: WeekComparison = {
      activity,
      city: criciumaCity,
      startDate: "2030-06-05",
      endDate: "2030-06-11",
      generatedAt: "2030-06-05T06:00:00.000Z",
      days: [
        {
          position: 1,
          recommendation,
          score: 86,
          isRecommended: true,
        },
      ],
      bestDay: {
        position: 1,
        recommendation,
        score: 86,
        isRecommended: true,
      },
      disclaimer: "Open-Meteo.",
    };

    expect(buildWeekComparisonShareText(comparison)).toContain(
      "Melhor dia para correr",
    );
  });
});

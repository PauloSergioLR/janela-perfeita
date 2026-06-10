import { describe, expect, it } from "vitest";
import {
  buildActivityRanking,
  buildRecommendation,
  buildWeekComparison,
} from "@/lib/engine/recommendation-exploration";
import type { Activity, DailyAstronomy } from "@/types";
import { criciumaCity, makeHourlyWeather } from "./fixtures/weather";

function makeActivity(id: string, score: number): Activity {
  return {
    id: id as Activity["id"],
    name: id,
    shortDescription: "Atividade de teste.",
    minRecommendedScore: 60,
    minDurationHours: 1,
    rules: [
      {
        factor: "teste",
        label: "Teste",
        weight: 1,
        evaluate: () => ({
          factor: "teste",
          label: "Teste",
          weight: 1,
          score,
          reason: `Score ${score} no teste.`,
        }),
      },
    ],
  };
}

function makeVariableActivity(): Activity {
  return {
    id: "correr",
    name: "Correr",
    shortDescription: "Atividade de teste.",
    minRecommendedScore: 60,
    minDurationHours: 1,
    rules: [
      {
        factor: "dia",
        label: "Dia",
        weight: 1,
        evaluate: (weather) => {
          const score = weather.time.startsWith("2030-06-06") ? 92 : 45;

          return {
            factor: "dia",
            label: "Dia",
            weight: 1,
            score,
            reason: `Dia com score ${score}.`,
          };
        },
      },
    ],
  };
}

function makeAstronomy(date: string): DailyAstronomy {
  return {
    date,
    sunrise: `${date}T06:30`,
    sunset: `${date}T18:00`,
  };
}

function makeHourly(date: string, hours: string[] = ["08:00", "09:00"]) {
  return hours.map((hour) => makeHourlyWeather(`${date}T${hour}`));
}

describe("exploração de recomendações", () => {
  it("monta recomendação reaproveitando score e janelas", () => {
    const recommendation = buildRecommendation({
      activity: makeActivity("correr", 88),
      city: criciumaCity,
      hourly: makeHourly("2030-06-05"),
      astronomy: makeAstronomy("2030-06-05"),
      generatedAt: "2030-06-05T09:00:00.000Z",
      now: "2030-06-05T07:00:00",
    });

    expect(recommendation.bestWindow?.avgScore).toBe(88);
    expect(recommendation.bestWindow?.startLabel).toBe("08:00");
    expect(recommendation.disclaimer).toContain("Open-Meteo");
  });

  it("ranqueia atividades recomendadas antes das sem janela boa", () => {
    const ranking = buildActivityRanking({
      activities: [makeActivity("caminhar", 40), makeActivity("correr", 90)],
      city: criciumaCity,
      hourly: makeHourly("2030-06-05"),
      astronomy: makeAstronomy("2030-06-05"),
      generatedAt: "2030-06-05T09:00:00.000Z",
      now: "2030-06-05T07:00:00",
    });

    expect(ranking.items).toHaveLength(2);
    expect(ranking.bestActivity?.recommendation.activity.id).toBe("correr");
    expect(ranking.items[0]).toMatchObject({
      position: 1,
      score: 90,
      isRecommended: true,
    });
    expect(ranking.items[1]).toMatchObject({
      position: 2,
      score: 40,
      isRecommended: false,
    });
  });

  it("compara dias usando um forecast único agrupado por astronomia diária", () => {
    const comparison = buildWeekComparison({
      activity: makeVariableActivity(),
      city: criciumaCity,
      hourly: [...makeHourly("2030-06-05"), ...makeHourly("2030-06-06")],
      dailyAstronomy: [makeAstronomy("2030-06-05"), makeAstronomy("2030-06-06")],
      generatedAt: "2030-06-05T09:00:00.000Z",
      now: "2030-06-05T07:00:00",
    });

    expect(comparison.startDate).toBe("2030-06-05");
    expect(comparison.endDate).toBe("2030-06-06");
    expect(comparison.bestDay?.recommendation.date).toBe("2030-06-06");
    expect(comparison.days.map((day) => day.position)).toEqual([1, 2]);
    expect(comparison.days[0]).toMatchObject({
      score: 92,
      isRecommended: true,
    });
    expect(comparison.days[1]).toMatchObject({
      score: 45,
      isRecommended: false,
    });
  });
});

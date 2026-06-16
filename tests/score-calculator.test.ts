import { describe, expect, it } from "vitest";
import { ACTIVITIES, getActivityById } from "@/lib/domain/activities";
import {
  calculateDayScores,
  calculateHourScore,
} from "@/lib/engine/score-calculator";
import { buildWeatherContext } from "@/lib/engine/weather-context";
import { findBestWindows } from "@/lib/engine/window-finder";
import { baseAstronomy, makeDailyHourlyWeather, makeHourlyWeather } from "./fixtures/weather";

describe("calculadora de score", () => {
  it("calcula score ponderado de uma hora", () => {
    const activity = getActivityById("correr")!;
    const weather = makeHourlyWeather("2026-06-05T07:00");
    const context = buildWeatherContext({
      weather,
      astronomy: baseAstronomy,
      now: "2026-06-05T06:00",
    });
    const result = calculateHourScore({ activity, weather, context });

    expect(result.time).toBe(weather.time);
    expect(result.hourLabel).toBe("07:00");
    expect(result.breakdown).toHaveLength(activity.rules.length);
    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("zera score de hora passada sem perder breakdown", () => {
    const activity = getActivityById("correr")!;
    const weather = makeHourlyWeather("2026-06-05T07:00");
    const context = buildWeatherContext({
      weather,
      astronomy: baseAstronomy,
      now: "2026-06-05T08:00",
    });
    const result = calculateHourScore({ activity, weather, context });

    expect(result.score).toBe(0);
    expect(result.breakdown).toHaveLength(activity.rules.length);
  });

  it("calcula ate 24 scores do dia selecionado", () => {
    const activity = getActivityById("caminhar")!;
    const hourly = [
      makeHourlyWeather("2026-06-04T23:00"),
      ...makeDailyHourlyWeather("2026-06-05"),
    ];
    const scores = calculateDayScores({
      activity,
      hourly,
      astronomy: baseAstronomy,
      now: "2026-06-05T03:30",
    });

    expect(scores).toHaveLength(24);
    expect(scores[0].time).toBe("2026-06-05T00:00");
    expect(scores[0].score).toBe(0);
    expect(scores[5].score).toBeGreaterThan(0);
  });

  it("filtra scores fora da disponibilidade informada", () => {
    const activity = getActivityById("caminhar")!;
    const scores = calculateDayScores({
      activity,
      hourly: [
        makeHourlyWeather("2026-06-05T07:00"),
        makeHourlyWeather("2026-06-05T08:00"),
        makeHourlyWeather("2026-06-05T09:00"),
      ],
      astronomy: baseAstronomy,
      now: "2026-06-05T06:00",
      availability: {
        availableFrom: "08:00",
        availableTo: "10:00",
      },
    });

    expect(scores.map((score) => score.score)).toEqual([
      0,
      expect.any(Number),
      expect.any(Number),
    ]);
    expect(scores[0].breakdown.at(-1)).toEqual(
      expect.objectContaining({
        factor: "disponibilidade",
        reason: "Fora da disponibilidade informada (Das 08:00 às 10:00).",
      }),
    );
    expect(scores[1].score).toBeGreaterThanOrEqual(activity.minRecommendedScore);
  });

  it("usa disponibilidade do usuario antes do horario padrao", () => {
    const activity = getActivityById("lavar_carro")!;
    const scores = calculateDayScores({
      activity,
      hourly: [
        makeHourlyWeather("2026-06-05T00:00"),
        makeHourlyWeather("2026-06-05T01:00"),
      ],
      astronomy: baseAstronomy,
      now: "2026-06-04T23:00",
      availability: {
        availableFrom: "00:00",
        availableTo: "02:00",
      },
    });

    expect(scores.every((score) => score.score > 0)).toBe(true);
    expect(
      scores.some((score) =>
        score.breakdown.some((rule) => rule.factor === "horario_padrao"),
      ),
    ).toBe(false);
  });

  it("aplica horario padrao para lavar carro sem disponibilidade", () => {
    const activity = getActivityById("lavar_carro")!;
    const scores = calculateDayScores({
      activity,
      hourly: [
        makeHourlyWeather("2026-06-05T00:00"),
        makeHourlyWeather("2026-06-05T08:00"),
      ],
      astronomy: baseAstronomy,
      now: "2026-06-04T23:00",
    });

    expect(scores[0].score).toBe(0);
    expect(scores[0].breakdown.at(-1)).toEqual(
      expect.objectContaining({
        factor: "horario_padrao",
      }),
    );
    expect(scores[1].score).toBeGreaterThan(0);
  });

  it("suporta horario padrao cruzando meia-noite para observar estrelas", () => {
    const activity = getActivityById("observar_estrelas")!;
    const scores = calculateDayScores({
      activity,
      hourly: [
        makeHourlyWeather("2026-06-05T02:00", { cloud_cover: 0 }),
        makeHourlyWeather("2026-06-05T12:00", { cloud_cover: 0 }),
        makeHourlyWeather("2026-06-05T21:00", { cloud_cover: 0 }),
      ],
      astronomy: baseAstronomy,
      now: "2026-06-04T23:00",
    });

    expect(scores[0].breakdown.some((rule) => rule.factor === "horario_padrao")).toBe(false);
    expect(scores[1].breakdown.some((rule) => rule.factor === "horario_padrao")).toBe(true);
    expect(scores[2].breakdown.some((rule) => rule.factor === "horario_padrao")).toBe(false);
  });

  it("aplica horario dinamico do por do sol para fotografia sem disponibilidade", () => {
    const activity = getActivityById("fotografar_por_do_sol")!;
    const scores = calculateDayScores({
      activity,
      hourly: [
        makeHourlyWeather("2026-06-05T15:00", { cloud_cover: 40 }),
        makeHourlyWeather("2026-06-05T17:00", { cloud_cover: 40 }),
        makeHourlyWeather("2026-06-05T18:00", { cloud_cover: 40 }),
      ],
      astronomy: baseAstronomy,
      now: "2026-06-05T12:00",
    });

    expect(scores[0].score).toBe(0);
    expect(scores[0].breakdown.at(-1)).toEqual(
      expect.objectContaining({
        factor: "horario_padrao",
        reason: "Fora do horario padrao da atividade (Das 17:00 às 18:15).",
      }),
    );
    expect(scores[1].score).toBeGreaterThan(0);
    expect(scores[1].breakdown.some((rule) => rule.factor === "horario_padrao")).toBe(false);
    expect(scores[2].score).toBeGreaterThan(0);
  });

  it("pontua corrida com chuva forte como janela ruim", () => {
    const activity = getActivityById("correr")!;
    const weather = makeHourlyWeather("2026-06-05T07:00", {
      precipitation: 5,
    });
    const context = buildWeatherContext({
      weather,
      astronomy: baseAstronomy,
      now: "2026-06-05T06:00",
    });
    const result = calculateHourScore({ activity, weather, context });

    expect(result.score).toBeLessThan(75);
    expect(result.breakdown.find((rule) => rule.factor === "chuva")?.score).toBe(
      0,
    );
  });

  it("penaliza observar estrelas durante o dia", () => {
    const activity = getActivityById("observar_estrelas")!;
    const dayWeather = makeHourlyWeather("2026-06-05T14:00", {
      cloud_cover: 0,
      temperature_2m: 20,
    });
    const nightWeather = makeHourlyWeather("2026-06-05T21:00", {
      cloud_cover: 0,
      temperature_2m: 20,
    });
    const dayScore = calculateHourScore({
      activity,
      weather: dayWeather,
      context: buildWeatherContext({
        weather: dayWeather,
        astronomy: baseAstronomy,
        now: "2026-06-05T06:00",
      }),
    });
    const nightScore = calculateHourScore({
      activity,
      weather: nightWeather,
      context: buildWeatherContext({
        weather: nightWeather,
        astronomy: baseAstronomy,
        now: "2026-06-05T06:00",
      }),
    });

    expect(dayScore.breakdown.find((rule) => rule.factor === "noite")?.score).toBe(
      0,
    );
    expect(nightScore.breakdown.find((rule) => rule.factor === "noite")?.score).toBe(
      100,
    );
    expect(dayScore.score).toBeLessThan(nightScore.score);
  });

  it("valoriza fotografar perto do sunset com golden hour", () => {
    const activity = getActivityById("fotografar_por_do_sol")!;
    const goldenWeather = makeHourlyWeather("2026-06-05T17:30", {
      cloud_cover: 40,
    });
    const outsideWeather = makeHourlyWeather("2026-06-05T15:00", {
      cloud_cover: 40,
    });
    const goldenScore = calculateHourScore({
      activity,
      weather: goldenWeather,
      context: buildWeatherContext({
        weather: goldenWeather,
        astronomy: baseAstronomy,
        now: "2026-06-05T12:00",
      }),
    });
    const outsideScore = calculateHourScore({
      activity,
      weather: outsideWeather,
      context: buildWeatherContext({
        weather: outsideWeather,
        astronomy: baseAstronomy,
        now: "2026-06-05T12:00",
      }),
    });

    expect(
      goldenScore.breakdown.find((rule) => rule.factor === "golden_hour")?.score,
    ).toBe(100);
    expect(
      outsideScore.breakdown.find((rule) => rule.factor === "golden_hour")?.score,
    ).toBe(25);
    expect(goldenScore.score).toBeGreaterThan(outsideScore.score);
  });

  it("não recomenda lavar carro quando chuva forte vem logo depois", () => {
    const activity = getActivityById("lavar_carro")!;
    const hourly = [
      makeHourlyWeather("2026-06-05T14:00", { precipitation: 0 }),
      makeHourlyWeather("2026-06-05T15:00", { precipitation: 0 }),
      makeHourlyWeather("2026-06-05T16:00", {
        precipitation: 5,
        rain: 5,
        weather_code: 63,
      }),
      makeHourlyWeather("2026-06-05T17:00", { precipitation: 0 }),
    ];
    const scores = calculateDayScores({
      activity,
      hourly,
      astronomy: baseAstronomy,
      now: "2026-06-05T13:00",
    });
    const windows = findBestWindows(scores, activity);
    const score14h = scores.find((score) => score.hourLabel === "14:00");

    expect(score14h?.score).toBeLessThan(activity.minRecommendedScore);
    expect(
      score14h?.breakdown.find((rule) => rule.factor === "chuva_futura")
        ?.reason,
    ).toBe("Chuva relevante às 16:00 pode comprometer a lavagem do carro.");
    expect(
      windows.some(
        (window) =>
          window.startTime === "2026-06-05T14:00" &&
          window.endTime === "2026-06-05T16:00",
      ),
    ).toBe(false);
  });

  it("mantem scores e breakdowns dentro de 0 a 100", () => {
    const weatherCases = [
      makeHourlyWeather("2026-06-05T08:00", {
        temperature_2m: -20,
        precipitation: 12,
        wind_speed_10m: 90,
        cloud_cover: 100,
        uv_index: 15,
        relative_humidity_2m: 100,
      }),
      makeHourlyWeather("2026-06-05T17:30", {
        temperature_2m: 24,
        precipitation: 0,
        wind_speed_10m: 5,
        cloud_cover: 40,
        uv_index: 1,
        relative_humidity_2m: 40,
      }),
    ];

    for (const activity of ACTIVITIES) {
      for (const weather of weatherCases) {
        const result = calculateHourScore({
          activity,
          weather,
          context: buildWeatherContext({
            weather,
            astronomy: baseAstronomy,
            now: "2026-06-05T06:00",
          }),
        });

        expect(result.score, activity.id).toBeGreaterThanOrEqual(0);
        expect(result.score, activity.id).toBeLessThanOrEqual(100);

        for (const rule of result.breakdown) {
          expect(rule.score, `${activity.id}:${rule.factor}`).toBeGreaterThanOrEqual(
            0,
          );
          expect(rule.score, `${activity.id}:${rule.factor}`).toBeLessThanOrEqual(
            100,
          );
        }
      }
    }
  });
});


import { describe, expect, it } from "vitest";
import {
  buildSampleBacktestDays,
  sampleBacktestCity,
} from "@/lib/backtesting/sample-weather-backtest";
import {
  runWeatherBacktest,
  type BacktestDayInput,
} from "@/lib/backtesting/weather-backtesting";
import { getActivityById } from "@/lib/domain/activities";
import type { DailyAstronomy, HourlyWeather } from "@/types";
import { makeHourlyWeather } from "./fixtures/weather";

const activity = getActivityById("correr");

if (!activity) {
  throw new Error("Atividade de teste não encontrada.");
}

const astronomy: DailyAstronomy = {
  date: "2030-06-05",
  sunrise: "2030-06-05T06:30",
  sunset: "2030-06-05T18:00",
};

function makeDailyWeather(
  overrides: (hour: number) => Partial<HourlyWeather>,
): HourlyWeather[] {
  return Array.from({ length: 24 }, (_, hour) =>
    makeHourlyWeather(
      `2030-06-05T${String(hour).padStart(2, "0")}:00`,
      overrides(hour),
    ),
  );
}

describe("backtesting meteorológico", () => {
  it("gera relatório técnico com métricas agregadas da amostra local", () => {
    const report = runWeatherBacktest({
      activity,
      city: sampleBacktestCity,
      days: buildSampleBacktestDays(),
      generatedAt: "2030-06-30T00:00:00.000Z",
    });

    expect(report.period.days).toBe(30);
    expect(report.evaluatedWindows).toBeGreaterThan(0);
    expect(report.dryWindowRate).toBeGreaterThanOrEqual(0);
    expect(report.dryWindowRate).toBeLessThanOrEqual(100);
    expect(report.estimatedHitRate).toBeGreaterThanOrEqual(0);
    expect(report.estimatedHitRate).toBeLessThanOrEqual(100);
    expect(report.topErrorFactors.length).toBeGreaterThan(0);
    expect(report.limitations).toContain(
      "Sem banco de dados: os resultados dependem do conjunto de dados fornecido ao módulo.",
    );
  });

  it("marca divergência quando a janela prevista encontra chuva observada", () => {
    const forecastHourly = makeDailyWeather((hour) => ({
      temperature_2m: hour === 8 ? 19 : 36,
      apparent_temperature: hour === 8 ? 19 : 38,
      precipitation: 0,
      precipitation_probability: 0,
      uv_index: hour === 8 ? 2 : 9,
    }));
    const observedHourly = makeDailyWeather((hour) => ({
      temperature_2m: hour === 8 ? 19 : 36,
      apparent_temperature: hour === 8 ? 19 : 38,
      precipitation: hour === 8 ? 4 : 0,
      precipitation_probability: hour === 8 ? 90 : 0,
      rain: hour === 8 ? 4 : 0,
      uv_index: hour === 8 ? 2 : 9,
    }));
    const day: BacktestDayInput = {
      date: astronomy.date,
      astronomy,
      forecastHourly,
      observedHourly,
    };

    const report = runWeatherBacktest({
      activity,
      city: sampleBacktestCity,
      days: [day],
      generatedAt: "2030-06-30T00:00:00.000Z",
    });

    expect(report.evaluatedWindows).toBe(1);
    expect(report.dryWindows).toBe(0);
    expect(report.estimatedHitRate).toBe(0);
    expect(report.days[0]).toEqual(
      expect.objectContaining({
        stayedDry: false,
        hit: false,
      }),
    );
  });

  it("evita divisão por zero quando nenhum dia gera janela recomendada", () => {
    const rainyDay: BacktestDayInput = {
      date: astronomy.date,
      astronomy,
      forecastHourly: makeDailyWeather(() => ({
        precipitation: 8,
        precipitation_probability: 100,
        rain: 8,
        wind_speed_10m: 45,
        wind_gusts_10m: 60,
      })),
      observedHourly: makeDailyWeather(() => ({
        precipitation: 8,
        precipitation_probability: 100,
        rain: 8,
        wind_speed_10m: 45,
        wind_gusts_10m: 60,
      })),
    };

    const report = runWeatherBacktest({
      activity,
      city: sampleBacktestCity,
      days: [rainyDay],
      generatedAt: "2030-06-30T00:00:00.000Z",
    });

    expect(report.evaluatedWindows).toBe(0);
    expect(report.dryWindowRate).toBe(0);
    expect(report.estimatedHitRate).toBe(0);
    expect(report.averageRecommendedScore).toBe(0);
  });
});

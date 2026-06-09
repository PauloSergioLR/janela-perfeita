import { describe, expect, it } from "vitest";
import { calculateForecastConfidence } from "@/lib/engine/forecast-confidence";
import type { HourScore, HourlyWeather, RuleResult } from "@/types";
import { makeHourlyWeather } from "./fixtures/weather";

function makeRule(score: number): RuleResult {
  return {
    factor: "tempo",
    label: "Tempo",
    score,
    weight: 100,
    reason: "Condição avaliada.",
  };
}

function makeScore(
  time: string,
  score: number,
  weather: Partial<HourlyWeather> = {},
): HourScore {
  return {
    time,
    hourLabel: time.slice(11, 16),
    score,
    weather: makeHourlyWeather(time, weather),
    breakdown: [makeRule(score)],
  };
}

describe("confiança da previsão", () => {
  it("classifica como alta quando sinais são estáveis", () => {
    const confidence = calculateForecastConfidence([
      makeScore("2026-06-05T08:00", 86, {
        cloud_cover: 20,
        precipitation_probability: 5,
        wind_gusts_10m: 12,
      }),
      makeScore("2026-06-05T09:00", 88, {
        cloud_cover: 24,
        precipitation_probability: 8,
        wind_gusts_10m: 14,
      }),
    ]);

    expect(confidence.level).toBe("alta");
    expect(confidence.score).toBeGreaterThanOrEqual(75);
    expect(confidence.reason).toContain("baixa chance de chuva");
  });

  it("classifica como média quando há risco moderado e variação", () => {
    const confidence = calculateForecastConfidence([
      makeScore("2026-06-05T08:00", 74, {
        cloud_cover: 20,
        precipitation_probability: 45,
        wind_gusts_10m: 36,
      }),
      makeScore("2026-06-05T09:00", 60, {
        cloud_cover: 48,
        precipitation_probability: 42,
        wind_gusts_10m: 34,
      }),
    ]);

    expect(confidence.level).toBe("media");
    expect(confidence.score).toBeGreaterThanOrEqual(50);
    expect(confidence.score).toBeLessThan(75);
    expect(confidence.reason).toContain("risco moderado de chuva");
  });

  it("classifica como baixa quando chuva, rajadas e oscilação se combinam", () => {
    const confidence = calculateForecastConfidence([
      makeScore("2026-06-05T08:00", 88, {
        cloud_cover: 10,
        precipitation: 0,
        precipitation_probability: 80,
        wind_gusts_10m: 60,
      }),
      makeScore("2026-06-05T09:00", 42, {
        cloud_cover: 80,
        precipitation: 2,
        rain: 2,
        weather_code: 63,
        wind_gusts_10m: 64,
      }),
    ]);

    expect(confidence.level).toBe("baixa");
    expect(confidence.score).toBeLessThan(50);
    expect(confidence.reason).toContain("chuva");
  });
});

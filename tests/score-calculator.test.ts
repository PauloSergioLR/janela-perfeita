import { describe, expect, it } from "vitest";
import { getActivityById } from "@/lib/domain/activities";
import {
  calculateDayScores,
  calculateHourScore,
} from "@/lib/engine/score-calculator";
import { buildWeatherContext } from "@/lib/engine/weather-context";
import type { DailyAstronomy, HourlyWeather } from "@/types";

const astronomy: DailyAstronomy = {
  date: "2026-06-05",
  sunrise: "2026-06-05T06:30",
  sunset: "2026-06-05T18:00",
};

function makeWeather(
  time: string,
  overrides: Partial<HourlyWeather> = {},
): HourlyWeather {
  return {
    time,
    temperature_2m: 19,
    precipitation: 0,
    wind_speed_10m: 8,
    cloud_cover: 30,
    uv_index: 2,
    relative_humidity_2m: 60,
    ...overrides,
  };
}

describe("calculadora de score", () => {
  it("calcula score ponderado de uma hora", () => {
    const activity = getActivityById("correr")!;
    const weather = makeWeather("2026-06-05T07:00");
    const context = buildWeatherContext({
      weather,
      astronomy,
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
    const weather = makeWeather("2026-06-05T07:00");
    const context = buildWeatherContext({
      weather,
      astronomy,
      now: "2026-06-05T08:00",
    });
    const result = calculateHourScore({ activity, weather, context });

    expect(result.score).toBe(0);
    expect(result.breakdown).toHaveLength(activity.rules.length);
  });

  it("calcula ate 24 scores do dia selecionado", () => {
    const activity = getActivityById("caminhar")!;
    const hourly = [
      makeWeather("2026-06-04T23:00"),
      ...Array.from({ length: 25 }, (_, hour) =>
        makeWeather(`2026-06-05T${String(hour).padStart(2, "0")}:00`),
      ),
    ];
    const scores = calculateDayScores({
      activity,
      hourly,
      astronomy,
      now: "2026-06-05T03:30",
    });

    expect(scores).toHaveLength(24);
    expect(scores[0].time).toBe("2026-06-05T00:00");
    expect(scores[0].score).toBe(0);
    expect(scores[4].score).toBeGreaterThan(0);
  });
});


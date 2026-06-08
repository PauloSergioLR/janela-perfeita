import { describe, expect, it } from "vitest";
import { buildWeatherContext } from "@/lib/engine/weather-context";
import type { DailyAstronomy, HourlyWeather } from "@/types";

const astronomy: DailyAstronomy = {
  date: "2026-06-05",
  sunrise: "2026-06-05T06:30",
  sunset: "2026-06-05T18:00",
};

function makeWeather(time: string): HourlyWeather {
  return {
    time,
    temperature_2m: 20,
    apparent_temperature: 20,
    precipitation: 0,
    precipitation_probability: 0,
    rain: 0,
    showers: 0,
    weather_code: 0,
    wind_speed_10m: 8,
    wind_gusts_10m: 12,
    cloud_cover: 30,
    uv_index: 2,
    relative_humidity_2m: 60,
  };
}

describe("contexto meteorologico", () => {
  it("calcula hora local, hoje, golden hour e minutos ate o por do sol", () => {
    const context = buildWeatherContext({
      weather: makeWeather("2026-06-05T17:30"),
      astronomy,
      now: "2026-06-05T16:00",
    });

    expect(context.localHour).toBe(17);
    expect(context.isToday).toBe(true);
    expect(context.isPastHour).toBe(false);
    expect(context.isNight).toBe(false);
    expect(context.isGoldenHour).toBe(true);
    expect(context.minutesFromSunset).toBe(-30);
  });

  it("marca hora passada quando a data e hoje", () => {
    const context = buildWeatherContext({
      weather: makeWeather("2026-06-05T09:00"),
      astronomy,
      now: "2026-06-05T10:30",
    });

    expect(context.isPastHour).toBe(true);
  });

  it("nao marca hora passada quando a data nao e hoje", () => {
    const context = buildWeatherContext({
      weather: makeWeather("2026-06-06T09:00"),
      astronomy: {
        date: "2026-06-06",
        sunrise: "2026-06-06T06:30",
        sunset: "2026-06-06T18:00",
      },
      now: "2026-06-05T10:30",
    });

    expect(context.isToday).toBe(false);
    expect(context.isPastHour).toBe(false);
  });

  it("marca noite antes do nascer e depois do por do sol", () => {
    const beforeSunrise = buildWeatherContext({
      weather: makeWeather("2026-06-05T05:00"),
      astronomy,
      now: "2026-06-05T04:00",
    });
    const afterSunset = buildWeatherContext({
      weather: makeWeather("2026-06-05T21:00"),
      astronomy,
      now: "2026-06-05T16:00",
    });

    expect(beforeSunrise.isNight).toBe(true);
    expect(afterSunset.isNight).toBe(true);
  });
});


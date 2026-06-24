import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getWeatherStats } from "@/lib/ui/weather-stats";
import { makeHourlyWeather } from "./fixtures/weather";

function readWeatherStatsPanel() {
  return readFileSync(
    join(process.cwd(), "src/components/result/weather-stats-panel.tsx"),
    "utf8",
  );
}

describe("WeatherStatsPanel", () => {
  it("prepara estatísticas reais do horário recomendado", () => {
    const weather = makeHourlyWeather("2030-06-05T09:00", {
      temperature_2m: 22.4,
      apparent_temperature: 21.6,
      precipitation: 1.2,
      precipitation_probability: 35,
      rain: 0.8,
      showers: 0,
      wind_speed_10m: 14.6,
      wind_gusts_10m: 28.2,
      relative_humidity_2m: 64,
      uv_index: 3.5,
      cloud_cover: 42,
    });
    const stats = getWeatherStats({
      weather,
      sunrise: "2030-06-05T06:28",
      sunset: "2030-06-05T17:54",
    });
    const values = Object.fromEntries(stats.map((stat) => [stat.id, stat.value]));

    expect(values).toMatchObject({
      temperature: "22°C",
      "apparent-temperature": "22°C",
      precipitation: "35%",
      wind: "15 km/h",
      gusts: "28 km/h",
      humidity: "64%",
      uv: "3,5",
      "cloud-cover": "42%",
      sunrise: "06:28",
      sunset: "17:54",
    });
    expect(stats.find((stat) => stat.id === "precipitation")?.detail).toBe(
      "1,2 mm previsto",
    );
  });

  it("exibe fallback quando os dados não estão disponíveis", () => {
    const stats = getWeatherStats({ weather: null });

    expect(stats).toHaveLength(10);
    expect(stats.every((stat) => stat.value === "Indisponível")).toBe(true);
  });

  it("mantém ícones, grid responsivo e sem mapa", () => {
    const source = readWeatherStatsPanel();

    expect(source).toContain('aria-label="Estatísticas climáticas"');
    expect(source).toContain("getWeatherMetricIcon");
    expect(source).toContain("getWeatherIcon");
    expect(source).toContain("grid-cols-2");
    expect(source).toContain("sm:grid-cols-3");
    expect(source).toContain("lg:grid-cols-5");
    expect(source).toContain("compact?: boolean");
    expect(source).not.toContain("MapLibre");
    expect(source).not.toContain("maptiler");
  });
});

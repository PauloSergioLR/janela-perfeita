import { describe, expect, it } from "vitest";
import { ACTIVITIES, getActivityById } from "@/lib/domain/activities";
import type { Activity, HourlyWeather, WeatherContext } from "@/types";

const idealRunningWeather: HourlyWeather = {
  time: "2026-06-05T07:00",
  temperature_2m: 19,
  precipitation: 0,
  wind_speed_10m: 8,
  cloud_cover: 30,
  uv_index: 2,
  relative_humidity_2m: 60,
};

const baseContext: WeatherContext = {
  localHour: 7,
  isToday: true,
  isPastHour: false,
  isNight: false,
  isGoldenHour: false,
  minutesFromSunset: -660,
  sunrise: "2026-06-05T06:30",
  sunset: "2026-06-05T18:00",
};

function calculateWeightedScore(activity: Activity, weather: HourlyWeather) {
  const totalWeight = activity.rules.reduce((sum, rule) => sum + rule.weight, 0);
  const weightedScore = activity.rules.reduce((sum, rule) => {
    const result = rule.evaluate(weather, baseContext);
    return sum + result.score * result.weight;
  }, 0);

  return Math.round(weightedScore / totalWeight);
}

describe("regras das atividades", () => {
  it("implementa as seis atividades do MVP", () => {
    expect(ACTIVITIES).toHaveLength(6);
    expect(ACTIVITIES.map((activity) => activity.id)).toEqual([
      "correr",
      "caminhar",
      "pedalar",
      "fotografar_por_do_sol",
      "observar_estrelas",
      "lavar_carro",
    ]);
  });

  it("mantém os pesos de cada atividade somando 100", () => {
    for (const activity of ACTIVITIES) {
      const totalWeight = activity.rules.reduce(
        (sum, rule) => sum + rule.weight,
        0,
      );

      expect(totalWeight, activity.id).toBe(100);
    }
  });

  it("retorna uma atividade tipada pelo identificador", () => {
    expect(getActivityById("correr")?.name).toBe("Correr");
  });

  it("pontua corrida ideal com score alto", () => {
    const activity = getActivityById("correr");

    expect(activity).toBeDefined();
    expect(calculateWeightedScore(activity!, idealRunningWeather)).toBeGreaterThanOrEqual(
      85,
    );
  });

  it("penaliza corrida com chuva forte", () => {
    const activity = getActivityById("correr");
    const rainyWeather: HourlyWeather = {
      ...idealRunningWeather,
      precipitation: 5,
    };

    expect(activity).toBeDefined();
    expect(calculateWeightedScore(activity!, rainyWeather)).toBeLessThan(75);
  });

  it("gera motivos em português e scores dentro de 0 a 100", () => {
    for (const activity of ACTIVITIES) {
      for (const rule of activity.rules) {
        const result = rule.evaluate(idealRunningWeather, baseContext);

        expect(result.reason.length).toBeGreaterThan(10);
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
      }
    }
  });
});

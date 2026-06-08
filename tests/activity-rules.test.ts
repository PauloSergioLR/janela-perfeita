import { describe, expect, it } from "vitest";
import { ACTIVITIES, getActivityById } from "@/lib/domain/activities";
import type { Activity, HourlyWeather, WeatherContext } from "@/types";

const idealRunningWeather: HourlyWeather = {
  time: "2026-06-05T07:00",
  temperature_2m: 19,
  apparent_temperature: 19,
  precipitation: 0,
  precipitation_probability: 0,
  rain: 0,
  showers: 0,
  weather_code: 0,
  wind_speed_10m: 8,
  wind_gusts_10m: 12,
  cloud_cover: 30,
  cloud_cover_low: 10,
  cloud_cover_mid: 35,
  cloud_cover_high: 35,
  visibility: 15000,
  sunshine_duration: 2400,
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

const goldenHourContext: WeatherContext = {
  ...baseContext,
  localHour: 17,
  isGoldenHour: true,
  minutesFromSunset: -30,
};

function calculateWeightedScore(
  activity: Activity,
  weather: HourlyWeather,
  context = baseContext,
) {
  const totalWeight = activity.rules.reduce((sum, rule) => sum + rule.weight, 0);
  const weightedScore = activity.rules.reduce((sum, rule) => {
    const result = rule.evaluate(weather, context);
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

  it("usa sensação térmica para penalizar corrida", () => {
    const activity = getActivityById("correr");
    const hotFeelingWeather: HourlyWeather = {
      ...idealRunningWeather,
      temperature_2m: 19,
      apparent_temperature: 35,
    };
    const thermalRule = activity?.rules.find(
      (rule) => rule.factor === "sensacao_termica",
    );
    const result = thermalRule?.evaluate(hotFeelingWeather, baseContext);

    expect(activity).toBeDefined();
    expect(calculateWeightedScore(activity!, hotFeelingWeather)).toBeLessThan(
      75,
    );
    expect(result?.score).toBe(0);
    expect(result?.reason).toBe(
      "Sensação térmica de 35°C está fora da faixa ideal de 16°C a 22°C.",
    );
  });

  it("usa sensação térmica para caminhada", () => {
    const activity = getActivityById("caminhar");
    const thermalRule = activity?.rules.find(
      (rule) => rule.factor === "sensacao_termica",
    );

    expect(thermalRule?.label).toBe("Sensação térmica");
  });

  it("penaliza pedal com rajadas fortes de vento", () => {
    const activity = getActivityById("pedalar");
    const gustyWeather: HourlyWeather = {
      ...idealRunningWeather,
      wind_speed_10m: 10,
      wind_gusts_10m: 70,
    };
    const gustRule = activity?.rules.find((rule) => rule.factor === "rajadas");
    const idealScore = calculateWeightedScore(activity!, idealRunningWeather);
    const gustyScore = calculateWeightedScore(activity!, gustyWeather);
    const result = gustRule?.evaluate(gustyWeather, baseContext);

    expect(activity).toBeDefined();
    expect(gustyScore).toBeLessThan(idealScore);
    expect(result?.score).toBe(0);
    expect(result?.reason).toBe(
      "Rajadas de 70 km/h podem deixar a atividade instável.",
    );
  });

  it("considera risco moderado mesmo sem chuva acumulada", () => {
    const activity = getActivityById("caminhar");
    const rainRiskWeather: HourlyWeather = {
      ...idealRunningWeather,
      precipitation: 0,
      precipitation_probability: 45,
    };
    const rainRule = activity?.rules.find((rule) => rule.factor === "chuva");
    const result = rainRule?.evaluate(rainRiskWeather, baseContext);

    expect(result?.score).toBe(60);
    expect(result?.reason).toBe(
      "Sem chuva prevista, mas há risco moderado de chuva.",
    );
  });

  it("valoriza golden hour com nuvens medias e altas moderadas", () => {
    const activity = getActivityById("fotografar_por_do_sol");
    const goodCloudsWeather: HourlyWeather = {
      ...idealRunningWeather,
      time: "2026-06-05T17:30",
      cloud_cover: 45,
      cloud_cover_low: 20,
      cloud_cover_mid: 50,
      cloud_cover_high: 45,
    };
    const cloudRule = activity?.rules.find(
      (rule) => rule.factor === "nuvens_por_do_sol",
    );
    const result = cloudRule?.evaluate(goodCloudsWeather, goldenHourContext);

    expect(activity).toBeDefined();
    expect(
      calculateWeightedScore(activity!, goodCloudsWeather, goldenHourContext),
    ).toBeGreaterThanOrEqual(95);
    expect(result?.score).toBe(100);
    expect(result?.reason).toContain("Nuvens médias e altas moderadas");
  });

  it("penaliza fotografia de por do sol com ceu fechado", () => {
    const activity = getActivityById("fotografar_por_do_sol");
    const overcastWeather: HourlyWeather = {
      ...idealRunningWeather,
      time: "2026-06-05T17:30",
      cloud_cover: 98,
      cloud_cover_low: 85,
      cloud_cover_mid: 90,
      cloud_cover_high: 90,
      sunshine_duration: 0,
    };
    const cloudRule = activity?.rules.find(
      (rule) => rule.factor === "nuvens_por_do_sol",
    );
    const result = cloudRule?.evaluate(overcastWeather, goldenHourContext);

    expect(activity).toBeDefined();
    expect(
      calculateWeightedScore(activity!, overcastWeather, goldenHourContext),
    ).toBeLessThan(80);
    expect(result?.score).toBe(20);
    expect(result?.reason).toContain("Céu muito fechado");
  });

  it("penaliza fotografia fora da golden hour", () => {
    const activity = getActivityById("fotografar_por_do_sol");
    const goodCloudsWeather: HourlyWeather = {
      ...idealRunningWeather,
      cloud_cover: 45,
      cloud_cover_low: 20,
      cloud_cover_mid: 50,
      cloud_cover_high: 45,
    };
    const goldenScore = calculateWeightedScore(
      activity!,
      goodCloudsWeather,
      goldenHourContext,
    );
    const outsideScore = calculateWeightedScore(activity!, goodCloudsWeather);
    const goldenRule = activity?.rules.find(
      (rule) => rule.factor === "golden_hour",
    );

    expect(activity).toBeDefined();
    expect(outsideScore).toBeLessThan(goldenScore);
    expect(goldenRule?.evaluate(goodCloudsWeather, baseContext).score).toBe(25);
  });

  it("penaliza fotografia com baixa visibilidade", () => {
    const activity = getActivityById("fotografar_por_do_sol");
    const lowVisibilityWeather: HourlyWeather = {
      ...idealRunningWeather,
      time: "2026-06-05T17:30",
      cloud_cover: 45,
      cloud_cover_low: 20,
      cloud_cover_mid: 50,
      cloud_cover_high: 45,
      visibility: 1000,
    };
    const visibilityRule = activity?.rules.find(
      (rule) => rule.factor === "visibilidade",
    );
    const result = visibilityRule?.evaluate(
      lowVisibilityWeather,
      goldenHourContext,
    );

    expect(activity).toBeDefined();
    expect(
      calculateWeightedScore(activity!, lowVisibilityWeather, goldenHourContext),
    ).toBeLessThan(95);
    expect(result?.score).toBe(0);
    expect(result?.reason).toContain("reduz nitidez");
  });

  it("considera rain, showers e weather_code nas regras de chuva", () => {
    for (const activity of ACTIVITIES) {
      const rainRule = activity.rules.find((rule) => rule.factor === "chuva");

      expect(rainRule, activity.id).toBeDefined();
      expect(
        rainRule?.evaluate(
          {
            ...idealRunningWeather,
            precipitation: 0,
            rain: 1.5,
          },
          baseContext,
        ).score,
      ).toBeLessThanOrEqual(30);
      expect(
        rainRule?.evaluate(
          {
            ...idealRunningWeather,
            precipitation: 0,
            showers: 0.4,
          },
          baseContext,
        ).reason,
      ).toBe("Condição ruim por previsão de pancadas de chuva.");
      expect(
        rainRule?.evaluate(
          {
            ...idealRunningWeather,
            precipitation: 0,
            weather_code: 80,
          },
          baseContext,
        ).score,
      ).toBeLessThanOrEqual(15);
    }
  });

  it("explica diferentes níveis de risco de chuva", () => {
    const rainRule = getActivityById("correr")?.rules.find(
      (rule) => rule.factor === "chuva",
    );
    const scenarios = [
      {
        weather: { ...idealRunningWeather, weather_code: 95 },
        reason: "Condição ruim por previsão de tempestade.",
      },
      {
        weather: { ...idealRunningWeather, weather_code: 51 },
        reason: "Garoa prevista reduz a qualidade da janela.",
      },
      {
        weather: { ...idealRunningWeather, weather_code: 71 },
        reason: "Condição ruim por previsão de precipitação congelada.",
      },
      {
        weather: { ...idealRunningWeather, precipitation: 0.1 },
        reason: "Chuva muito fraca pode aparecer, mas o risco ainda é baixo.",
      },
      {
        weather: { ...idealRunningWeather, precipitation: 0.8 },
        reason: "Chuva fraca reduz a qualidade da janela.",
      },
      {
        weather: { ...idealRunningWeather, precipitation_probability: 25 },
        reason: "Sem chuva prevista para este horário.",
      },
      {
        weather: { ...idealRunningWeather, precipitation_probability: 75 },
        reason: "Sem chuva prevista, mas há risco moderado de chuva.",
      },
      {
        weather: { ...idealRunningWeather, precipitation_probability: 90 },
        reason: "Sem chuva prevista, mas há risco moderado de chuva.",
      },
    ];

    expect(rainRule).toBeDefined();

    for (const scenario of scenarios) {
      expect(rainRule?.evaluate(scenario.weather, baseContext).reason).toBe(
        scenario.reason,
      );
    }
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

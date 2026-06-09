import type {
  ActivityRule,
  HourlyWeather,
  RuleResult,
  WeatherContext,
} from "@/types";

type RuleInput = {
  factor: string;
  label: string;
  weight: number;
  score: number;
  reason: string;
};

type RainAssessment = {
  score: number;
  reason: string;
};

type TemperatureRuleOptions = {
  useApparentTemperature?: boolean;
};

const MODERATE_RAIN_PROBABILITY = 40;
const HIGH_RAIN_PROBABILITY = 60;
const VERY_HIGH_RAIN_PROBABILITY = 80;
const DRIZZLE_CODES = new Set([51, 53, 55, 56, 57]);
const RAIN_CODES = new Set([61, 63, 65, 66, 67]);
const SHOWER_CODES = new Set([80, 81, 82]);
const THUNDERSTORM_CODES = new Set([95, 96, 99]);
const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function createRuleResult(input: RuleInput): RuleResult {
  return {
    factor: input.factor,
    label: input.label,
    weight: input.weight,
    score: clampScore(input.score),
    reason: input.reason,
  };
}

function scoreIdealRange(value: number, min: number, max: number): number {
  if (value >= min && value <= max) {
    return 100;
  }

  const tolerance = Math.max(4, (max - min) * 1.5);
  const distance = value < min ? min - value : value - max;

  return clampScore(100 - (distance / tolerance) * 100);
}

function scoreMaximum(value: number, idealMax: number, limitMax: number): number {
  if (value <= idealMax) {
    return 100;
  }

  return clampScore(100 - ((value - idealMax) / (limitMax - idealMax)) * 100);
}

function scoreMinimum(value: number, idealMin: number, limitMin: number): number {
  if (value >= idealMin) {
    return 100;
  }

  return clampScore(((value - limitMin) / (idealMin - limitMin)) * 100);
}

function precipitationAmountScore(precipitation: number): number {
  if (precipitation <= 0) {
    return 100;
  }

  if (precipitation <= 0.2) {
    return 80;
  }

  if (precipitation <= 1) {
    return 45;
  }

  if (precipitation <= 3) {
    return 20;
  }

  return 0;
}

function precipitationProbabilityScore(probability: number): number {
  if (probability >= VERY_HIGH_RAIN_PROBABILITY) {
    return 10;
  }

  if (probability >= HIGH_RAIN_PROBABILITY) {
    return 25;
  }

  if (probability >= MODERATE_RAIN_PROBABILITY) {
    return 60;
  }

  if (probability >= 20) {
    return 80;
  }

  return 100;
}

function weatherCodePrecipitationScore(weatherCode: number): number {
  if (THUNDERSTORM_CODES.has(weatherCode)) {
    return 0;
  }

  if (SHOWER_CODES.has(weatherCode) || SNOW_CODES.has(weatherCode)) {
    return 15;
  }

  if (RAIN_CODES.has(weatherCode)) {
    return 30;
  }

  if (DRIZZLE_CODES.has(weatherCode)) {
    return 60;
  }

  return 100;
}

function assessRain(weather: HourlyWeather): RainAssessment {
  const precipitationAmount = Math.max(
    weather.precipitation,
    weather.rain,
    weather.showers,
  );
  const score = Math.min(
    precipitationAmountScore(precipitationAmount),
    precipitationProbabilityScore(weather.precipitation_probability),
    weatherCodePrecipitationScore(weather.weather_code),
  );

  if (THUNDERSTORM_CODES.has(weather.weather_code)) {
    return {
      score,
      reason: "Condição ruim por previsão de tempestade.",
    };
  }

  if (weather.showers > 0 || SHOWER_CODES.has(weather.weather_code)) {
    return {
      score,
      reason: "Condição ruim por previsão de pancadas de chuva.",
    };
  }

  if (weather.rain > 0 || RAIN_CODES.has(weather.weather_code)) {
    return {
      score,
      reason: "Chuva prevista torna este horário pouco recomendado.",
    };
  }

  if (DRIZZLE_CODES.has(weather.weather_code)) {
    return {
      score,
      reason: "Garoa prevista reduz a qualidade da janela.",
    };
  }

  if (SNOW_CODES.has(weather.weather_code)) {
    return {
      score,
      reason: "Condição ruim por previsão de precipitação congelada.",
    };
  }

  if (
    precipitationAmount <= 0 &&
    weather.precipitation_probability >= MODERATE_RAIN_PROBABILITY
  ) {
    return {
      score,
      reason: "Sem chuva prevista, mas há risco moderado de chuva.",
    };
  }

  if (precipitationAmount <= 0) {
    return {
      score,
      reason: "Sem chuva prevista para este horário.",
    };
  }

  if (precipitationAmount <= 0.2) {
    return {
      score,
      reason: "Chuva muito fraca pode aparecer, mas o risco ainda é baixo.",
    };
  }

  if (precipitationAmount <= 1) {
    return {
      score,
      reason: "Chuva fraca reduz a qualidade da janela.",
    };
  }

  return {
    score,
    reason: "Chuva prevista torna este horário pouco recomendado.",
  };
}

function assessSunsetClouds(weather: HourlyWeather): {
  score: number;
  reason: string;
} {
  const layeredClouds = Math.round(
    (weather.cloud_cover_mid + weather.cloud_cover_high) / 2,
  );

  if (weather.cloud_cover >= 90 || weather.cloud_cover_low >= 80) {
    return {
      score: 20,
      reason: "Céu muito fechado reduz cor, contraste e textura do pôr do sol.",
    };
  }

  if (weather.cloud_cover <= 8 && layeredClouds <= 8) {
    return {
      score: 70,
      reason: "Céu totalmente limpo é bom, mas tende a render menos textura.",
    };
  }

  if (weather.cloud_cover_low > 60) {
    return {
      score: 45,
      reason: "Muita nuvem baixa pode bloquear a luz perto do horizonte.",
    };
  }

  if (
    layeredClouds >= 25 &&
    layeredClouds <= 70 &&
    weather.cloud_cover_low <= 45
  ) {
    return {
      score: 100,
      reason:
        "Nuvens médias e altas moderadas favorecem cor e textura no pôr do sol.",
    };
  }

  return {
    score: Math.round(
      scoreIdealRange(weather.cloud_cover, 15, 70) * 0.45 +
        scoreIdealRange(layeredClouds, 25, 70) * 0.4 +
        scoreMaximum(weather.cloud_cover_low, 45, 85) * 0.15,
    ),
    reason: `Distribuição de nuvens razoável: ${weather.cloud_cover}% total, ${weather.cloud_cover_low}% baixas e ${layeredClouds}% médias/altas.`,
  };
}

function assessStargazingClouds(weather: HourlyWeather): {
  score: number;
  reason: string;
} {
  if (weather.cloud_cover >= 90 || weather.cloud_cover_low >= 75) {
    return {
      score: 5,
      reason: "Nuvens baixas ou céu muito fechado bloqueiam a observação das estrelas.",
    };
  }

  const lowCloudScore = scoreMaximum(weather.cloud_cover_low, 10, 60);
  const midCloudScore = scoreMaximum(weather.cloud_cover_mid, 20, 80);
  const highCloudScore = scoreMaximum(weather.cloud_cover_high, 40, 100);
  const totalCloudScore = scoreMaximum(weather.cloud_cover, 25, 90);
  const score = Math.round(
    lowCloudScore * 0.45 +
      midCloudScore * 0.25 +
      highCloudScore * 0.15 +
      totalCloudScore * 0.15,
  );

  if (score >= 85) {
    return {
      score,
      reason: "Poucas nuvens, principalmente baixas, deixam o céu mais aberto.",
    };
  }

  if (weather.cloud_cover_low > 35) {
    return {
      score,
      reason: `Nuvens baixas em ${weather.cloud_cover_low}% atrapalham mais a visão do céu.`,
    };
  }

  return {
    score,
    reason: `Nuvens em ${weather.cloud_cover}% reduzem parte da visibilidade do céu.`,
  };
}

function assessStargazingQuality(weather: HourlyWeather): {
  score: number;
  reason: string;
} {
  const clouds = assessStargazingClouds(weather);
  const rain = assessRain(weather);
  const visibilityScore = scoreMinimum(weather.visibility, 20000, 3000);
  const humidityScore = scoreMaximum(weather.relative_humidity_2m, 65, 95);
  const temperatureScore = scoreMinimum(weather.temperature_2m, 10, -5);
  const scores = [
    clouds.score,
    rain.score,
    visibilityScore,
    humidityScore,
    temperatureScore,
  ];
  const score = Math.min(...scores);

  if (score === rain.score && rain.score < 80) {
    return {
      score,
      reason: rain.reason,
    };
  }

  if (score === visibilityScore && visibilityScore < 80) {
    return {
      score,
      reason: `Baixa visibilidade de ${Math.round(weather.visibility / 1000)} km reduz a leitura do céu.`,
    };
  }

  if (score === clouds.score && clouds.score < 85) {
    return clouds;
  }

  if (score === humidityScore && humidityScore < 85) {
    return {
      score,
      reason: `Umidade de ${weather.relative_humidity_2m}% pode deixar o céu menos transparente.`,
    };
  }

  if (score === temperatureScore && temperatureScore < 85) {
    return {
      score,
      reason: `Temperatura de ${weather.temperature_2m}°C pode deixar a permanência ao ar livre desconfortável.`,
    };
  }

  return {
    score,
    reason: "Noite seca, sem chuva, com boa visibilidade e poucas nuvens.",
  };
}

export function createTemperatureRule(
  weight: number,
  min: number,
  max: number,
  options: TemperatureRuleOptions = {},
): ActivityRule {
  const factor = options.useApparentTemperature
    ? "sensacao_termica"
    : "temperatura";
  const label = options.useApparentTemperature
    ? "Sensação térmica"
    : "Temperatura";

  return {
    factor,
    label,
    weight,
    evaluate: (weather: HourlyWeather) => {
      const value = options.useApparentTemperature
        ? weather.apparent_temperature
        : weather.temperature_2m;

      return createRuleResult({
        factor,
        label,
        weight,
        score: scoreIdealRange(value, min, max),
        reason:
          value >= min && value <= max
            ? `${label} de ${value}°C está dentro da faixa ideal.`
            : `${label} de ${value}°C está fora da faixa ideal de ${min}°C a ${max}°C.`,
      });
    },
  };
}

export function createPrecipitationRule(weight: number): ActivityRule {
  return {
    factor: "chuva",
    label: "Chuva",
    weight,
    evaluate: (weather: HourlyWeather) => {
      const rain = assessRain(weather);

      return createRuleResult({
        factor: "chuva",
        label: "Chuva",
        weight,
        score: rain.score,
        reason: rain.reason,
      });
    },
  };
}

export function createWindRule(weight: number, idealMax: number): ActivityRule {
  return {
    factor: "vento",
    label: "Vento",
    weight,
    evaluate: (weather: HourlyWeather) =>
      createRuleResult({
        factor: "vento",
        label: "Vento",
        weight,
        score: scoreMaximum(weather.wind_speed_10m, idealMax, idealMax + 25),
        reason:
          weather.wind_speed_10m <= idealMax
            ? `Vento de ${weather.wind_speed_10m} km/h está confortável.`
            : `Vento de ${weather.wind_speed_10m} km/h pode atrapalhar a atividade.`,
      }),
  };
}

export function createWindGustRule(
  weight: number,
  idealMax: number,
): ActivityRule {
  return {
    factor: "rajadas",
    label: "Rajadas",
    weight,
    evaluate: (weather: HourlyWeather) =>
      createRuleResult({
        factor: "rajadas",
        label: "Rajadas",
        weight,
        score: scoreMaximum(weather.wind_gusts_10m, idealMax, idealMax + 30),
        reason:
          weather.wind_gusts_10m <= idealMax
            ? `Rajadas de ${weather.wind_gusts_10m} km/h estão dentro do limite recomendado.`
            : `Rajadas de ${weather.wind_gusts_10m} km/h podem deixar a atividade instável.`,
      }),
  };
}

export function createUvRule(weight: number, idealMax: number): ActivityRule {
  return {
    factor: "uv",
    label: "Índice UV",
    weight,
    evaluate: (weather: HourlyWeather) =>
      createRuleResult({
        factor: "uv",
        label: "Índice UV",
        weight,
        score: scoreMaximum(weather.uv_index, idealMax, idealMax + 7),
        reason:
          weather.uv_index <= idealMax
            ? `Índice UV ${weather.uv_index} está dentro do limite recomendado.`
            : `Índice UV ${weather.uv_index} pede mais cuidado ao ar livre.`,
      }),
  };
}

export function createGoldenHourRule(weight: number): ActivityRule {
  return {
    factor: "golden_hour",
    label: "Hora dourada",
    weight,
    evaluate: (_weather: HourlyWeather, ctx: WeatherContext) =>
      createRuleResult({
        factor: "golden_hour",
        label: "Hora dourada",
        weight,
        score: ctx.isGoldenHour ? 100 : 25,
        reason: ctx.isGoldenHour
          ? "Horário dentro da janela de luz mais favorável ao pôr do sol."
          : "Horário fora da hora dourada calculada pelo pôr do sol local.",
      }),
  };
}

export function createCloudCoverRangeRule(
  weight: number,
  min: number,
  max: number,
): ActivityRule {
  return {
    factor: "nuvens",
    label: "Nuvens",
    weight,
    evaluate: (weather: HourlyWeather) =>
      createRuleResult({
        factor: "nuvens",
        label: "Nuvens",
        weight,
        score: scoreIdealRange(weather.cloud_cover, min, max),
        reason:
          weather.cloud_cover >= min && weather.cloud_cover <= max
            ? `Cobertura de nuvens em ${weather.cloud_cover}% favorece a composição.`
            : `Cobertura de nuvens em ${weather.cloud_cover}% foge da faixa ideal de ${min}% a ${max}%.`,
      }),
  };
}

export function createSunsetCloudRule(weight: number): ActivityRule {
  return {
    factor: "nuvens_por_do_sol",
    label: "Nuvens do pôr do sol",
    weight,
    evaluate: (weather: HourlyWeather) => {
      const clouds = assessSunsetClouds(weather);

      return createRuleResult({
        factor: "nuvens_por_do_sol",
        label: "Nuvens do pôr do sol",
        weight,
        score: clouds.score,
        reason: clouds.reason,
      });
    },
  };
}

export function createVisibilityRule(weight: number): ActivityRule {
  return {
    factor: "visibilidade",
    label: "Visibilidade",
    weight,
    evaluate: (weather: HourlyWeather) =>
      createRuleResult({
        factor: "visibilidade",
        label: "Visibilidade",
        weight,
        score: scoreMinimum(weather.visibility, 10000, 1000),
        reason:
          weather.visibility >= 10000
            ? `Visibilidade de ${Math.round(weather.visibility / 1000)} km favorece fotos mais limpas.`
            : `Visibilidade de ${Math.round(weather.visibility / 1000)} km reduz nitidez e alcance da cena.`,
      }),
  };
}

export function createSunshineRule(weight: number): ActivityRule {
  return {
    factor: "luminosidade",
    label: "Luminosidade",
    weight,
    evaluate: (weather: HourlyWeather) =>
      createRuleResult({
        factor: "luminosidade",
        label: "Luminosidade",
        weight,
        score: scoreMinimum(weather.sunshine_duration, 1200, 0),
        reason:
          weather.sunshine_duration >= 1200
            ? "Luminosidade disponível favorece a cena do pôr do sol."
            : "Pouca luz direta prevista reduz cor e contraste da cena.",
      }),
  };
}

export function createStargazingQualityRule(weight: number): ActivityRule {
  return {
    factor: "qualidade_do_ceu",
    label: "Qualidade do céu",
    weight,
    evaluate: (weather: HourlyWeather) => {
      const quality = assessStargazingQuality(weather);

      return createRuleResult({
        factor: "qualidade_do_ceu",
        label: "Qualidade do céu",
        weight,
        score: quality.score,
        reason: quality.reason,
      });
    },
  };
}

export function createClearSkyRule(weight: number): ActivityRule {
  return {
    factor: "ceu_limpo",
    label: "Céu limpo",
    weight,
    evaluate: (weather: HourlyWeather) =>
      createRuleResult({
        factor: "ceu_limpo",
        label: "Céu limpo",
        weight,
        score: scoreMaximum(weather.cloud_cover, 20, 80),
        reason:
          weather.cloud_cover <= 20
            ? "Céu limpo favorece a observação das estrelas."
            : `Cobertura de nuvens em ${weather.cloud_cover}% dificulta a visibilidade do céu.`,
      }),
  };
}

export function createHumidityRule(weight: number): ActivityRule {
  return {
    factor: "umidade",
    label: "Umidade",
    weight,
    evaluate: (weather: HourlyWeather) =>
      createRuleResult({
        factor: "umidade",
        label: "Umidade",
        weight,
        score: scoreMaximum(weather.relative_humidity_2m, 70, 100),
        reason:
          weather.relative_humidity_2m < 70
            ? `Umidade de ${weather.relative_humidity_2m}% está confortável.`
            : `Umidade de ${weather.relative_humidity_2m}% pode piorar a experiência.`,
      }),
  };
}

export function createNightRule(weight: number): ActivityRule {
  return {
    factor: "noite",
    label: "Noite",
    weight,
    evaluate: (_weather: HourlyWeather, ctx: WeatherContext) =>
      createRuleResult({
        factor: "noite",
        label: "Noite",
        weight,
        score: ctx.isNight ? 100 : 0,
        reason: ctx.isNight
          ? "Horário noturno favorece a observação do céu."
          : "Horário diurno não é adequado para observar estrelas.",
      }),
  };
}

export function createMinimumTemperatureRule(
  weight: number,
  idealMin: number,
): ActivityRule {
  return {
    factor: "temperatura_minima",
    label: "Temperatura mínima",
    weight,
    evaluate: (weather: HourlyWeather) =>
      createRuleResult({
        factor: "temperatura_minima",
        label: "Temperatura mínima",
        weight,
        score: scoreMinimum(weather.temperature_2m, idealMin, 0),
        reason:
          weather.temperature_2m >= idealMin
            ? `Temperatura de ${weather.temperature_2m}°C está confortável para ficar ao ar livre.`
            : `Temperatura de ${weather.temperature_2m}°C pode deixar a atividade desconfortável.`,
      }),
  };
}

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

function precipitationScore(precipitation: number): number {
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

function precipitationReason(precipitation: number): string {
  if (precipitation <= 0) {
    return "Sem chuva prevista para este horário.";
  }

  if (precipitation <= 0.2) {
    return "Chuva muito fraca pode aparecer, mas o risco ainda é baixo.";
  }

  if (precipitation <= 1) {
    return "Chuva fraca reduz a qualidade da janela.";
  }

  return "Chuva prevista torna este horário pouco recomendado.";
}

export function createTemperatureRule(
  weight: number,
  min: number,
  max: number,
): ActivityRule {
  return {
    factor: "temperatura",
    label: "Temperatura",
    weight,
    evaluate: (weather: HourlyWeather) =>
      createRuleResult({
        factor: "temperatura",
        label: "Temperatura",
        weight,
        score: scoreIdealRange(weather.temperature_2m, min, max),
        reason:
          weather.temperature_2m >= min && weather.temperature_2m <= max
            ? `Temperatura de ${weather.temperature_2m}°C está dentro da faixa ideal.`
            : `Temperatura de ${weather.temperature_2m}°C está fora da faixa ideal de ${min}°C a ${max}°C.`,
      }),
  };
}

export function createPrecipitationRule(weight: number): ActivityRule {
  return {
    factor: "chuva",
    label: "Chuva",
    weight,
    evaluate: (weather: HourlyWeather) =>
      createRuleResult({
        factor: "chuva",
        label: "Chuva",
        weight,
        score: precipitationScore(weather.precipitation),
        reason: precipitationReason(weather.precipitation),
      }),
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

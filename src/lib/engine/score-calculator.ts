import type {
  Activity,
  ActivityTimeWindow,
  DailyAstronomy,
  HourlyWeather,
  HourScore,
  RuleResult,
  UserAvailability,
  WeatherContext,
} from "@/types";
import {
  addMinutesToLocalIso,
  buildWeatherContext,
  formatHourLabel,
  getLocalDatePart,
} from "./weather-context";

export interface CalculateHourScoreInput {
  activity: Activity;
  weather: HourlyWeather;
  context: WeatherContext;
}

export interface CalculateDayScoresInput {
  activity: Activity;
  hourly: HourlyWeather[];
  astronomy: DailyAstronomy;
  now: string;
  availability?: UserAvailability;
}

const MAX_HOURS_PER_DAY = 24;
const FUTURE_RAIN_LOOKAHEAD_HOURS = 3;
const FUTURE_RAIN_MAX_SCORE = 30;
const FUTURE_RAIN_PENALIZED_SCORE = 30;
const GOLDEN_HOUR_START_OFFSET_MINUTES = -60;
const GOLDEN_HOUR_END_OFFSET_MINUTES = 15;
const FUTURE_RAIN_ACTIVITY_IDS = new Set<Activity["id"]>([
  "lavar_carro",
  "lavar_roupa",
]);

type TimeWindowSource = "availability" | "default";

interface TimeWindowFilter {
  source: TimeWindowSource;
  windows: ActivityTimeWindow[];
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function buildFutureRainPenalty(
  activity: Activity,
  weather: HourlyWeather,
): RuleResult {
  const impactReason =
    activity.id === "lavar_roupa"
      ? "pode molhar a roupa no varal"
      : "pode comprometer a lavagem do carro";

  return {
    factor: "chuva_futura",
    label: "Chuva futura",
    weight: 0,
    score: 0,
    reason: `Chuva relevante às ${formatHourLabel(weather.time)} ${impactReason}.`,
  };
}

function formatTimeWindow(window: ActivityTimeWindow): string {
  if (window.start === window.end) {
    return "Dia inteiro";
  }

  return `Das ${window.start} às ${window.end}`;
}

function buildGoldenHourTimeWindow(astronomy: DailyAstronomy): ActivityTimeWindow {
  return {
    start: formatHourLabel(
      addMinutesToLocalIso(
        astronomy.sunset,
        GOLDEN_HOUR_START_OFFSET_MINUTES,
      ),
    ),
    end: formatHourLabel(
      addMinutesToLocalIso(astronomy.sunset, GOLDEN_HOUR_END_OFFSET_MINUTES),
    ),
    label: "Hora dourada",
  };
}

function buildTimeWindowPenalty(filter: TimeWindowFilter): RuleResult {
  const reason =
    filter.source === "availability"
      ? `Fora da disponibilidade informada (${formatTimeWindow(filter.windows[0])}).`
      : `Fora do horario padrao da atividade (${filter.windows.map(formatTimeWindow).join(", ")}).`;

  return {
    factor: filter.source === "availability" ? "disponibilidade" : "horario_padrao",
    label: filter.source === "availability" ? "Disponibilidade" : "Horario padrao",
    weight: 0,
    score: 0,
    reason,
  };
}

function getTimeWindowFilter(
  activity: Activity,
  availability: UserAvailability | undefined,
  astronomy: DailyAstronomy,
): TimeWindowFilter | null {
  if (availability) {
    return {
      source: "availability",
      windows: [
        {
          start: availability.availableFrom,
          end: availability.availableTo,
        },
      ],
    };
  }

  if (activity.defaultTimeWindowStrategy === "golden_hour") {
    return {
      source: "default",
      windows: [buildGoldenHourTimeWindow(astronomy)],
    };
  }

  if (activity.defaultTimeWindows?.length) {
    return {
      source: "default",
      windows: activity.defaultTimeWindows,
    };
  }

  return null;
}

function isInsideTimeWindow(time: string, window: ActivityTimeWindow): boolean {
  if (window.start === window.end) {
    return true;
  }

  if (window.start < window.end) {
    return time >= window.start && time < window.end;
  }

  return time >= window.start || time < window.end;
}

function isInsideTimeWindowFilter(
  weather: HourlyWeather,
  filter: TimeWindowFilter | null,
): boolean {
  if (!filter) {
    return true;
  }

  const time = weather.time.slice(11, 16);

  return filter.windows.some((window) => isInsideTimeWindow(time, window));
}

function findCarWashFutureRainPenalty(input: {
  activity: Activity;
  hourly: HourlyWeather[];
  currentIndex: number;
  astronomy: DailyAstronomy;
  now: string;
}): RuleResult | null {
  if (!FUTURE_RAIN_ACTIVITY_IDS.has(input.activity.id)) {
    return null;
  }

  const rainRule = input.activity.rules.find((rule) => rule.factor === "chuva");

  if (!rainRule) {
    return null;
  }

  const futureWeather = input.hourly
    .slice(
      input.currentIndex + 1,
      input.currentIndex + 1 + FUTURE_RAIN_LOOKAHEAD_HOURS,
    )
    .find((weather) => {
      const context = buildWeatherContext({
        weather,
        astronomy: input.astronomy,
        now: input.now,
      });
      const rainResult = rainRule.evaluate(weather, context);

      return rainResult.score <= FUTURE_RAIN_MAX_SCORE;
    });

  return futureWeather
    ? buildFutureRainPenalty(input.activity, futureWeather)
    : null;
}

function applyFutureRainPenalty(
  score: HourScore,
  penalty: RuleResult | null,
): HourScore {
  if (!penalty) {
    return score;
  }

  return {
    ...score,
    score: Math.min(score.score, FUTURE_RAIN_PENALIZED_SCORE),
    breakdown: [...score.breakdown, penalty],
  };
}

function applyAvailabilityFilter(
  score: HourScore,
  filter: TimeWindowFilter | null,
): HourScore {
  if (isInsideTimeWindowFilter(score.weather, filter) || !filter) {
    return score;
  }

  return {
    ...score,
    score: 0,
    breakdown: [...score.breakdown, buildTimeWindowPenalty(filter)],
  };
}

export function calculateHourScore({
  activity,
  weather,
  context,
}: CalculateHourScoreInput): HourScore {
  const breakdown = activity.rules.map((rule) =>
    rule.evaluate(weather, context),
  );
  const totalWeight = breakdown.reduce((sum, rule) => sum + rule.weight, 0);
  const weightedScore =
    totalWeight === 0
      ? 0
      : breakdown.reduce(
          (sum, rule) => sum + rule.score * rule.weight,
          0,
        ) / totalWeight;

  return {
    time: weather.time,
    hourLabel: formatHourLabel(weather.time),
    score: context.isPastHour ? 0 : clampScore(weightedScore),
    weather,
    breakdown,
  };
}

export function calculateDayScores({
  activity,
  hourly,
  astronomy,
  now,
  availability,
}: CalculateDayScoresInput): HourScore[] {
  const dailyHourly = hourly
    .filter((weather) => getLocalDatePart(weather.time) === astronomy.date)
    .slice(0, MAX_HOURS_PER_DAY);
  const timeWindowFilter = getTimeWindowFilter(activity, availability, astronomy);

  return dailyHourly.map((weather, index) => {
    const context = buildWeatherContext({ weather, astronomy, now });
    const score = calculateHourScore({
      activity,
      weather,
      context,
    });
    const futureRainPenalty = findCarWashFutureRainPenalty({
      activity,
      hourly: dailyHourly,
      currentIndex: index,
      astronomy,
      now,
    });

    return applyAvailabilityFilter(
      applyFutureRainPenalty(score, futureRainPenalty),
      timeWindowFilter,
    );
  });
}


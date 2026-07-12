import type {
  ForecastConfidenceLevel,
  HourScore,
  Recommendation,
  RuleResult,
  UserAvailability,
  WindowResult,
} from "@/types";
import { getScoreRingBand } from "./score-ring";
import { formatCityLabel } from "./search-page";

export interface TimelineDatum {
  time: string;
  hourLabel: string;
  score: number;
  reason: string;
  isRecommended: boolean;
  isBestWindow: boolean;
  rainRisk: string | null;
  wind: string | null;
  confidenceLevel: ForecastConfidenceLevel | null;
}

export interface BreakdownSource {
  title: string;
  subtitle: string;
  score: HourScore | null;
}

const WHOLE_DAY_MIN_DURATION_HOURS = 22;

type WindowDisplayInput = Pick<
  WindowResult,
  "startLabel" | "endLabel" | "durationHours"
>;

function compareRulesByPositiveImpact(a: RuleResult, b: RuleResult): number {
  return b.score - a.score || b.weight - a.weight || a.label.localeCompare(b.label);
}

function compareRulesByPenalty(a: RuleResult, b: RuleResult): number {
  return a.score - b.score || b.weight - a.weight || a.label.localeCompare(b.label);
}

function sortByPeakScore(a: HourScore, b: HourScore): number {
  return b.score - a.score || a.time.localeCompare(b.time);
}

export function getPrimaryReason(score: HourScore): string {
  const orderedRules = [...score.breakdown].sort(
    score.score >= 70 ? compareRulesByPositiveImpact : compareRulesByPenalty,
  );

  return orderedRules[0]?.reason ?? "Sem detalhamento para este horário.";
}

export function buildTimelineData(
  scores: HourScore[],
  minRecommendedScore: number,
  bestWindow: WindowResult | null = null,
): TimelineDatum[] {
  const bestWindowTimes = new Set(
    bestWindow?.scores.map((score) => score.time) ?? [],
  );

  return scores.map((score) => ({
    time: score.time,
    hourLabel: score.hourLabel,
    score: score.score,
    reason: getPrimaryReason(score),
    isRecommended: score.score >= minRecommendedScore,
    isBestWindow: bestWindowTimes.has(score.time),
    rainRisk: getRainRiskLabel(score),
    wind: getWindLabel(score),
    confidenceLevel:
      bestWindowTimes.has(score.time) && bestWindow
        ? bestWindow.confidence.level
        : null,
  }));
}

function getWindLabel(score: HourScore): string | null {
  const wind = score.weather.wind_speed_10m;
  const gusts = score.weather.wind_gusts_10m;

  if (!Number.isFinite(wind)) {
    return null;
  }

  const windLabel = `Vento: ${Math.round(wind)} km/h`;

  return Number.isFinite(gusts) && gusts > wind
    ? `${windLabel}, rajadas ${Math.round(gusts)} km/h`
    : windLabel;
}

function getRainRiskLabel(score: HourScore): string | null {
  const precipitation = Math.max(
    score.weather.precipitation,
    score.weather.rain,
    score.weather.showers,
  );

  if (precipitation > 0) {
    return `Chuva prevista: ${precipitation} mm`;
  }

  if (score.weather.precipitation_probability >= 20) {
    return `Risco de chuva: ${score.weather.precipitation_probability}%`;
  }

  return null;
}

export function getAlternativeWindows(windows: WindowResult[]): WindowResult[] {
  return windows.slice(1);
}

export function formatTimeRange(start: string, end: string): string {
  if (start === end) {
    return "Dia inteiro";
  }

  return `Das ${start} às ${end}`;
}

export function isWholeDayWindow(window: WindowDisplayInput): boolean {
  return (
    window.durationHours >= WHOLE_DAY_MIN_DURATION_HOURS ||
    window.startLabel === window.endLabel
  );
}

export function formatWindowTimeRange(window: WindowDisplayInput): string {
  return isWholeDayWindow(window)
    ? "Dia inteiro"
    : formatTimeRange(window.startLabel, window.endLabel);
}

export function formatDecisionWindow(
  window: WindowDisplayInput | null,
): string {
  if (!window) {
    return "Sem janela ideal";
  }

  return isWholeDayWindow(window)
    ? "Dia inteiro"
    : `${window.startLabel} → ${window.endLabel}`;
}

export function getDecisionQualityLabel(score: number): string {
  return getScoreRingBand(score).label;
}

export function formatAvailabilityNotice(
  availability: UserAvailability,
): string {
  return `Dentro da sua disponibilidade: ${formatTimeRange(
    availability.availableFrom,
    availability.availableTo,
  )}.`;
}

export function formatForecastConfidenceLevel(
  level: ForecastConfidenceLevel,
): string {
  const labels: Record<ForecastConfidenceLevel, string> = {
    alta: "Alta",
    media: "Média",
    baixa: "Baixa",
  };

  return labels[level];
}

export function getPeakHourScore(scores: HourScore[]): HourScore | null {
  return [...scores].sort(sortByPeakScore)[0] ?? null;
}

export function getBreakdownSource(
  recommendation: Recommendation,
): BreakdownSource {
  const bestWindowPeak = recommendation.bestWindow
    ? getPeakHourScore(recommendation.bestWindow.scores)
    : null;
  const fallbackPeak = getPeakHourScore(recommendation.scores);
  const score = bestWindowPeak ?? fallbackPeak;

  return {
    title: bestWindowPeak
      ? "Fatores da melhor janela"
      : "Fatores do melhor horário disponível",
    subtitle: score
      ? `${score.hourLabel} com score ${score.score}/100`
      : "Sem horários avaliados para esta data",
    score,
  };
}

export function formatDurationHours(durationHours: number): string {
  if (durationHours >= WHOLE_DAY_MIN_DURATION_HOURS) {
    return "dia inteiro";
  }

  return durationHours === 1 ? "1 hora" : `${durationHours} horas`;
}

export function formatRecommendationDate(date: string): string {
  const parsedDate = new Date(`${date}T00:00:00`);

  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(parsedDate);
}

export function formatRecommendationLocation(
  recommendation: Recommendation,
): string {
  return formatCityLabel(recommendation.city);
}

import type { Activity, HourScore, RuleResult, WindowResult } from "@/types";
import { calculateForecastConfidence } from "./forecast-confidence";
import {
  addHoursToLocalIso,
  formatHourLabel,
  minutesBetweenLocalIso,
} from "./weather-context";

const DEFAULT_MAX_WINDOWS = 3;

type WindowActivityConfig = Pick<
  Activity,
  "minRecommendedScore" | "minDurationHours"
>;

function isConsecutiveHour(previous: HourScore, current: HourScore): boolean {
  return minutesBetweenLocalIso(current.time, previous.time) === 60;
}

function getPeakScore(scores: HourScore[]): HourScore {
  return [...scores].sort((a, b) => b.score - a.score)[0];
}

function sortHighlights(a: RuleResult, b: RuleResult): number {
  return b.score - a.score || b.weight - a.weight;
}

function buildHighlights(scores: HourScore[]): string[] {
  const peakScore = getPeakScore(scores);
  const positiveReasons = peakScore.breakdown
    .filter((rule) => rule.score >= 70)
    .sort(sortHighlights)
    .map((rule) => rule.reason);
  const fallbackReasons = peakScore.breakdown
    .sort(sortHighlights)
    .map((rule) => rule.reason);

  return [...new Set([...positiveReasons, ...fallbackReasons])].slice(0, 3);
}

function buildWindowResult(scores: HourScore[]): WindowResult {
  const startScore = scores[0];
  const endScore = scores[scores.length - 1];
  const endTime = addHoursToLocalIso(endScore.time, 1);
  const peakScore = Math.max(...scores.map((score) => score.score));
  const avgScore = Math.round(
    scores.reduce((sum, score) => sum + score.score, 0) / scores.length,
  );

  return {
    startTime: startScore.time,
    endTime,
    startLabel: startScore.hourLabel,
    endLabel: formatHourLabel(endTime),
    durationHours: scores.length,
    avgScore,
    peakScore,
    confidence: calculateForecastConfidence(scores),
    highlights: buildHighlights(scores),
    scores,
  };
}

export function findBestWindows(
  scores: HourScore[],
  activity: WindowActivityConfig,
  maxWindows = DEFAULT_MAX_WINDOWS,
): WindowResult[] {
  const sortedScores = [...scores].sort((a, b) => a.time.localeCompare(b.time));
  const candidates: HourScore[][] = [];
  let current: HourScore[] = [];

  for (const score of sortedScores) {
    if (score.score < activity.minRecommendedScore) {
      if (current.length > 0) {
        candidates.push(current);
      }

      current = [];
      continue;
    }

    if (
      current.length === 0 ||
      isConsecutiveHour(current[current.length - 1], score)
    ) {
      current.push(score);
      continue;
    }

    candidates.push(current);
    current = [score];
  }

  if (current.length > 0) {
    candidates.push(current);
  }

  return candidates
    .filter((candidate) => candidate.length >= activity.minDurationHours)
    .map(buildWindowResult)
    .sort(
      (a, b) =>
        b.avgScore - a.avgScore ||
        b.peakScore - a.peakScore ||
        b.durationHours - a.durationHours ||
        a.startTime.localeCompare(b.startTime),
    )
    .slice(0, maxWindows);
}


"use client";

import { useEffect, useState } from "react";
import {
  getScoreRingBand,
  getScoreRingStrokeOffset,
  normalizeScore,
} from "@/lib/ui/score-ring";
import { cn } from "@/lib/utils";

interface ScoreRingProps {
  score: number;
  className?: string;
}

const RING_RADIUS = 52;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function getToneClassName(tone: ReturnType<typeof getScoreRingBand>["tone"]): string {
  const toneClasses = {
    success: "text-success",
    accent: "text-weather-accent",
    warning: "text-warning",
    caution: "text-amber-400",
    danger: "text-danger",
  };

  return toneClasses[tone];
}

export function ScoreRing({ score, className }: ScoreRingProps) {
  const [isFilled, setIsFilled] = useState(false);
  const normalizedScore = normalizeScore(score);
  const band = getScoreRingBand(normalizedScore);
  const strokeDashoffset = getScoreRingStrokeOffset(
    normalizedScore,
    RING_CIRCUMFERENCE,
  );

  useEffect(() => {
    const animationFrame = window.requestAnimationFrame(() => setIsFilled(true));

    return () => window.cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <div
      className={cn(
        "relative grid aspect-square w-48 place-items-center sm:w-56",
        className,
      )}
      role="img"
      aria-label={`Score ${normalizedScore} de 100: ${band.label}`}
    >
      <svg
        className="size-full -rotate-90"
        viewBox="0 0 120 120"
        aria-hidden="true"
      >
        <circle
          cx="60"
          cy="60"
          r={RING_RADIUS}
          fill="none"
          strokeWidth="9"
          className="stroke-weather-muted/45"
        />
        <circle
          cx="60"
          cy="60"
          r={RING_RADIUS}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={isFilled ? strokeDashoffset : RING_CIRCUMFERENCE}
          className={cn(
            "stroke-current transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none",
            getToneClassName(band.tone),
          )}
        />
      </svg>
      <div className="absolute grid place-items-center text-center">
        <span className="text-xs font-medium text-muted-foreground">Score</span>
        <div className="flex items-start text-slate-950 dark:text-slate-50">
          <span className="text-6xl leading-none font-semibold">
            {normalizedScore}
          </span>
          <span className="mt-1 text-sm font-medium">/100</span>
        </div>
        <span className={cn("mt-2 text-sm font-semibold", getToneClassName(band.tone))}>
          {band.label}
        </span>
      </div>
    </div>
  );
}

import { describe, expect, it } from "vitest";
import { findBestWindows } from "@/lib/engine/window-finder";
import type { HourScore } from "@/types";

const activity = {
  minRecommendedScore: 60,
  minDurationHours: 2,
};

function makeScore(time: string, score: number, reason = "Janela favoravel") {
  return {
    time,
    hourLabel: time.slice(11, 16),
    score,
    breakdown: [
      {
        factor: "tempo",
        label: "Tempo",
        score,
        weight: 100,
        reason,
      },
    ],
  } satisfies HourScore;
}

describe("buscador de janelas", () => {
  it("agrupa horas consecutivas acima do minimo", () => {
    const windows = findBestWindows(
      [
        makeScore("2026-06-05T08:00", 70),
        makeScore("2026-06-05T09:00", 80),
        makeScore("2026-06-05T10:00", 40),
        makeScore("2026-06-05T11:00", 84),
        makeScore("2026-06-05T12:00", 92),
        makeScore("2026-06-05T13:00", 79),
      ],
      activity,
    );

    expect(windows).toHaveLength(2);
    expect(windows[0]).toMatchObject({
      startTime: "2026-06-05T11:00",
      endTime: "2026-06-05T14:00",
      startLabel: "11:00",
      endLabel: "14:00",
      durationHours: 3,
      avgScore: 85,
      peakScore: 92,
    });
    expect(windows[1].startTime).toBe("2026-06-05T08:00");
  });

  it("remove janelas menores que a duracao minima", () => {
    const windows = findBestWindows(
      [
        makeScore("2026-06-05T08:00", 80),
        makeScore("2026-06-05T09:00", 40),
        makeScore("2026-06-05T10:00", 90),
      ],
      activity,
    );

    expect(windows).toEqual([]);
  });

  it("retorna top 3 ordenado por media, pico e duracao", () => {
    const windows = findBestWindows(
      [
        makeScore("2026-06-05T08:00", 70),
        makeScore("2026-06-05T09:00", 70),
        makeScore("2026-06-05T11:00", 90),
        makeScore("2026-06-05T12:00", 70),
        makeScore("2026-06-05T14:00", 80),
        makeScore("2026-06-05T15:00", 80),
        makeScore("2026-06-05T16:00", 80),
        makeScore("2026-06-05T18:00", 95),
        makeScore("2026-06-05T19:00", 95),
      ],
      activity,
    );

    expect(windows.map((window) => window.startTime)).toEqual([
      "2026-06-05T18:00",
      "2026-06-05T11:00",
      "2026-06-05T14:00",
    ]);
  });
});

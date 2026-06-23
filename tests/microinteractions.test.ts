import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("microinterações", () => {
  it("anima entrada de cards e chips, com redução de movimento", () => {
    const styles = readSource("src/app/globals.css");
    const chips = readSource("src/components/result/reason-chips.tsx");

    expect(styles).toContain("weather-card-enter");
    expect(styles).toContain("weather-chip-enter");
    expect(styles).toContain("prefers-reduced-motion: reduce");
    expect(chips).toContain("motion-chip-enter");
  });

  it("preenche score e anima seleção sem dependência extra", () => {
    const scoreRing = readSource("src/components/result/score-ring.tsx");
    const activitySelector = readSource(
      "src/components/search/activity-selector.tsx",
    );
    const modeSelector = readSource("src/components/search/mode-selector.tsx");

    expect(scoreRing).toContain("requestAnimationFrame");
    expect(scoreRing).toContain(
      "strokeDashoffset={isFilled ? strokeDashoffset : RING_CIRCUMFERENCE}",
    );
    expect(activitySelector).toContain("motion-selection-check");
    expect(modeSelector).toContain("motion-safe:active:scale-[0.98]");
  });

  it("destaca melhor janela sem animar quando usuário reduz movimento", () => {
    const timeline = readSource(
      "src/components/result/opportunity-timeline.tsx",
    );

    expect(timeline).toContain("motion-timeline-best");
    expect(timeline).toContain("motion-safe:-translate-y-1");
    expect(timeline).toContain("motion-reduce:transition-none");
  });
});

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readSource(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("cockpit principal", () => {
  it("mantem shell desktop com altura controlada", () => {
    const page = readSource("src/app/page.tsx");

    expect(page).toContain("lg:h-dvh lg:overflow-hidden");
    expect(page).toContain("lg:h-[calc(100dvh-1.5rem)]");
    expect(page).toContain(
      "lg:grid-rows-[auto_auto_minmax(0,1fr)_8rem_auto]",
    );
    expect(page).toContain("grid min-h-0 gap-3");
    expect(page).toContain("CockpitRecommendationPanel");
    expect(page).not.toContain("RecommendationCard");
    expect(page).not.toContain("ControlPanelSection");
    expect(page).not.toContain("ActivitySelector");
  });

  it("mantem faixa inferior dentro da altura do grid", () => {
    const strip = readSource("src/components/result/bottom-forecast-strip.tsx");

    expect(strip).toContain("className?: string");
    expect(strip).toContain("glass-panel h-full");
    expect(strip).toContain("grid h-full min-h-0");
    expect(strip).toContain("overview.days.map");
    expect(strip).not.toContain("min-h-28");
    expect(strip).not.toContain("overflow-x-auto");
  });
});

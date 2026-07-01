import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readActivitySelector() {
  return readFileSync(
    join(process.cwd(), "src/components/search/activity-selector.tsx"),
    "utf8",
  );
}

describe("ActivitySelector", () => {
  const source = readActivitySelector();

  it("cobre todas as atividades com icones visuais", () => {
    const activityIds = [
      "correr",
      "caminhar",
      "pedalar",
      "fotografar_por_do_sol",
      "observar_estrelas",
      "lavar_carro",
      "lavar_roupa",
    ];

    for (const activityId of activityIds) {
      expect(source).toContain(activityId);
    }

    expect(source).toContain("getActivityIcon");
  });

  it("mantem estados acessiveis de selecao, foco e disabled", () => {
    expect(source).toContain('role="radiogroup"');
    expect(source).toContain('role="radio"');
    expect(source).toContain("aria-checked={selected}");
    expect(source).toContain("focus-visible:ring-3");
    expect(source).toContain("disabled:cursor-not-allowed");
    expect(source).toContain("shadow-[0_0_30px");
  });

  it("permanece responsivo e sem mapa", () => {
    expect(source).toContain("sm:grid-cols-2");
    expect(source).toContain("xl:grid-cols-7");
    expect(source).toContain("xl:min-h-10");
    expect(source).toContain("xl:size-5");
    expect(source).toContain("aria-label={activity.name}");
    expect(source).toContain("ACTIVITY_COMPACT_LABELS");
    expect(source).not.toContain("MapLibre");
    expect(source).not.toContain("maptiler");
  });
});

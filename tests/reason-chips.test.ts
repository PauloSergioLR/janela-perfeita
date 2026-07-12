import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getReasonGroups, getReasonKind } from "@/lib/ui/reason-chips";
import type { RuleResult } from "@/types";

function makeRule(
  factor: string,
  score: number,
  reason: string,
): RuleResult {
  return {
    factor,
    label: factor,
    score,
    weight: 10,
    reason,
  };
}

function readReasonChips() {
  return readFileSync(
    join(process.cwd(), "src/components/result/reason-chips.tsx"),
    "utf8",
  );
}

describe("ReasonChips", () => {
  it("separa motivos positivos, de atenção e negativos", () => {
    const positive = makeRule("temperatura", 90, "Temperatura confortável.");
    const attention = makeRule("uv", 60, "UV sobe após 10h.");
    const negative = makeRule("chuva", 20, "Chuva prevista reduz a janela.");

    expect(getReasonKind(70)).toBe("positive");
    expect(getReasonKind(40)).toBe("attention");
    expect(getReasonKind(39)).toBe("negative");
    expect(getReasonGroups([positive, attention, negative])).toEqual([
      { kind: "positive", title: "A favor", rules: [positive] },
      { kind: "attention", title: "Atenção", rules: [attention] },
      { kind: "negative", title: "Desfavoráveis", rules: [negative] },
    ]);
  });

  it("remove motivos repetidos mesmo com diferenças de espaço ou acento", () => {
    const first = makeRule("condição", 90, "Condição favorável.");
    const duplicate = makeRule("condicao", 60, " condicao favoravel. ");

    expect(getReasonGroups([first, duplicate])).toEqual([
      { kind: "positive", title: "A favor", rules: [first] },
    ]);
  });

  it("usa chips acessíveis, responsivos e sem mapa", () => {
    const source = readReasonChips();

    expect(source).toContain('aria-label="Motivos da recomendação"');
    expect(source).toContain("CheckCircle2");
    expect(source).toContain("AlertTriangle");
    expect(source).toContain("CircleX");
    expect(source).toContain("flex flex-wrap gap-2");
    expect(source).not.toContain("MapLibre");
    expect(source).not.toContain("maptiler");
  });
});

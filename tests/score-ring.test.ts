import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  getScoreRingBand,
  getScoreRingStrokeOffset,
  normalizeScore,
} from "@/lib/ui/score-ring";

function readScoreRing() {
  return readFileSync(
    join(process.cwd(), "src/components/result/score-ring.tsx"),
    "utf8",
  );
}

describe("ScoreRing", () => {
  it("classifica as faixas de score com labels e tons coerentes", () => {
    expect(getScoreRingBand(85)).toEqual({ label: "Excelente", tone: "success" });
    expect(getScoreRingBand(70)).toEqual({ label: "Boa", tone: "accent" });
    expect(getScoreRingBand(60)).toEqual({ label: "Aceitável", tone: "warning" });
    expect(getScoreRingBand(40)).toEqual({ label: "Fraca", tone: "caution" });
    expect(getScoreRingBand(39)).toEqual({
      label: "Não recomendado",
      tone: "danger",
    });
  });

  it("normaliza score e calcula o progresso do anel", () => {
    expect(normalizeScore(-1)).toBe(0);
    expect(normalizeScore(86.4)).toBe(86);
    expect(normalizeScore(101)).toBe(100);
    expect(normalizeScore(Number.NaN)).toBe(0);
    expect(getScoreRingStrokeOffset(100, 100)).toBe(0);
    expect(getScoreRingStrokeOffset(50, 100)).toBe(50);
  });

  it("renderiza SVG responsivo com descricao textual acessivel", () => {
    const source = readScoreRing();

    expect(source).toContain("<svg");
    expect(source).toContain('role="img"');
    expect(source).toContain("aria-label={`Score ${normalizedScore} de 100: ${band.label}`}");
    expect(source).toContain("strokeDasharray={RING_CIRCUMFERENCE}");
    expect(source).toContain("w-48 place-items-center sm:w-56");
    expect(source).toContain(">Score</span>");
    expect(source).not.toContain("MapLibre");
    expect(source).not.toContain("maptiler");
  });
});

import { describe, expect, it } from "vitest";
import { getAllActivities } from "@/lib/domain/activities";
import { buildScoreExplainerActivities } from "@/lib/ui/score-explainer";

describe("conteúdo técnico do score", () => {
  it("resume pesos e mínimos das atividades sem alterar regras", () => {
    const activities = buildScoreExplainerActivities(getAllActivities());

    expect(activities).toHaveLength(6);
    expect(activities.map((activity) => activity.id)).toEqual([
      "correr",
      "caminhar",
      "pedalar",
      "fotografar_por_do_sol",
      "observar_estrelas",
      "lavar_carro",
    ]);
    expect(activities.every((activity) => activity.totalWeight === 100)).toBe(
      true,
    );
    expect(
      activities.find((activity) => activity.id === "lavar_carro")?.rules,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          factor: "chuva",
          weight: 50,
        }),
      ]),
    );
  });
});

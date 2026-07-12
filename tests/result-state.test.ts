import { describe, expect, it } from "vitest";
import { getResultState } from "@/lib/ui/result-state";

describe("estado visual do resultado", () => {
  it("prioriza carregamento e erro sobre conteúdo anterior", () => {
    expect(
      getResultState({
        hasContent: true,
        isError: false,
        isIdle: false,
        isPending: true,
      }),
    ).toBe("loading");

    expect(
      getResultState({
        hasContent: true,
        isError: true,
        isIdle: false,
        isPending: false,
      }),
    ).toBe("error");
  });

  it("distingue estado inicial, conteúdo e resposta sem dados", () => {
    expect(
      getResultState({
        hasContent: false,
        isError: false,
        isIdle: true,
        isPending: false,
      }),
    ).toBe("initial");

    expect(
      getResultState({
        hasContent: true,
        isError: false,
        isIdle: false,
        isPending: false,
      }),
    ).toBe("content");

    expect(
      getResultState({
        hasContent: false,
        isError: false,
        isIdle: false,
        isPending: false,
      }),
    ).toBe("empty");
  });
});

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  formatForecastDayLabel,
  formatTemperatureRange,
  getForecastClassification,
  getForecastShortSummary,
} from "@/lib/ui/forecast-strip";

function readForecastStrip() {
  return readFileSync(
    join(process.cwd(), "src/components/result/forecast-strip.tsx"),
    "utf8",
  );
}

describe("ForecastStrip", () => {
  it("classifica dias pela chuva e conforto", () => {
    expect(
      getForecastClassification({
        comfortScore: 95,
        precipitationProbabilityMax: 10,
        precipitationSum: 0,
      }),
    ).toEqual({ label: "Ótimo", tone: "excellent" });
    expect(
      getForecastClassification({
        comfortScore: 76,
        precipitationProbabilityMax: 20,
        precipitationSum: 0,
      }),
    ).toEqual({ label: "Bom", tone: "good" });
    expect(
      getForecastClassification({
        comfortScore: 60,
        precipitationProbabilityMax: 20,
        precipitationSum: 0,
      }),
    ).toEqual({ label: "Regular", tone: "regular" });
    expect(
      getForecastClassification({
        comfortScore: 95,
        precipitationProbabilityMax: 60,
        precipitationSum: 0,
      }),
    ).toEqual({ label: "Atenção à chuva", tone: "rain" });
  });

  it("formata dia, temperatura e resumo sem inventar dados", () => {
    expect(formatForecastDayLabel("2030-06-05", "2030-06-05")).toBe("Hoje");
    expect(formatTemperatureRange(14.2, 22.8)).toBe("14° / 23°");
    expect(formatTemperatureRange(null, null)).toBe("— / —");
    expect(
      getForecastShortSummary("Dia seco com vento leve. Mais detalhes.", "Nublado"),
    ).toBe("Dia seco com vento leve");
    expect(getForecastShortSummary("", "Nublado")).toBe("Nublado");
  });

  it("mantém cards compactos, scroll mobile e sem mapa", () => {
    const source = readForecastStrip();

    expect(source).toContain('aria-label="Previsão dos próximos dias"');
    expect(source).toContain("overflow-x-auto");
    expect(source).toContain("w-44 shrink-0");
    expect(source).toContain("CloudRain");
    expect(source).toContain("CloudSnow");
    expect(source).not.toContain("MapLibre");
    expect(source).not.toContain("maptiler");
  });
});

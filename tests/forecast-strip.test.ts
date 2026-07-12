import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  formatForecastDayLabel,
  formatTemperatureRange,
  getForecastClassification,
  getForecastShortSummary,
  getForecastStripDaysForView,
} from "@/lib/ui/forecast-strip";
import type { WeeklyWeatherDayOverview } from "@/types";

function readForecastStrip() {
  return readFileSync(
    join(process.cwd(), "src/components/result/forecast-strip.tsx"),
    "utf8",
  );
}

function makeForecastDay(date: string): WeeklyWeatherDayOverview {
  return {
    apparentTemperatureMax: 24,
    apparentTemperatureMin: 15,
    city: {
      coordinates: { lat: -28.68, lon: -49.37 },
      country: "Brasil",
      name: "Criciúma",
    },
    comfortScore: 82,
    date,
    disclaimer: "Dados meteorológicos por Open-Meteo.",
    generatedAt: "2030-06-05T09:00:00.000Z",
    hourly: [],
    precipitationProbabilityMax: 20,
    precipitationSum: 0,
    summary: "Dia seco com vento leve.",
    sunrise: "2030-06-05T06:20:00.000Z",
    sunset: "2030-06-05T17:40:00.000Z",
    temperatureMax: 24,
    temperatureMin: 15,
    uvIndexMax: 5,
    weatherCode: 1,
    weatherLabel: "Parcialmente nublado",
    windGustsMax: 24,
    windSpeedMax: 12,
  };
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

  it("separa cards por abas da faixa inferior", () => {
    const days = [
      makeForecastDay("2030-06-05"),
      makeForecastDay("2030-06-06"),
      makeForecastDay("2030-06-07"),
    ];

    expect(getForecastStripDaysForView(days, "today")).toStrictEqual([days[0]]);
    expect(getForecastStripDaysForView(days, "next-days")).toStrictEqual([
      days[1],
      days[2],
    ]);
    expect(getForecastStripDaysForView(days, "weekly")).toStrictEqual(days);
    expect(getForecastStripDaysForView([days[0]], "next-days")).toStrictEqual([
      days[0],
    ]);
  });

  it("mantém cards compactos com tabs, setas e sem mapa", () => {
    const source = readForecastStrip();

    expect(source).toContain("export function BottomForecastStrip");
    expect(source).toContain('aria-label="Previsão dos próximos dias"');
    expect(source).toContain('role="tablist"');
    expect(source).toContain("forecastStripViewOptions");
    expect(source).toContain("scrollbar-none");
    expect(source).toContain("overflow-x-auto");
    expect(source).toContain("touch-pan-x");
    expect(source).toContain("scrollBy");
    expect(source).toContain("ChevronLeft");
    expect(source).toContain("ChevronRight");
    expect(source).toContain("Ver próximos dias");
    expect(source).toContain("flex min-h-[8.75rem]");
    expect(source).toContain("grid-cols-[minmax(0,1fr)_auto]");
    expect(source).toContain("line-clamp-2 min-h-8");
    expect(source).toContain("whitespace-nowrap tabular-nums");
    expect(source).not.toContain("xl:h-[6rem]");
    expect(source).not.toContain("min-w-max");
    expect(source).not.toContain("w-44");
    expect(source).toContain("getWeatherIcon");
    expect(source).not.toContain("MapLibre");
    expect(source).not.toContain("maptiler");
  });
});

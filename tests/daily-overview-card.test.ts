import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getDailyClimateSummary } from "@/lib/ui/daily-overview";
import { makeHourlyWeather } from "./fixtures/weather";

function readDailyOverviewCard() {
  return readFileSync(
    join(process.cwd(), "src/components/result/daily-overview-card.tsx"),
    "utf8",
  );
}

function readHourlyTimeline() {
  return readFileSync(
    join(process.cwd(), "src/components/result/hourly-timeline.tsx"),
    "utf8",
  );
}

describe("DailyOverviewCard", () => {
  it("calcula umidade média e horas de sol com dados reais", () => {
    const summary = getDailyClimateSummary([
      makeHourlyWeather("2030-06-05T08:00", {
        relative_humidity_2m: 60,
        sunshine_duration: 1800,
      }),
      makeHourlyWeather("2030-06-05T09:00", {
        relative_humidity_2m: 70,
        sunshine_duration: 2700,
      }),
    ]);

    expect(summary).toEqual({ averageHumidity: 65, sunshineHours: 1.3 });
  });

  it("mantém visual premium, métricas e timeline acessível", () => {
    const source = readDailyOverviewCard();

    expect(source).toContain("Condição principal");
    expect(source).toContain("Temperatura");
    expect(source).toContain("Umidade");
    expect(source).toContain("Sensação");
    expect(source).toContain("Timeline horária");
    expect(source).toContain("tabular-nums");
    expect(source).toContain("line-clamp-1");
    expect(source).toContain('aria-label="Timeline horária"');
    expect(source).toContain("<HourlyTimeline hourly={overview.hourly} />");
    expect(source).toContain("getWeatherIcon");
    expect(source).not.toContain("MapLibre");
    expect(source).not.toContain("maptiler");
  });

  it("oferece navegação horizontal adaptável e acessível", () => {
    const source = readHourlyTimeline();

    expect(source).toContain('aria-label="Ver horários anteriores"');
    expect(source).toContain('aria-label="Ver próximos horários"');
    expect(source).toContain("disabled={!canScrollLeft}");
    expect(source).toContain("disabled={!canScrollRight}");
    expect(source).toContain("container.clientWidth * 0.85");
    expect(source).toContain('behavior: "smooth"');
    expect(source).toContain("overflow-x-auto");
    expect(source).toContain("hourly.map");
    expect(source).toContain('role="list"');
    expect(source).not.toContain("transform: scale");
  });
});

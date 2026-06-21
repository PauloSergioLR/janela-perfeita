import { describe, expect, it } from "vitest";
import {
  Bike,
  CalendarRange,
  CalendarSearch,
  Camera,
  CircleAlert,
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Footprints,
  Gauge,
  ListChecks,
  Search,
  ShieldCheck,
  Sun,
  Wind,
} from "lucide-react";
import {
  getActivityIcon,
  getForecastConfidenceIcon,
  getSearchModeIcon,
  getWeatherIcon,
  getWeatherMetricIcon,
} from "@/lib/ui/icon-system";

describe("sistema de ícones", () => {
  it("mapeia atividades e modos para Lucide consistente", () => {
    expect(getActivityIcon("correr")).toBe(Footprints);
    expect(getActivityIcon("pedalar")).toBe(Bike);
    expect(getActivityIcon("fotografar_por_do_sol")).toBe(Camera);
    expect(getSearchModeIcon("janela")).toBe(Search);
    expect(getSearchModeIcon("atividades")).toBe(ListChecks);
    expect(getSearchModeIcon("clima_semana")).toBe(CalendarSearch);
    expect(getSearchModeIcon("semana")).toBe(CalendarRange);
  });

  it("mapeia códigos, métricas e confiança", () => {
    expect(getWeatherIcon(0)).toBe(Sun);
    expect(getWeatherIcon(null)).toBe(Cloud);
    expect(getWeatherIcon(61)).toBe(CloudRain);
    expect(getWeatherIcon(95)).toBe(CloudLightning);
    expect(getWeatherIcon(71)).toBe(CloudSnow);
    expect(getWeatherIcon(45)).toBe(CloudFog);
    expect(getWeatherIcon(3)).toBe(CloudSun);
    expect(getWeatherMetricIcon("apparent-temperature")).toBe(Gauge);
    expect(getWeatherMetricIcon("gusts")).toBe(Wind);
    expect(getForecastConfidenceIcon("alta")).toBe(ShieldCheck);
    expect(getForecastConfidenceIcon("media")).toBe(CircleAlert);
  });
});

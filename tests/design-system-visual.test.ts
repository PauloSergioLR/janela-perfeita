import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readGlobalsCss() {
  return readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
}

describe("design system visual", () => {
  const globalsCss = readGlobalsCss();

  it("expoe tokens climaticos no tema do Tailwind", () => {
    const themeTokens = [
      "--color-weather-background",
      "--color-weather-card",
      "--color-weather-border",
      "--color-weather-accent",
      "--color-weather-success",
      "--color-weather-warning",
      "--color-weather-danger",
      "--color-weather-muted",
      "--shadow-weather-card",
      "--shadow-weather-glow",
    ];

    for (const token of themeTokens) {
      expect(globalsCss).toContain(token);
    }
  });

  it("define tokens semanticos de estado sem quebrar shadcn/ui", () => {
    const semanticTokens = [
      "--success:",
      "--success-foreground:",
      "--warning:",
      "--warning-foreground:",
      "--danger:",
      "--danger-foreground:",
      "--background:",
      "--foreground:",
      "--card:",
      "--border:",
      "--ring:",
    ];

    for (const token of semanticTokens) {
      expect(globalsCss).toContain(token);
    }
  });

  it("disponibiliza utilitarios de glass, glow, borda e fundos climaticos", () => {
    const utilityClasses = [
      ".bg-weather-stage",
      ".bg-weather-dawn",
      ".bg-weather-sunset",
      ".bg-weather-night",
      ".glass-card",
      ".glass-panel",
      ".border-soft",
      ".border-glass",
      ".glow-primary",
      ".glow-success",
      ".glow-warning",
      ".glow-danger",
      ".state-success",
      ".state-warning",
      ".state-danger",
      ".state-muted",
    ];

    for (const className of utilityClasses) {
      expect(globalsCss).toContain(className);
    }
  });

  it("mantem fallback para vidro sem depender de biblioteca nova", () => {
    expect(globalsCss).toContain("@supports (backdrop-filter: blur(1px))");
    expect(globalsCss).not.toContain("framer-motion");
    expect(globalsCss).not.toContain("maplibre");
  });
});

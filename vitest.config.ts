import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/app/**",
        "src/components/ui/**",
        "src/lib/utils.ts",
        "src/**/*.d.ts",
        "src/**/.gitkeep",
      ],
      reportsDirectory: "coverage",
    },
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});

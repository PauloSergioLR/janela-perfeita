import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

type PackageJson = {
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
};

function readPackageJson(): PackageJson {
  return JSON.parse(
    readFileSync(join(process.cwd(), "package.json"), "utf8"),
  ) as PackageJson;
}

describe("configuração inicial do projeto", () => {
  const packageJson = readPackageJson();

  it("mantém os scripts obrigatórios do CI", () => {
    expect(packageJson.scripts).toMatchObject({
      lint: "eslint",
      test: "vitest run",
      build: "next build --turbopack",
    });
  });

  it("mantém as dependências base do roteiro", () => {
    expect(packageJson.dependencies).toHaveProperty("@tanstack/react-query");
    expect(packageJson.dependencies).toHaveProperty("zod");
    expect(packageJson.dependencies).toHaveProperty("date-fns");
    expect(packageJson.dependencies).toHaveProperty("recharts");
    expect(packageJson.devDependencies).toHaveProperty("vitest");
  });
});

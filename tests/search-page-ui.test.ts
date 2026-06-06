import { describe, expect, it } from "vitest";
import {
  buildSearchDateOptions,
  canSubmitSearch,
  formatCityLabel,
  SEARCH_DEBOUNCE_MS,
} from "@/lib/ui/search-page";
import type { City } from "@/types";

const city: City = {
  name: "Criciuma",
  country: "Brasil",
  admin1: "Santa Catarina",
  coordinates: {
    lat: -28.6775,
    lon: -49.3697,
  },
};

describe("helpers da interface de busca", () => {
  it("mantem debounce de 300ms para busca de cidade", () => {
    expect(SEARCH_DEBOUNCE_MS).toBe(300);
  });

  it("limita datas de hoje ate hoje mais 6 dias", () => {
    const dates = buildSearchDateOptions(new Date("2030-06-05T12:00:00"));

    expect(dates).toHaveLength(7);
    expect(dates[0]).toMatchObject({
      value: "2030-06-05",
      label: "Hoje",
    });
    expect(dates[6].value).toBe("2030-06-11");
  });

  it("formata cidade sem dados vazios", () => {
    expect(formatCityLabel(city)).toBe("Criciuma, Santa Catarina, Brasil");
    expect(formatCityLabel({ ...city, admin1: undefined })).toBe(
      "Criciuma, Brasil",
    );
  });

  it("desabilita envio sem cidade, atividade ou data", () => {
    expect(
      canSubmitSearch({
        city: null,
        activityId: "correr",
        date: "2030-06-05",
      }),
    ).toBe(false);
    expect(
      canSubmitSearch({
        city,
        activityId: "",
        date: "2030-06-05",
      }),
    ).toBe(false);
    expect(
      canSubmitSearch({
        city,
        activityId: "correr",
        date: "",
      }),
    ).toBe(false);
    expect(
      canSubmitSearch({
        city,
        activityId: "correr",
        date: "2030-06-05",
      }),
    ).toBe(true);
  });
});


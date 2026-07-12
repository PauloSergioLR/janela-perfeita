import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildNominatimReverseUrl,
  getCityByCoordinates,
} from "@/lib/services/nominatim-reverse-geocoding.service";

function createJsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("reverse geocoding Nominatim", () => {
  it("monta URL de reverse geocoding por coordenadas", () => {
    const url = buildNominatimReverseUrl({
      lat: -28.6775,
      lon: -49.3697,
    });

    expect(url.origin).toBe("https://nominatim.openstreetmap.org");
    expect(url.pathname).toBe("/reverse");
    expect(url.searchParams.get("format")).toBe("jsonv2");
    expect(url.searchParams.get("lat")).toBe("-28.6775");
    expect(url.searchParams.get("lon")).toBe("-49.3697");
    expect(url.searchParams.get("zoom")).toBe("10");
    expect(url.searchParams.get("addressdetails")).toBe("1");
  });

  it("mapeia resposta de coordenadas para cidade do dominio", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      createJsonResponse({
        address: {
          city: "Criciúma",
          state: "Santa Catarina",
          country: "Brasil",
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const city = await getCityByCoordinates({
      lat: -28.6775,
      lon: -49.3697,
      timezone: "America/Sao_Paulo",
    });

    expect(fetchMock).toHaveBeenCalledWith(expect.any(URL), {
      headers: expect.objectContaining({
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
        "User-Agent": expect.stringContaining("JanelaPerfeita"),
      }),
    });
    expect(city).toEqual({
      name: "Criciúma",
      country: "Brasil",
      admin1: "Santa Catarina",
      timezone: "America/Sao_Paulo",
      coordinates: {
        lat: -28.6775,
        lon: -49.3697,
      },
    });
  });

  it("usa cidade alternativa quando address nao traz city", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(
        createJsonResponse({
          address: {
            town: "Içara",
            state: "Santa Catarina",
            country: "Brasil",
          },
        }),
      ),
    );

    await expect(
      getCityByCoordinates({
        lat: -28.713,
        lon: -49.308,
      }),
    ).resolves.toMatchObject({
      name: "Içara",
      country: "Brasil",
    });
  });

  it("retorna erro quando Nominatim falha ou nao traz cidade", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(createJsonResponse({}, 500)),
    );

    await expect(
      getCityByCoordinates({
        lat: -28.6775,
        lon: -49.3697,
      }),
    ).rejects.toThrow("Nominatim retornou erro");

    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(createJsonResponse({ address: {} })),
    );

    await expect(
      getCityByCoordinates({
        lat: -28.6775,
        lon: -49.3697,
      }),
    ).rejects.toThrow("Reverse geocoding não encontrou cidade");
  });

  it("GET /api/reverse-geocoding valida e retorna cidade", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(
        createJsonResponse({
          address: {
            city: "Criciúma",
            state: "Santa Catarina",
            country: "Brasil",
          },
        }),
      ),
    );

    const { GET } = await import("@/app/api/reverse-geocoding/route");
    const response = await GET(
      new Request(
        "http://localhost/api/reverse-geocoding?lat=-28.6775&lon=-49.3697&timezone=America/Sao_Paulo",
      ),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.city).toMatchObject({
      name: "Criciúma",
      admin1: "Santa Catarina",
      country: "Brasil",
    });
  });

  it("GET /api/reverse-geocoding trata query invalida e erro externo", async () => {
    const { GET } = await import("@/app/api/reverse-geocoding/route");
    const invalidResponse = await GET(
      new Request("http://localhost/api/reverse-geocoding?lat=x&lon=-49.3697"),
    );

    expect(invalidResponse.status).toBe(400);

    vi.stubGlobal(
      "fetch",
      vi.fn<typeof fetch>().mockResolvedValue(createJsonResponse({}, 500)),
    );

    const externalErrorResponse = await GET(
      new Request(
        "http://localhost/api/reverse-geocoding?lat=-28.6775&lon=-49.3697",
      ),
    );

    expect(externalErrorResponse.status).toBe(502);
  });
});

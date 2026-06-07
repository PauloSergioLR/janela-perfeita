const forecastHours = Array.from(
  { length: 24 },
  (_, hour) => `2026-06-05T${String(hour).padStart(2, "0")}:00`,
);

export const openMeteoForecastFixture = {
  hourly: {
    time: forecastHours,
    temperature_2m: forecastHours.map(() => 20),
    precipitation: forecastHours.map(() => 0),
    wind_speed_10m: forecastHours.map(() => 10),
    cloud_cover: forecastHours.map(() => 40),
    uv_index: forecastHours.map(() => 2),
    relative_humidity_2m: forecastHours.map(() => 60),
  },
  daily: {
    time: ["2026-06-05"],
    sunrise: ["2026-06-05T06:30"],
    sunset: ["2026-06-05T17:58"],
  },
};

export const invalidOpenMeteoForecastFixture = {
  hourly: {
    time: ["2026-06-05T00:00"],
  },
  daily: {
    time: ["2026-06-05"],
    sunrise: ["2026-06-05T06:30"],
    sunset: ["2026-06-05T17:58"],
  },
};

export const openMeteoGeocodingFixture = {
  results: [
    {
      id: 3460428,
      name: "Criciuma",
      latitude: -28.6775,
      longitude: -49.3697,
      country: "Brasil",
      admin1: "Santa Catarina",
      timezone: "America/Sao_Paulo",
    },
  ],
};

export const invalidOpenMeteoGeocodingFixture = {
  results: [
    {
      name: "Cidade sem coordenadas",
      country: "Brasil",
    },
  ],
};

export const openMeteoErrorFixture = {
  error: true,
  reason: "Parametro invalido.",
};

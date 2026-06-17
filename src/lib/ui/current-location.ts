import type { City, Coordinates } from "@/types";

export const CURRENT_LOCATION_CITY_NAME = "Localização atual";
export const CURRENT_LOCATION_CITY_COUNTRY = "Coordenadas do navegador";
export const CURRENT_LOCATION_PRIVACY_NOTE =
  "Usamos sua latitude e longitude só nesta consulta; elas não entram no histórico local.";
export const CURRENT_LOCATION_SUCCESS_MESSAGE =
  "Localização atual selecionada. Você ainda pode digitar outra cidade.";
export const GEOLOCATION_UNSUPPORTED_MESSAGE =
  "Seu navegador não oferece geolocalização. Busque a cidade manualmente.";

const GEOLOCATION_PERMISSION_DENIED = 1;
const GEOLOCATION_POSITION_UNAVAILABLE = 2;
const GEOLOCATION_TIMEOUT = 3;

export interface BrowserNavigatorWithGeolocation {
  geolocation?: Pick<Geolocation, "getCurrentPosition">;
}

export function buildCurrentLocationCity(
  coordinates: Coordinates,
  timezone?: string,
): City {
  return {
    name: CURRENT_LOCATION_CITY_NAME,
    country: CURRENT_LOCATION_CITY_COUNTRY,
    timezone,
    coordinates,
  };
}

export function isCurrentLocationCity(city: City): boolean {
  return (
    city.name === CURRENT_LOCATION_CITY_NAME &&
    city.country === CURRENT_LOCATION_CITY_COUNTRY
  );
}

export function canUseBrowserGeolocation(
  navigatorLike: BrowserNavigatorWithGeolocation | null | undefined,
): boolean {
  return typeof navigatorLike?.geolocation?.getCurrentPosition === "function";
}

export function getGeolocationErrorMessage(code: number): string {
  switch (code) {
    case GEOLOCATION_PERMISSION_DENIED:
      return "Permissão negada. Você ainda pode buscar a cidade manualmente.";
    case GEOLOCATION_POSITION_UNAVAILABLE:
      return "Não foi possível detectar sua localização. Busque a cidade manualmente.";
    case GEOLOCATION_TIMEOUT:
      return "A detecção demorou demais. Busque a cidade manualmente ou tente de novo.";
    default:
      return "Não foi possível usar sua localização. Busque a cidade manualmente.";
  }
}

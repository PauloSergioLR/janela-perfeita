/** Identificador das atividades suportadas no MVP. */
export type ActivityId =
  | "correr"
  | "caminhar"
  | "pedalar"
  | "fotografar_por_do_sol"
  | "observar_estrelas"
  | "lavar_carro";

/** Coordenadas geográficas usadas para consultar previsão meteorológica. */
export interface Coordinates {
  lat: number;
  lon: number;
}

/** Cidade selecionada pelo usuário a partir do geocoding. */
export interface City {
  id?: number;
  name: string;
  country: string;
  admin1?: string;
  timezone?: string;
  coordinates: Coordinates;
}

/** Dados meteorológicos de uma hora retornados pela previsão. */
export interface HourlyWeather {
  time: string;
  temperature_2m: number;
  precipitation: number;
  wind_speed_10m: number;
  cloud_cover: number;
  uv_index: number;
  relative_humidity_2m: number;
}

/** Dados diários de nascer e pôr do sol para calcular contexto local. */
export interface DailyAstronomy {
  date: string;
  sunrise: string;
  sunset: string;
}

/** Contexto calculado para avaliar uma hora dentro da data selecionada. */
export interface WeatherContext {
  localHour: number;
  isToday: boolean;
  isPastHour: boolean;
  isNight: boolean;
  isGoldenHour: boolean;
  minutesFromSunset: number;
  sunrise: string;
  sunset: string;
}

/** Resultado individual de uma regra ponderada de atividade. */
export interface RuleResult {
  factor: string;
  label: string;
  score: number;
  weight: number;
  reason: string;
}

/** Regra pura usada para pontuar um fator de uma atividade. */
export interface ActivityRule {
  factor: string;
  label: string;
  weight: number;
  evaluate: (weather: HourlyWeather, ctx: WeatherContext) => RuleResult;
}

/** Atividade disponível para recomendação. */
export interface Activity {
  id: ActivityId;
  name: string;
  shortDescription: string;
  minRecommendedScore: number;
  minDurationHours: number;
  rules: ActivityRule[];
}

/** Score consolidado de uma hora, com detalhamento dos fatores avaliados. */
export interface HourScore {
  time: string;
  hourLabel: string;
  score: number;
  breakdown: RuleResult[];
}

/** Janela recomendada composta por horas consecutivas com score suficiente. */
export interface WindowResult {
  startTime: string;
  endTime: string;
  startLabel: string;
  endLabel: string;
  durationHours: number;
  avgScore: number;
  peakScore: number;
  highlights: string[];
  scores: HourScore[];
}

/** Resposta final entregue pela engine e exibida pela interface. */
export interface Recommendation {
  activity: Activity;
  city: City;
  date: string;
  generatedAt: string;
  scores: HourScore[];
  windows: WindowResult[];
  bestWindow: WindowResult | null;
  disclaimer: string;
}

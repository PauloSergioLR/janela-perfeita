/** Identificador das atividades suportadas no MVP. */
export type ActivityId =
  | "correr"
  | "caminhar"
  | "pedalar"
  | "fotografar_por_do_sol"
  | "observar_estrelas"
  | "lavar_carro";

export type SearchMode = "janela" | "atividades" | "semana";

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
  apparent_temperature: number;
  precipitation: number;
  precipitation_probability: number;
  rain: number;
  showers: number;
  weather_code: number;
  wind_speed_10m: number;
  wind_gusts_10m: number;
  cloud_cover: number;
  cloud_cover_low: number;
  cloud_cover_mid: number;
  cloud_cover_high: number;
  visibility: number;
  sunshine_duration: number;
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

export type ForecastConfidenceLevel = "alta" | "media" | "baixa";

/** Estimativa de estabilidade da previsão dentro de uma janela recomendada. */
export interface ForecastConfidence {
  level: ForecastConfidenceLevel;
  score: number;
  reason: string;
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
  weather: HourlyWeather;
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
  confidence: ForecastConfidence;
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

/** Item ranqueado quando o app recomenda atividades para uma cidade e data. */
export interface ActivityRankingItem {
  position: number;
  recommendation: Recommendation;
  score: number;
  isRecommended: boolean;
}

/** Ranking de atividades calculado para a mesma cidade e data. */
export interface ActivityRanking {
  city: City;
  date: string;
  generatedAt: string;
  items: ActivityRankingItem[];
  bestActivity: ActivityRankingItem | null;
  disclaimer: string;
}

/** Item ranqueado quando o app compara dias para uma atividade. */
export interface DayRankingItem {
  position: number;
  recommendation: Recommendation;
  score: number;
  isRecommended: boolean;
}

/** Comparação dos próximos dias para uma atividade. */
export interface WeekComparison {
  activity: Activity;
  city: City;
  startDate: string;
  endDate: string;
  generatedAt: string;
  days: DayRankingItem[];
  bestDay: DayRankingItem | null;
  disclaimer: string;
}

/** Busca salva localmente no navegador para repetição rápida. */
export interface SearchHistoryEntry {
  id: string;
  mode: SearchMode;
  city: City;
  activityId?: ActivityId;
  activityName?: string;
  date: string;
  createdAt: string;
}

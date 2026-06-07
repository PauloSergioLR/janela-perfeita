import type { Activity, ActivityId } from "@/types";
import {
  createClearSkyRule,
  createCloudCoverRangeRule,
  createGoldenHourRule,
  createHumidityRule,
  createMinimumTemperatureRule,
  createNightRule,
  createPrecipitationRule,
  createTemperatureRule,
  createUvRule,
  createWindRule,
} from "./activity-rules";

export const ACTIVITIES = [
  {
    id: "correr",
    name: "Correr",
    shortDescription:
      "Busca horários com temperatura confortável, pouca chuva, vento baixo e UV moderado.",
    minRecommendedScore: 60,
    minDurationHours: 1,
    rules: [
      createTemperatureRule(40, 16, 22),
      createPrecipitationRule(30),
      createWindRule(20, 15),
      createUvRule(10, 3),
    ],
  },
  {
    id: "caminhar",
    name: "Caminhar",
    shortDescription:
      "Prioriza conforto térmico, baixa chance de chuva e vento tranquilo.",
    minRecommendedScore: 60,
    minDurationHours: 1,
    rules: [
      createTemperatureRule(40, 15, 25),
      createPrecipitationRule(35),
      createWindRule(25, 25),
    ],
  },
  {
    id: "pedalar",
    name: "Pedalar",
    shortDescription:
      "Evita chuva e vento forte, com atenção a temperatura e índice UV.",
    minRecommendedScore: 65,
    minDurationHours: 1,
    rules: [
      createPrecipitationRule(35),
      createTemperatureRule(30, 15, 25),
      createWindRule(25, 20),
      createUvRule(10, 5),
    ],
  },
  {
    id: "fotografar_por_do_sol",
    name: "Fotografar pôr do sol",
    shortDescription:
      "Valoriza a hora dourada, nuvens interessantes, pouca chuva e umidade menor.",
    minRecommendedScore: 60,
    minDurationHours: 1,
    rules: [
      createGoldenHourRule(40),
      createCloudCoverRangeRule(30, 20, 60),
      createPrecipitationRule(20),
      createHumidityRule(10),
    ],
  },
  {
    id: "observar_estrelas",
    name: "Observar estrelas",
    shortDescription:
      "Procura noite, céu limpo, ausência de chuva e temperatura mínima confortável.",
    minRecommendedScore: 70,
    minDurationHours: 2,
    rules: [
      createClearSkyRule(50),
      createNightRule(20),
      createPrecipitationRule(20),
      createMinimumTemperatureRule(10, 12),
    ],
  },
  {
    id: "lavar_carro",
    name: "Lavar carro",
    shortDescription:
      "Prefere janelas secas, com umidade menor, temperatura amena e pouco vento.",
    minRecommendedScore: 65,
    minDurationHours: 2,
    rules: [
      createPrecipitationRule(50),
      createHumidityRule(20),
      createTemperatureRule(20, 18, 28),
      createWindRule(10, 15),
    ],
  },
] satisfies Activity[];

export function getAllActivities(): Activity[] {
  return [...ACTIVITIES];
}

export function getActivityById(id: ActivityId): Activity | undefined {
  return ACTIVITIES.find((activity) => activity.id === id);
}

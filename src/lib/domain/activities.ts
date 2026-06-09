import type { Activity, ActivityId } from "@/types";
import {
  createGoldenHourRule,
  createHumidityRule,
  createNightRule,
  createPrecipitationRule,
  createStargazingQualityRule,
  createSunsetCloudRule,
  createSunshineRule,
  createTemperatureRule,
  createUvRule,
  createVisibilityRule,
  createWindGustRule,
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
      createTemperatureRule(40, 16, 22, { useApparentTemperature: true }),
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
      createTemperatureRule(40, 15, 25, { useApparentTemperature: true }),
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
      createTemperatureRule(25, 15, 25),
      createWindRule(15, 20),
      createWindGustRule(15, 30),
      createUvRule(10, 5),
    ],
  },
  {
    id: "fotografar_por_do_sol",
    name: "Fotografar pôr do sol",
    shortDescription:
      "Valoriza a hora dourada, nuvens interessantes, pouca chuva e boa visibilidade.",
    minRecommendedScore: 60,
    minDurationHours: 1,
    rules: [
      createGoldenHourRule(35),
      createSunsetCloudRule(25),
      createVisibilityRule(20),
      createPrecipitationRule(15),
      createSunshineRule(5),
    ],
  },
  {
    id: "observar_estrelas",
    name: "Observar estrelas",
    shortDescription:
      "Procura noite, boa visibilidade, poucas nuvens baixas e baixa umidade.",
    minRecommendedScore: 70,
    minDurationHours: 2,
    rules: [
      createNightRule(45),
      createStargazingQualityRule(45),
      createPrecipitationRule(10),
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

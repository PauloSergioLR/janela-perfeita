import { z } from "zod";
import type { ActivityId, City, SearchHistoryEntry, SearchMode } from "@/types";
import { formatCityLabel } from "./search-page";

export const SEARCH_HISTORY_STORAGE_KEY = "janela-perfeita:search-history";
export const SEARCH_HISTORY_LIMIT = 5;

const ACTIVITY_IDS = [
  "correr",
  "caminhar",
  "pedalar",
  "fotografar_por_do_sol",
  "observar_estrelas",
  "lavar_carro",
] as const satisfies readonly ActivityId[];

const SEARCH_MODES = ["janela", "atividades", "semana"] as const satisfies readonly SearchMode[];

const citySchema = z.object({
  id: z.number().int().optional(),
  name: z.string().trim().min(1),
  country: z.string().trim().min(1),
  admin1: z.string().trim().min(1).optional(),
  timezone: z.string().trim().min(1).optional(),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
  }),
});

const searchHistoryEntrySchema = z.object({
  id: z.string().trim().min(1),
  mode: z.enum(SEARCH_MODES),
  city: citySchema,
  activityId: z.enum(ACTIVITY_IDS).optional(),
  activityName: z.string().trim().min(1).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  createdAt: z.string().trim().min(1),
});

const searchHistorySchema = z.array(searchHistoryEntrySchema);

type SearchHistoryStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

interface BuildSearchHistoryEntryInput {
  mode: SearchMode;
  city: City;
  activityId?: ActivityId;
  activityName?: string;
  date: string;
  createdAt: string;
}

function buildSearchId(input: Omit<BuildSearchHistoryEntryInput, "createdAt">) {
  return [
    input.mode,
    input.date,
    input.city.coordinates.lat,
    input.city.coordinates.lon,
    input.activityId ?? "todas",
  ].join("|");
}

export function buildSearchHistoryEntry(
  input: BuildSearchHistoryEntryInput,
): SearchHistoryEntry {
  return {
    id: buildSearchId(input),
    mode: input.mode,
    city: input.city,
    activityId: input.activityId,
    activityName: input.activityName,
    date: input.date,
    createdAt: input.createdAt,
  };
}

export function readSearchHistory(
  storage: SearchHistoryStorage,
): SearchHistoryEntry[] {
  let rawValue: string | null;

  try {
    rawValue = storage.getItem(SEARCH_HISTORY_STORAGE_KEY);
  } catch {
    return [];
  }

  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue: unknown = JSON.parse(rawValue);
    const parsedHistory = searchHistorySchema.safeParse(parsedValue);

    return parsedHistory.success ? parsedHistory.data : [];
  } catch {
    return [];
  }
}

export function upsertSearchHistoryEntry(
  currentHistory: SearchHistoryEntry[],
  entry: SearchHistoryEntry,
): SearchHistoryEntry[] {
  return [
    entry,
    ...currentHistory.filter((current) => current.id !== entry.id),
  ].slice(0, SEARCH_HISTORY_LIMIT);
}

export function saveSearchHistoryEntry(
  storage: SearchHistoryStorage,
  entry: SearchHistoryEntry,
): SearchHistoryEntry[] {
  const nextHistory = upsertSearchHistoryEntry(readSearchHistory(storage), entry);

  try {
    storage.setItem(SEARCH_HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
  } catch {
    return nextHistory;
  }

  return nextHistory;
}

export function clearSearchHistory(storage: SearchHistoryStorage) {
  try {
    storage.removeItem(SEARCH_HISTORY_STORAGE_KEY);
  } catch {
    return;
  }
}

export function getSearchHistoryLabel(entry: SearchHistoryEntry): string {
  if (entry.mode === "atividades") {
    return `Ranking de atividades em ${formatCityLabel(entry.city)}`;
  }

  return `${entry.activityName ?? "Atividade"} em ${formatCityLabel(entry.city)}`;
}

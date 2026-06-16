import { describe, expect, it } from "vitest";
import {
  buildSearchHistoryEntry,
  clearSearchHistory,
  getSearchHistoryLabel,
  modeUsesActivity,
  normalizeSearchHistoryDraft,
  readSearchHistory,
  saveSearchHistoryEntry,
  SEARCH_HISTORY_LIMIT,
  SEARCH_HISTORY_STORAGE_KEY,
  upsertSearchHistoryEntry,
} from "@/lib/ui/search-history";
import type { SearchHistoryEntry } from "@/types";
import { criciumaCity } from "./fixtures/weather";

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear() {
    this.values.clear();
  }

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

function makeEntry(index: number): SearchHistoryEntry {
  return buildSearchHistoryEntry({
    mode: "janela",
    city: criciumaCity,
    activityId: "correr",
    activityName: "Correr",
    date: `2030-06-${String(index + 1).padStart(2, "0")}`,
    createdAt: `2030-06-01T0${index}:00:00.000Z`,
  });
}

describe("historico local de buscas", () => {
  it("cria id estavel por cidade, modo, atividade e data", () => {
    const entry = makeEntry(0);

    expect(entry.id).toContain("janela");
    expect(entry.id).toContain("correr");
    expect(entry.id).toContain("2030-06-01");
  });

  it("mantem disponibilidade no id, label e entrada salva", () => {
    const entry = buildSearchHistoryEntry({
      mode: "janela",
      city: criciumaCity,
      activityId: "correr",
      activityName: "Correr",
      date: "2030-06-05",
      availableFrom: "08:00",
      availableTo: "10:00",
      createdAt: "2030-06-01T10:00:00.000Z",
    });

    expect(entry.id).toContain("08:00");
    expect(entry.availableFrom).toBe("08:00");
    expect(entry.availableTo).toBe("10:00");
    expect(getSearchHistoryLabel(entry)).toContain("(08:00-10:00)");
  });

  it("salva, le e limpa historico no storage informado", () => {
    const storage = new MemoryStorage();
    const entry = makeEntry(0);

    expect(saveSearchHistoryEntry(storage, entry)).toEqual([entry]);
    expect(readSearchHistory(storage)).toEqual([entry]);

    clearSearchHistory(storage);

    expect(readSearchHistory(storage)).toEqual([]);
  });

  it("deduplica busca repetida e limita as ultimas cinco", () => {
    const entries = Array.from(
      { length: SEARCH_HISTORY_LIMIT + 1 },
      (_, index) => makeEntry(index),
    );
    const repeated = {
      ...entries[1],
      createdAt: "2030-06-01T10:00:00.000Z",
    };

    const history = upsertSearchHistoryEntry(entries, repeated);

    expect(history).toHaveLength(SEARCH_HISTORY_LIMIT);
    expect(history[0]).toEqual(repeated);
    expect(history.filter((entry) => entry.id === repeated.id)).toHaveLength(1);
  });

  it("ignora JSON invalido ou fora do schema", () => {
    const storage = new MemoryStorage();

    storage.setItem(SEARCH_HISTORY_STORAGE_KEY, "{");
    expect(readSearchHistory(storage)).toEqual([]);

    storage.setItem(SEARCH_HISTORY_STORAGE_KEY, JSON.stringify([{ id: "" }]));
    expect(readSearchHistory(storage)).toEqual([]);
  });

  it("formata busca sem atividade para modo inverso", () => {
    const entry = buildSearchHistoryEntry({
      mode: "atividades",
      city: criciumaCity,
      date: "2030-06-05",
      createdAt: "2030-06-01T10:00:00.000Z",
    });

    expect(getSearchHistoryLabel(entry)).toContain("Ranking de atividades");
  });

  it("formata consulta do dia sem atividade e disponibilidade", () => {
    const entry = buildSearchHistoryEntry({
      mode: "dia",
      city: criciumaCity,
      activityId: "correr",
      activityName: "Correr",
      date: "2030-06-05",
      availableFrom: "08:00",
      availableTo: "10:00",
      createdAt: "2030-06-01T10:00:00.000Z",
    });

    expect(entry.activityId).toBeUndefined();
    expect(entry.availableFrom).toBeUndefined();
    expect(getSearchHistoryLabel(entry)).toContain("Clima do dia");
    expect(modeUsesActivity("dia")).toBe(false);
  });

  it("formata consulta da semana sem atividade e disponibilidade", () => {
    const entry = buildSearchHistoryEntry({
      mode: "clima_semana",
      city: criciumaCity,
      activityId: "correr",
      activityName: "Correr",
      date: "2030-06-05",
      availableFrom: "08:00",
      availableTo: "10:00",
      createdAt: "2030-06-01T10:00:00.000Z",
    });

    expect(entry.activityId).toBeUndefined();
    expect(entry.availableFrom).toBeUndefined();
    expect(getSearchHistoryLabel(entry)).toContain("Clima da semana");
    expect(modeUsesActivity("clima_semana")).toBe(false);
  });

  it("remove atividade escondida do modo o que fazer", () => {
    const draft = normalizeSearchHistoryDraft({
      mode: "atividades",
      city: criciumaCity,
      activityId: "observar_estrelas",
      activityName: "Observar estrelas",
      date: "2030-06-05",
    });

    expect(draft.activityId).toBeUndefined();
    expect(draft.activityName).toBeUndefined();
    expect(draft.availableFrom).toBeUndefined();
    expect(draft.availableTo).toBeUndefined();
    expect(modeUsesActivity("semana")).toBe(true);
    expect(modeUsesActivity("atividades")).toBe(false);
  });
});

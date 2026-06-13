"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Bike,
  CalendarDays,
  CalendarSearch,
  Camera,
  Car,
  Clock3,
  Footprints,
  History,
  ListChecks,
  Loader2,
  MapPin,
  Moon,
  RefreshCw,
  RotateCcw,
  Route,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ActivityRankingCard } from "@/components/result/activity-ranking-card";
import { AttributionFooter } from "@/components/result/attribution-footer";
import { RecommendationCard } from "@/components/result/recommendation-card";
import { ScoreBreakdown } from "@/components/result/score-breakdown";
import { ScoreTimeline } from "@/components/result/score-timeline";
import { WeekComparisonCard } from "@/components/result/week-comparison-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAllActivities } from "@/lib/domain/activities";
import {
  buildSearchDateOptions,
  canSubmitSearch,
  formatCityLabel,
  SEARCH_DEBOUNCE_MS,
  type SearchDateOption,
} from "@/lib/ui/search-page";
import {
  buildSearchHistoryEntry,
  clearSearchHistory,
  getSearchHistoryLabel,
  modeUsesActivity,
  normalizeSearchHistoryDraft,
  readSearchHistory,
  saveSearchHistoryEntry,
  type SearchHistoryDraft,
} from "@/lib/ui/search-history";
import { cn } from "@/lib/utils";
import type {
  ActivityId,
  ActivityRanking,
  City,
  Recommendation,
  SearchHistoryEntry,
  SearchMode,
  WeekComparison,
} from "@/types";

type GeocodingResponse = {
  cities: City[];
};

type RecommendationResponse = {
  recommendation?: Recommendation;
  activityRanking?: ActivityRanking;
  weekComparison?: WeekComparison;
};

type ActivityVisual = {
  icon: typeof Footprints;
  tone: string;
};

type SearchModeOption = {
  id: SearchMode;
  label: string;
  description: string;
  icon: typeof Search;
};

const ACTIVITY_VISUALS = {
  correr: {
    icon: Footprints,
    tone: "text-emerald-700",
  },
  caminhar: {
    icon: Route,
    tone: "text-sky-700",
  },
  pedalar: {
    icon: Bike,
    tone: "text-cyan-700",
  },
  fotografar_por_do_sol: {
    icon: Camera,
    tone: "text-amber-700",
  },
  observar_estrelas: {
    icon: Moon,
    tone: "text-indigo-700",
  },
  lavar_carro: {
    icon: Car,
    tone: "text-rose-700",
  },
} satisfies Record<ActivityId, ActivityVisual>;

const SEARCH_MODE_OPTIONS = [
  {
    id: "janela",
    label: "Janela",
    description: "Atividade e data",
    icon: Search,
  },
  {
    id: "atividades",
    label: "O que fazer",
    description: "Ranking do dia",
    icon: ListChecks,
  },
  {
    id: "semana",
    label: "Semana",
    description: "Melhor dia",
    icon: CalendarSearch,
  },
] satisfies SearchModeOption[];

function useDebouncedValue(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delay);

    return () => window.clearTimeout(timeoutId);
  }, [delay, value]);

  return debouncedValue;
}

async function readApiResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "object" &&
      payload.error !== null &&
      "message" in payload.error &&
      typeof payload.error.message === "string"
        ? payload.error.message
        : "Não foi possível concluir a requisição.";

    throw new Error(message);
  }

  return payload as T;
}

async function fetchCities(query: string, demoMode: boolean): Promise<City[]> {
  const params = new URLSearchParams({
    q: query,
  });

  if (demoMode) {
    params.set("demo", "true");
  }

  const response = await fetch(`/api/geocoding?${params.toString()}`);
  const payload = await readApiResponse<GeocodingResponse>(response);

  return payload.cities;
}

async function requestRecommendation(input: {
  city: City;
  mode: SearchMode;
  activityId?: ActivityId;
  date: string;
  compareModels?: boolean;
  demo?: boolean;
}): Promise<RecommendationResponse> {
  const response = await fetch("/api/recommendation", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return readApiResponse<RecommendationResponse>(response);
}

export default function Home() {
  const activities = useMemo(() => getAllActivities(), []);
  const [dateOptions, setDateOptions] = useState<SearchDateOption[]>([]);
  const [cityQuery, setCityQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<ActivityId | "">(
    "",
  );
  const [selectedDate, setSelectedDate] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("janela");
  const [compareModels, setCompareModels] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryEntry[]>([]);
  const debouncedCityQuery = useDebouncedValue(
    cityQuery.trim(),
    SEARCH_DEBOUNCE_MS,
  );
  const canSearch =
    searchMode === "atividades"
      ? selectedCity !== null && selectedDate !== ""
      : canSubmitSearch({
          city: selectedCity,
          activityId: selectedActivityId,
          date: selectedDate,
        });
  const minDate = dateOptions[0]?.value ?? "";
  const maxDate = dateOptions[dateOptions.length - 1]?.value ?? "";
  const cityQueryEnabled =
    debouncedCityQuery.length >= 3 && selectedCity === null;
  const cityQueryResult = useQuery({
    queryKey: ["geocoding", debouncedCityQuery, demoMode],
    queryFn: () => fetchCities(debouncedCityQuery, demoMode),
    enabled: cityQueryEnabled,
  });
  const recommendationMutation = useMutation({
    mutationFn: requestRecommendation,
  });
  const selectedActivity = activities.find(
    (activity) => activity.id === selectedActivityId,
  );
  const recommendation = recommendationMutation.data?.recommendation;
  const activityRanking = recommendationMutation.data?.activityRanking;
  const weekComparison = recommendationMutation.data?.weekComparison;
  const resultDisclaimer =
    recommendation?.disclaimer ??
    activityRanking?.disclaimer ??
    weekComparison?.disclaimer;

  useEffect(() => {
    const options = buildSearchDateOptions();

    setDateOptions(options);
    setSelectedDate(options[0]?.value ?? "");
  }, []);

  useEffect(() => {
    setDemoMode(
      new URLSearchParams(window.location.search).get("demo") === "true",
    );
  }, []);

  useEffect(() => {
    setSearchHistory(readSearchHistory(window.localStorage));
  }, []);

  function resetRecommendationState() {
    if (!recommendationMutation.isIdle) {
      recommendationMutation.reset();
    }
  }

  function handleCityQueryChange(value: string) {
    setCityQuery(value);
    setSelectedCity(null);
    resetRecommendationState();
  }

  function handleCitySelect(city: City) {
    setSelectedCity(city);
    setCityQuery(formatCityLabel(city));
    resetRecommendationState();
  }

  function saveSearch(input: {
    city: City;
    mode: SearchMode;
    activityId?: ActivityId;
    activityName?: string;
    date: string;
  }) {
    const normalizedInput = normalizeSearchHistoryDraft(input);
    const entry = buildSearchHistoryEntry({
      ...normalizedInput,
      createdAt: new Date().toISOString(),
    });

    setSearchHistory(saveSearchHistoryEntry(window.localStorage, entry));
  }

  function runSearch(
    input: SearchHistoryDraft & { compareModels?: boolean; demo?: boolean },
  ) {
    const normalizedInput = normalizeSearchHistoryDraft(input);

    if (!input.demo) {
      saveSearch(normalizedInput);
    }

    recommendationMutation.mutate({
      city: normalizedInput.city,
      mode: normalizedInput.mode,
      activityId: normalizedInput.activityId,
      date: normalizedInput.date,
      compareModels: input.compareModels,
      demo: input.demo,
    });
  }

  function submitCurrentSearch() {
    if (!canSearch || selectedCity === null) {
      return;
    }

    if (modeUsesActivity(searchMode) && selectedActivityId === "") {
      return;
    }

    runSearch({
      city: selectedCity,
      mode: searchMode,
      activityId: modeUsesActivity(searchMode)
        ? selectedActivityId || undefined
        : undefined,
      activityName: modeUsesActivity(searchMode)
        ? selectedActivity?.name
        : undefined,
      date: selectedDate,
      compareModels: searchMode === "janela" ? compareModels : false,
      demo: demoMode,
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitCurrentSearch();
  }

  function handleRecommendationRetry() {
    submitCurrentSearch();
  }

  function handleHistorySelect(entry: SearchHistoryEntry) {
    const historyDateIsAvailable = dateOptions.some(
      (option) => option.value === entry.date,
    );
    const date = historyDateIsAvailable
      ? entry.date
      : dateOptions[0]?.value ?? entry.date;

    const searchInput = normalizeSearchHistoryDraft({
      city: entry.city,
      mode: entry.mode,
      activityId: entry.activityId,
      activityName: entry.activityName,
      date,
    });

    setSearchMode(searchInput.mode);
    setSelectedCity(searchInput.city);
    setCityQuery(formatCityLabel(searchInput.city));
    setSelectedDate(searchInput.date);
    setSelectedActivityId(searchInput.activityId ?? "");
    resetRecommendationState();

    if (modeUsesActivity(searchInput.mode) && !searchInput.activityId) {
      return;
    }

    runSearch({
      ...searchInput,
      compareModels: searchInput.mode === "janela" ? compareModels : false,
      demo: demoMode,
    });
  }

  function handleClearHistory() {
    clearSearchHistory(window.localStorage);
    setSearchHistory([]);
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_48%,#eef6f5_100%)] px-4 py-5 text-foreground dark:bg-[linear-gradient(180deg,#101b2b_0%,#172339_52%,#102525_100%)] sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="grid gap-4 border-b border-border pb-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="h-7 border-sky-200 bg-sky-50 px-3 text-sky-900"
              >
                Dashboard meteorológico
              </Badge>
              <Badge
                variant="outline"
                className="h-7 border-emerald-200 bg-emerald-50 px-3 text-emerald-800"
              >
                Open-Meteo
              </Badge>
              {demoMode ? (
                <Badge
                  variant="outline"
                  className="h-7 border-amber-200 bg-amber-50 px-3 text-amber-900"
                >
                  Modo demo
                </Badge>
              ) : null}
              <Link
                href="/como-funciona"
                className="inline-flex h-7 items-center rounded-md border border-border bg-white px-3 text-xs font-medium text-muted-foreground transition hover:text-foreground dark:bg-card"
              >
                Como funciona
              </Link>
            </div>
            <div className="max-w-3xl space-y-2">
              <h1 className="text-3xl font-semibold tracking-normal text-slate-950 dark:text-slate-50 sm:text-4xl lg:text-5xl">
                Janela Perfeita
              </h1>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
                Um painel de decisão para escolher quando correr, caminhar,
                pedalar, fotografar o pôr do sol, observar estrelas ou lavar o
                carro.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-lg border border-slate-200 bg-white p-2 text-center shadow-sm dark:border-border dark:bg-card">
            <div className="rounded-md bg-slate-50 px-3 py-2 dark:bg-muted/60">
              <p className="text-lg font-semibold text-slate-950 dark:text-slate-50">
                6
              </p>
              <p className="text-xs text-muted-foreground">atividades</p>
            </div>
            <div className="rounded-md bg-slate-50 px-3 py-2 dark:bg-muted/60">
              <p className="text-lg font-semibold text-slate-950 dark:text-slate-50">
                7
              </p>
              <p className="text-xs text-muted-foreground">dias</p>
            </div>
            <div className="rounded-md bg-slate-50 px-3 py-2 dark:bg-muted/60">
              <p className="text-lg font-semibold text-slate-950 dark:text-slate-50">
                0-100
              </p>
              <p className="text-xs text-muted-foreground">score</p>
            </div>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(390px,0.95fr)]">
          <div className="flex flex-col gap-4">
          <Card className="overflow-hidden rounded-lg border-border/80 bg-white shadow-sm dark:bg-card">
            <CardHeader className="border-b border-slate-100 bg-slate-50/70 dark:border-border dark:bg-muted/30">
              <CardTitle>Planejar janela</CardTitle>
              <CardDescription>
                Cidade, atividade e data definem a recomendação do dia.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                <div className="space-y-3">
                  <Label id="modo-label">Modo</Label>
                  <div
                    className="grid gap-2 sm:grid-cols-3"
                    role="radiogroup"
                    aria-labelledby="modo-label"
                  >
                    {SEARCH_MODE_OPTIONS.map((mode) => {
                      const Icon = mode.icon;
                      const selected = searchMode === mode.id;

                      return (
                        <button
                          key={mode.id}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          className={cn(
                            "min-h-20 rounded-lg border bg-background p-3 text-left transition hover:border-foreground/30 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none",
                            selected
                              ? "border-sky-600 bg-sky-50 text-sky-950 shadow-sm dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-50"
                              : "border-border",
                          )}
                          onClick={() => {
                            setSearchMode(mode.id);
                            resetRecommendationState();
                          }}
                        >
                          <span className="flex items-start gap-3">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                              <Icon className="size-4 text-sky-700" aria-hidden="true" />
                            </span>
                            <span className="min-w-0">
                              <span className="block font-medium">
                                {mode.label}
                              </span>
                              <span className="block text-xs leading-5 text-muted-foreground">
                                {mode.description}
                              </span>
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <div className="relative">
                    <div className="pointer-events-none absolute top-2 left-2.5 text-muted-foreground">
                      <MapPin className="size-4" aria-hidden="true" />
                    </div>
                    <Input
                      id="city"
                      value={cityQuery}
                      onChange={(event) =>
                        handleCityQueryChange(event.target.value)
                      }
                      placeholder="Ex.: Criciúma"
                      className="h-11 rounded-md pl-8"
                      autoComplete="off"
                      role="combobox"
                      aria-expanded={cityQueryEnabled}
                      aria-controls="city-suggestions"
                    />
                    {cityQueryEnabled ? (
                      <div
                        id="city-suggestions"
                        role="listbox"
                        className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-lg border border-border bg-popover p-1 text-sm shadow-lg"
                      >
                        {cityQueryResult.isFetching ? (
                          <div className="space-y-2 px-3 py-2 text-muted-foreground">
                            <div className="flex items-center gap-2">
                            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                            Buscando cidades...
                            </div>
                            <div className="grid gap-1">
                              <span className="h-2 rounded-full bg-muted" />
                              <span className="h-2 w-2/3 rounded-full bg-muted" />
                            </div>
                          </div>
                        ) : null}

                        {cityQueryResult.isError ? (
                          <div className="space-y-2 px-3 py-2 text-destructive">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="size-4" aria-hidden="true" />
                              {(cityQueryResult.error as Error).message}
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8"
                              onClick={() => void cityQueryResult.refetch()}
                            >
                              <RefreshCw className="size-3" aria-hidden="true" />
                              Tentar novamente
                            </Button>
                          </div>
                        ) : null}

                        {!cityQueryResult.isFetching &&
                        !cityQueryResult.isError &&
                        cityQueryResult.data?.length === 0 ? (
                          <div className="space-y-2 px-3 py-2 text-muted-foreground">
                            <p>Nenhuma cidade encontrada. Tente ajustar o nome.</p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8"
                              onClick={() => handleCityQueryChange("")}
                            >
                              Limpar busca
                            </Button>
                          </div>
                        ) : null}

                        {cityQueryResult.data?.map((city) => (
                          <button
                            key={`${city.id ?? formatCityLabel(city)}-${city.coordinates.lat}-${city.coordinates.lon}`}
                            type="button"
                            role="option"
                            aria-selected={false}
                            className="flex w-full items-start gap-2 rounded-md px-3 py-2 text-left hover:bg-muted focus:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            onClick={() => handleCitySelect(city)}
                          >
                            <MapPin className="mt-0.5 size-4 shrink-0 text-sky-700" aria-hidden="true" />
                            <span className="flex min-w-0 flex-col">
                              <span className="truncate font-medium">
                                {city.name}
                              </span>
                              <span className="truncate text-xs text-muted-foreground">
                                {[city.admin1, city.country]
                                  .filter(Boolean)
                                  .join(", ")}
                              </span>
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                {searchMode !== "atividades" ? (
                  <div className="space-y-3">
                    <Label id="atividade-label">Atividade</Label>
                    <div
                      className="grid gap-2 sm:grid-cols-2"
                      role="radiogroup"
                      aria-labelledby="atividade-label"
                    >
                      {activities.map((activity) => {
                        const visual = ACTIVITY_VISUALS[activity.id];
                        const Icon = visual.icon;
                        const selected = selectedActivityId === activity.id;

                        return (
                          <button
                            key={activity.id}
                            type="button"
                            className={cn(
                              "min-h-28 rounded-lg border bg-background p-3 text-left transition hover:-translate-y-0.5 hover:border-foreground/30 hover:shadow-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none",
                              selected
                                ? "border-emerald-600 bg-emerald-50 text-emerald-950 shadow-sm dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-50"
                                : "border-border",
                            )}
                            role="radio"
                            aria-checked={selected}
                            onClick={() => {
                              setSelectedActivityId(activity.id);
                              resetRecommendationState();
                            }}
                          >
                            <span className="flex items-start gap-3">
                              <span
                                className={cn(
                                  "flex size-10 shrink-0 items-center justify-center rounded-md bg-muted",
                                  selected
                                    ? "bg-emerald-100 dark:bg-emerald-900/50"
                                    : "",
                                )}
                              >
                                <Icon
                                  className={cn(
                                    "size-4",
                                    selected ? "text-emerald-700" : visual.tone,
                                  )}
                                  aria-hidden="true"
                                />
                              </span>
                              <span className="min-w-0 space-y-1">
                                <span className="block font-medium">
                                  {activity.name}
                                </span>
                                <span className="line-clamp-2 text-xs leading-5 text-muted-foreground">
                                  {activity.shortDescription}
                                </span>
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                  <div className="space-y-2">
                    <Label htmlFor="date">
                      {searchMode === "semana" ? "A partir de" : "Data"}
                    </Label>
                    <div className="relative">
                      <CalendarDays className="pointer-events-none absolute top-3 left-2.5 size-4 text-muted-foreground" aria-hidden="true" />
                      <Input
                        id="date"
                        type="date"
                        min={minDate}
                        max={maxDate}
                        value={selectedDate}
                        onChange={(event) => {
                          setSelectedDate(event.target.value);
                          resetRecommendationState();
                        }}
                        className="h-11 rounded-md pl-8"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {dateOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={cn(
                            "h-8 rounded-md border px-3 text-xs font-medium transition hover:border-foreground/30",
                            selectedDate === option.value
                              ? "border-sky-600 bg-sky-50 text-sky-900"
                              : "border-border bg-background text-muted-foreground",
                          )}
                          aria-pressed={selectedDate === option.value}
                          onClick={() => {
                            setSelectedDate(option.value);
                            resetRecommendationState();
                          }}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="h-11 min-w-44 rounded-md"
                    disabled={!canSearch || recommendationMutation.isPending}
                  >
                    {recommendationMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Search className="size-4" aria-hidden="true" />
                    )}
                    {recommendationMutation.isPending
                      ? "Calculando..."
                      : searchMode === "atividades"
                        ? "Ver ranking"
                        : searchMode === "semana"
                          ? "Comparar semana"
                          : "Encontrar janela"}
                  </Button>
                </div>

                {searchMode === "janela" && !demoMode ? (
                  <label className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3 text-sm">
                    <input
                      type="checkbox"
                      checked={compareModels}
                      onChange={(event) => {
                        setCompareModels(event.target.checked);
                        resetRecommendationState();
                      }}
                      className="mt-1 size-4"
                    />
                    <span className="min-w-0">
                      <span className="block font-medium">
                        Comparar modelos Open-Meteo
                      </span>
                      <span className="block text-xs leading-5 text-muted-foreground">
                        Mostra concordância quando a recomendação for calculada.
                      </span>
                    </span>
                  </label>
                ) : null}
              </form>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-lg border-border/80 bg-white shadow-sm dark:bg-card">
            <CardHeader className="border-b border-slate-100 bg-slate-50/70 dark:border-border dark:bg-muted/30">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>Buscas recentes</CardTitle>
                  <CardDescription>Apenas neste navegador</CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-md"
                  disabled={searchHistory.length === 0}
                  onClick={handleClearHistory}
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  Limpar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              {searchHistory.length > 0 ? (
                <div className="grid gap-2">
                  {searchHistory.map((entry) => {
                    const mode = SEARCH_MODE_OPTIONS.find(
                      (option) => option.id === entry.mode,
                    );

                    return (
                      <button
                        key={`${entry.id}-${entry.createdAt}`}
                        type="button"
                        className="grid gap-2 rounded-lg border border-border bg-background p-3 text-left transition hover:border-foreground/30 hover:bg-muted/30 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                        onClick={() => handleHistorySelect(entry)}
                      >
                        <span className="min-w-0">
                          <span className="flex items-center gap-2 font-medium text-slate-950 dark:text-slate-50">
                            <History className="size-4 text-sky-700" aria-hidden="true" />
                            {getSearchHistoryLabel(entry)}
                          </span>
                          <span className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span>{mode?.label ?? "Busca"}</span>
                            <span>{entry.date}</span>
                          </span>
                        </span>
                        <span className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2 text-xs text-muted-foreground">
                          <RotateCcw className="size-3" aria-hidden="true" />
                          Repetir
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                  Nenhuma busca recente.
                </div>
              )}
            </CardContent>
          </Card>
          </div>

          <aside className="flex flex-col gap-4">
            {recommendationMutation.isSuccess && recommendation ? (
              <RecommendationCard recommendation={recommendation} />
            ) : recommendationMutation.isSuccess && activityRanking ? (
              <ActivityRankingCard ranking={activityRanking} />
            ) : recommendationMutation.isSuccess && weekComparison ? (
              <WeekComparisonCard comparison={weekComparison} />
            ) : (
              <Card className="overflow-hidden rounded-lg border-border/80 bg-white shadow-sm dark:bg-card">
                <CardHeader className="border-b border-slate-100 bg-slate-50/70 dark:border-border dark:bg-muted/30">
                  <CardTitle>Status</CardTitle>
                  <CardDescription>
                    {searchMode === "atividades"
                      ? selectedDate
                        ? `Ranking em ${selectedDate}`
                        : "Ranking de atividades"
                      : selectedActivity
                      ? `${selectedActivity.name} em ${selectedDate || "data"}`
                      : "Aguardando seleção"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-5" aria-live="polite">
                  {recommendationMutation.isIdle ? (
                    <div className="space-y-4 rounded-lg border border-border bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
                      <div className="flex items-start gap-3">
                        <Clock3 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                        <span>
                          Nenhuma busca executada. Preencha os campos para
                          receber uma recomendação.
                        </span>
                      </div>
                      <div className="grid gap-2 text-xs sm:grid-cols-3">
                        <span className="rounded-md bg-background px-3 py-2">
                          1. Cidade
                        </span>
                        {searchMode !== "atividades" ? (
                          <span className="rounded-md bg-background px-3 py-2">
                            2. Atividade
                          </span>
                        ) : null}
                        <span className="rounded-md bg-background px-3 py-2">
                          {searchMode === "atividades" ? "2. Data" : "3. Data"}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  {recommendationMutation.isPending ? (
                    <div className="space-y-4 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100">
                      <div className="flex items-start gap-3">
                        <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin" aria-hidden="true" />
                        <span>Calculando notas e melhores janelas...</span>
                      </div>
                      <div className="grid gap-2">
                        <span className="h-3 rounded-full bg-sky-100 dark:bg-sky-900/70" />
                        <span className="h-3 w-4/5 rounded-full bg-sky-100 dark:bg-sky-900/70" />
                        <span className="h-3 w-3/5 rounded-full bg-sky-100 dark:bg-sky-900/70" />
                      </div>
                    </div>
                  ) : null}

                  {recommendationMutation.isError ? (
                    <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                        <span>
                          {(recommendationMutation.error as Error).message}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9"
                        disabled={!canSearch || recommendationMutation.isPending}
                        onClick={handleRecommendationRetry}
                      >
                        <RefreshCw className="size-3" aria-hidden="true" />
                        Tentar novamente
                      </Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )}
          </aside>
        </section>

        {recommendationMutation.isSuccess && recommendation ? (
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
            <ScoreTimeline recommendation={recommendation} />
            <ScoreBreakdown recommendation={recommendation} />
          </section>
        ) : null}

        <AttributionFooter disclaimer={resultDisclaimer} />
      </div>
    </main>
  );
}

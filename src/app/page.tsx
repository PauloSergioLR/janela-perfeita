"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  CalendarSearch,
  CircleHelp,
  CloudSun,
  History,
  ListChecks,
  Loader2,
  MapPin,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityRankingCard } from "@/components/result/activity-ranking-card";
import { AttributionFooter } from "@/components/result/attribution-footer";
import { DailyOverviewCard } from "@/components/result/daily-overview-card";
import { BottomForecastStrip } from "@/components/result/forecast-strip";
import { RecommendationCard } from "@/components/result/recommendation-card";
import { WeekComparisonCard } from "@/components/result/week-comparison-card";
import { WeeklyOverviewCard } from "@/components/result/weekly-overview-card";
import { WeatherStage } from "@/components/weather/weather-stage";
import {
  ModeSelector,
  type ModeSelectorOption,
} from "@/components/search/mode-selector";
import { ControlPanelSection } from "@/components/search/control-panel-section";
import { ActivitySelector } from "@/components/search/activity-selector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PremiumState } from "@/components/ui/premium-state";
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
  buildCurrentLocationCity,
  canUseBrowserGeolocation,
  CURRENT_LOCATION_ATTRIBUTION,
  CURRENT_LOCATION_RESOLVING_MESSAGE,
  CURRENT_LOCATION_SUCCESS_MESSAGE,
  CURRENT_LOCATION_WAITING_MESSAGE,
  GEOLOCATION_UNSUPPORTED_MESSAGE,
  getGeolocationErrorMessage,
  isCurrentLocationCity,
} from "@/lib/ui/current-location";
import {
  buildSearchDateOptions,
  formatCityLabel,
  SEARCH_DEBOUNCE_MS,
  type SearchDateOption,
} from "@/lib/ui/search-page";
import { getResultState } from "@/lib/ui/result-state";
import { getWeatherStageVariant } from "@/lib/ui/weather-stage";
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
  DailyWeatherOverview,
  Recommendation,
  SearchHistoryEntry,
  SearchMode,
  WeekComparison,
  WeeklyWeatherOverview,
} from "@/types";

type GeocodingResponse = {
  cities: City[];
};

type RecommendationResponse = {
  recommendation?: Recommendation;
  activityRanking?: ActivityRanking;
  weekComparison?: WeekComparison;
  dailyOverview?: DailyWeatherOverview;
  weeklyOverview?: WeeklyWeatherOverview;
  forecastStrip?: WeeklyWeatherOverview;
};

type LocationDetectionStatus = "idle" | "loading" | "success" | "error";

const SEARCH_MODE_OPTIONS = [
  {
    id: "janela",
    label: "Janela perfeita",
    description: "Atividade e data",
    icon: Search,
  },
  {
    id: "atividades",
    label: "O que fazer hoje?",
    description: "Ranking do dia",
    icon: ListChecks,
  },
  {
    id: "dia",
    label: "Consulta do dia",
    description: "Clima completo",
    icon: CloudSun,
  },
  {
    id: "clima_semana",
    label: "Consulta da semana",
    description: "Previsão 7 dias",
    icon: CalendarSearch,
  },
] satisfies ModeSelectorOption[];

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

async function fetchCurrentLocationCity(input: {
  lat: number;
  lon: number;
  timezone?: string;
}): Promise<City> {
  const params = new URLSearchParams({
    lat: String(input.lat),
    lon: String(input.lon),
  });

  if (input.timezone) {
    params.set("timezone", input.timezone);
  }

  const response = await fetch(`/api/reverse-geocoding?${params.toString()}`);
  const payload = await readApiResponse<{ city: City }>(response);

  return payload.city;
}

async function requestRecommendation(input: {
  city: City;
  mode: SearchMode;
  activityId?: ActivityId;
  date?: string;
  availableFrom?: string;
  availableTo?: string;
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
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableTo, setAvailableTo] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("janela");
  const [compareModels, setCompareModels] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryEntry[]>([]);
  const [locationStatus, setLocationStatus] =
    useState<LocationDetectionStatus>("idle");
  const [locationMessage, setLocationMessage] = useState("");
  const autoLocationRequestedRef = useRef(false);
  const locationRequestIdRef = useRef(0);
  const debouncedCityQuery = useDebouncedValue(
    cityQuery.trim(),
    SEARCH_DEBOUNCE_MS,
  );
  const isDetectingLocation = locationStatus === "loading";
  const usesDate = searchMode !== "clima_semana";
  const usesAvailability = searchMode === "janela" || searchMode === "atividades";
  const canSearch =
    selectedCity !== null &&
    (!usesDate || selectedDate !== "") &&
    (!modeUsesActivity(searchMode) || selectedActivityId !== "");
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
  const dailyOverview = recommendationMutation.data?.dailyOverview;
  const weeklyOverview = recommendationMutation.data?.weeklyOverview;
  const forecastStrip = recommendationMutation.data?.forecastStrip;
  const hasResultContent = Boolean(
    recommendation ||
      activityRanking ||
      weekComparison ||
      dailyOverview ||
      weeklyOverview,
  );
  const resultState = getResultState({
    hasContent: hasResultContent,
    isError: recommendationMutation.isError,
    isIdle: recommendationMutation.isIdle,
    isPending: recommendationMutation.isPending,
  });
  const resultDisclaimer =
    recommendation?.disclaimer ??
    activityRanking?.disclaimer ??
    weekComparison?.disclaimer ??
    dailyOverview?.disclaimer ??
    weeklyOverview?.disclaimer;

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

  const requestCurrentLocation = useCallback(() => {
    const requestId = locationRequestIdRef.current + 1;

    locationRequestIdRef.current = requestId;
    setLocationStatus("loading");
    setLocationMessage(CURRENT_LOCATION_WAITING_MESSAGE);

    if (!canUseBrowserGeolocation(window.navigator)) {
      setLocationStatus("error");
      setLocationMessage(GEOLOCATION_UNSUPPORTED_MESSAGE);
      return;
    }

    window.navigator.geolocation.getCurrentPosition(
      (position) => {
        if (locationRequestIdRef.current !== requestId) {
          return;
        }

        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const coordinates = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };

        setLocationMessage(CURRENT_LOCATION_RESOLVING_MESSAGE);
        void fetchCurrentLocationCity({ ...coordinates, timezone })
          .then((city) => {
            if (locationRequestIdRef.current !== requestId) {
              return;
            }

            setSelectedCity(city);
            setCityQuery(formatCityLabel(city));
            setLocationStatus("success");
            setLocationMessage(
              `${CURRENT_LOCATION_SUCCESS_MESSAGE} ${formatCityLabel(city)}.`,
            );
          })
          .catch(() => {
            if (locationRequestIdRef.current !== requestId) {
              return;
            }

            const city = buildCurrentLocationCity(coordinates, timezone);

            setSelectedCity(city);
            setCityQuery(formatCityLabel(city));
            setLocationStatus("error");
            setLocationMessage(
              "Não foi possível nomear sua cidade; usando coordenadas da localização atual.",
            );
          });
      },
      (error) => {
        if (locationRequestIdRef.current !== requestId) {
          return;
        }

        setLocationStatus("error");
        setLocationMessage(getGeolocationErrorMessage(error.code));
      },
      {
        enableHighAccuracy: false,
        maximumAge: 5 * 60 * 1000,
        timeout: 10000,
      },
    );
  }, []);

  useEffect(() => {
    if (autoLocationRequestedRef.current) {
      return;
    }

    if (new URLSearchParams(window.location.search).get("demo") === "true") {
      return;
    }

    autoLocationRequestedRef.current = true;
    requestCurrentLocation();
  }, [requestCurrentLocation]);

  function resetRecommendationState() {
    if (!recommendationMutation.isIdle) {
      recommendationMutation.reset();
    }
  }

  function resetLocationFeedback() {
    setLocationStatus("idle");
    setLocationMessage("");
  }

  function handleCityQueryChange(value: string) {
    locationRequestIdRef.current += 1;
    resetLocationFeedback();
    setCityQuery(value);
    setSelectedCity(null);
    resetRecommendationState();
  }

  function handleCitySelect(city: City) {
    locationRequestIdRef.current += 1;
    resetLocationFeedback();
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
    availableFrom?: string;
    availableTo?: string;
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

    if (!input.demo && !isCurrentLocationCity(normalizedInput.city)) {
      saveSearch(normalizedInput);
    }

    recommendationMutation.mutate({
      city: normalizedInput.city,
      mode: normalizedInput.mode,
      activityId: normalizedInput.activityId,
      date:
        normalizedInput.mode === "clima_semana"
          ? undefined
          : normalizedInput.date,
      availableFrom: normalizedInput.availableFrom,
      availableTo: normalizedInput.availableTo,
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

    const searchDate = usesDate
      ? selectedDate
      : selectedDate || dateOptions[0]?.value || "";

    runSearch({
      city: selectedCity,
      mode: searchMode,
      activityId: modeUsesActivity(searchMode)
        ? selectedActivityId || undefined
        : undefined,
      activityName: modeUsesActivity(searchMode)
        ? selectedActivity?.name
        : undefined,
      date: searchDate,
      availableFrom: usesAvailability ? availableFrom || undefined : undefined,
      availableTo: usesAvailability ? availableTo || undefined : undefined,
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

  function handleLocationRetry() {
    requestCurrentLocation();
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
      availableFrom: entry.availableFrom,
      availableTo: entry.availableTo,
    });

    locationRequestIdRef.current += 1;
    resetLocationFeedback();
    setSearchMode(searchInput.mode);
    setSelectedCity(searchInput.city);
    setCityQuery(formatCityLabel(searchInput.city));
    setSelectedDate(searchInput.date);
    setAvailableFrom(searchInput.availableFrom ?? "");
    setAvailableTo(searchInput.availableTo ?? "");
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

  const selectedModeOption = SEARCH_MODE_OPTIONS.find(
    (option) => option.id === searchMode,
  );
  const cockpitCityLabel = selectedCity
    ? formatCityLabel(selectedCity)
    : "Cidade pendente";
  const cockpitDateLabel =
    searchMode === "clima_semana"
      ? "Próximos 7 dias"
      : selectedDate || "Data pendente";
  const selectedDateCompactLabel =
    dateOptions.find((option) => option.value === selectedDate)?.label ??
    selectedDate;
  const cockpitActivityLabel = modeUsesActivity(searchMode)
    ? selectedActivity?.name ?? "Atividade pendente"
    : "Sem atividade obrigatória";
  const cockpitResultLabel = recommendation
    ? recommendation.bestWindow
      ? `Das ${recommendation.bestWindow.startLabel} às ${recommendation.bestWindow.endLabel}`
      : "Sem janela boa"
    : activityRanking
      ? "Ranking calculado"
      : weekComparison
        ? "Semana comparada"
        : dailyOverview
          ? "Dia consultado"
          : weeklyOverview
            ? "Semana consultada"
            : recommendationMutation.isPending
              ? "Calculando"
              : recommendationMutation.isError
                ? "Atenção"
                : "Aguardando busca";
  const contextualForecastOverview =
    resultState === "content" && weeklyOverview
      ? weeklyOverview
      : undefined;
  const contextualForecastTitle = weeklyOverview
    ? "Faixa da semana"
    : "Próximos dias";
  const contextualForecastSubtitle = `${cockpitCityLabel} · ${cockpitDateLabel}`;
  const weatherStageVariant = getWeatherStageVariant({
    activityId: selectedActivityId || undefined,
    recommendation,
    activityRanking,
    weekComparison,
    dailyOverview,
    weeklyOverview,
  });
  const locationFeedback = isDetectingLocation
    ? {
        className:
          "border-sky-400/30 bg-sky-400/10 text-sky-900 dark:text-sky-100",
        description: locationMessage || CURRENT_LOCATION_WAITING_MESSAGE,
        disabled: true,
        title: "Detectando sua cidade",
      }
    : locationStatus === "error"
      ? {
          className:
            "border-danger/35 bg-danger/10 text-danger dark:text-danger",
          description: locationMessage || "Use a busca manual ou tente novamente.",
          disabled: false,
          title: "Localização indisponível",
        }
      : locationStatus === "success"
        ? {
            className:
              "border-success/35 bg-success/10 text-success dark:text-success",
            description: locationMessage || "Pronto para usar na consulta.",
            disabled: false,
            title: "Cidade detectada",
          }
        : {
            className:
              "border-weather-accent/30 bg-weather-accent/10 text-weather-accent",
            description: "Não armazenamos sua localização.",
            disabled: false,
            title: "Localização atual",
          };
  const locationActionLabel =
    locationStatus === "error"
      ? "Tentar novamente"
      : locationStatus === "success"
        ? "Atualizar"
        : "Usar localização";

  return (
    <>
      <WeatherStage variant={weatherStageVariant} />
      <main className="relative z-10 min-h-screen px-3 py-4 text-foreground sm:px-4 lg:px-5 xl:h-dvh xl:min-h-0 xl:px-3 xl:py-2 2xl:px-5">
      <div className="grid w-full max-w-none gap-6 xl:h-full xl:min-h-0 xl:grid-rows-[auto_auto_minmax(0,1fr)_auto_auto] xl:gap-2">
        <header className="glass-panel relative grid gap-5 overflow-hidden rounded-xl p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center xl:grid-cols-[minmax(0,1fr)_auto_auto] xl:gap-2 xl:p-2">
          <div
            className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-weather-accent/55 to-transparent"
            aria-hidden="true"
          />
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
            <div className="glow-primary flex size-12 shrink-0 items-center justify-center rounded-lg border border-weather-accent/55 bg-weather-accent/10 shadow-inner shadow-white/10 xl:size-10">
              <CloudSun
                className="size-6 text-weather-accent xl:size-5"
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-weather-accent">
                Clima por decisão
              </p>
              <h1 className="text-2xl font-semibold tracking-normal text-slate-950 dark:text-slate-50 sm:text-3xl xl:text-2xl">
                Janela Perfeita
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 xl:hidden">
                Previsão horária para decidir o melhor momento de cada atividade.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <Badge
              variant="outline"
              className="h-7 border-weather-accent/50 bg-weather-accent/10 px-3 text-weather-accent shadow-inner shadow-white/5"
            >
              Previsão por hora
            </Badge>
            <Badge
              variant="outline"
              className="h-7 border-success/45 bg-success/10 px-3 text-success shadow-inner shadow-white/5"
            >
              Open-Meteo
            </Badge>
            {demoMode ? (
              <Badge
                variant="outline"
                className="h-7 border-warning/45 bg-warning/10 px-3 text-warning"
              >
                Modo demo
              </Badge>
            ) : null}
            <Link
              href="/como-funciona"
              className="inline-flex h-8 items-center gap-2 rounded-md border border-soft bg-background/40 px-3 text-xs font-medium text-muted-foreground transition hover:border-weather-accent/50 hover:bg-weather-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <CircleHelp className="size-3.5" aria-hidden="true" />
              Como funciona
            </Link>
          </div>

          <div className="grid min-w-0 grid-cols-3 gap-2 border-t border-soft pt-4 text-center lg:col-span-2 xl:hidden xl:border-t-0 xl:pt-0">
            <div className="cockpit-surface rounded-md border px-3 py-2">
              <p className="text-lg font-semibold text-slate-950 dark:text-slate-50 xl:text-base">
                {activities.length}
              </p>
              <p className="text-xs text-muted-foreground xl:text-[10px]">atividades</p>
            </div>
            <div className="cockpit-surface rounded-md border px-3 py-2">
              <p className="text-lg font-semibold text-slate-950 dark:text-slate-50 xl:text-base">
                7
              </p>
              <p className="text-xs text-muted-foreground xl:text-[10px]">dias</p>
            </div>
            <div className="cockpit-surface rounded-md border px-3 py-2">
              <p className="text-lg font-semibold text-slate-950 dark:text-slate-50 xl:text-base">
                0-100
              </p>
              <p className="text-xs text-muted-foreground xl:text-[10px]">score</p>
            </div>
          </div>
        </header>

        <ModeSelector
          options={SEARCH_MODE_OPTIONS}
          value={searchMode}
          onChange={(mode) => {
            setSearchMode(mode);
            resetRecommendationState();
          }}
        />

        <section
          className={cn(
            "grid min-w-0 gap-6 xl:h-full xl:min-h-0 xl:items-stretch xl:gap-2",
            searchMode === "janela"
              ? "xl:grid-cols-[clamp(420px,34vw,480px)_minmax(0,1fr)]"
              : "xl:grid-cols-[clamp(280px,22vw,340px)_minmax(0,1fr)]",
          )}
        >
          <aside className="flex min-w-0 flex-col gap-4 xl:h-full xl:min-h-0 xl:gap-2">
          <Card
            className="glass-card overflow-visible rounded-xl xl:h-full xl:min-h-0 xl:shrink-0"
            data-testid="control-panel"
          >
            <CardHeader className="cockpit-surface-strong border-b xl:p-2 xl:pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <CardTitle>Painel de controle</CardTitle>
                  <CardDescription className="text-xs leading-4 xl:hidden">
                    {searchMode === "clima_semana"
                      ? "Cidade define a consulta dos próximos 7 dias."
                      : searchMode === "dia"
                        ? "Cidade e data definem a consulta do dia."
                        : searchMode === "atividades"
                          ? "Cidade e data definem o ranking de atividades."
                          : "Cidade, atividade e data definem a recomendação."}
                  </CardDescription>
                </div>
                <details className="group relative shrink-0 text-xs">
                  <summary className="flex h-7 cursor-pointer list-none items-center gap-1.5 rounded-md border border-soft bg-background/40 px-2 font-medium text-muted-foreground transition hover:border-weather-accent/50 hover:text-foreground marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <History className="size-3.5 text-weather-accent" aria-hidden="true" />
                    {searchHistory.length}
                  </summary>
                  <div className="glass-panel absolute top-full right-0 z-30 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-lg p-2 shadow-lg">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="font-medium text-foreground">Buscas recentes</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 rounded-md px-2 text-xs"
                        disabled={searchHistory.length === 0}
                        onClick={handleClearHistory}
                      >
                        <Trash2 className="size-3.5" aria-hidden="true" />
                        Limpar
                      </Button>
                    </div>
                    {searchHistory.length > 0 ? (
                      <div className="scrollbar-none grid max-h-40 gap-2 overflow-y-auto pr-1">
                        {searchHistory.map((entry) => {
                          const mode = SEARCH_MODE_OPTIONS.find(
                            (option) => option.id === entry.mode,
                          );

                          return (
                            <button
                              key={`${entry.id}-${entry.createdAt}`}
                              type="button"
                              className="grid gap-2 rounded-lg border border-border bg-background p-2 text-left transition hover:border-foreground/30 hover:bg-muted/30 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
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
                              <span className="inline-flex h-7 w-fit items-center gap-1 rounded-md border border-border px-2 text-xs text-muted-foreground">
                                <RotateCcw className="size-3" aria-hidden="true" />
                                Repetir
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-border bg-muted/30 p-3 text-muted-foreground">
                        Nenhuma busca recente.
                      </div>
                    )}
                  </div>
                </details>
              </div>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col p-4 sm:p-5 xl:p-2">
              <form className="flex min-h-0 flex-1 flex-col gap-3 xl:gap-3" onSubmit={handleSubmit}>
                <div
                  className={cn(
                    "min-h-0 space-y-3 xl:flex-1 xl:space-y-2",
                    searchMode === "janela"
                      ? "xl:grid xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] xl:gap-1 xl:space-y-0 xl:overflow-visible xl:pr-0"
                      : "xl:overflow-y-auto xl:pr-2",
                  )}
                  data-testid="control-panel-content"
                >
                <ControlPanelSection
                  number="1"
                  title="Onde?"
                  description="Busque uma cidade ou use a localização atual."
                  compact={searchMode === "janela"}
                  className={cn(
                    "order-1",
                    searchMode === "janela" && "xl:order-none",
                  )}
                >
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-xs">
                    Cidade
                  </Label>
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
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
                        className="h-10 rounded-md border-glass bg-background/35 pl-8 focus-visible:ring-weather-accent/45"
                        autoComplete="off"
                        role="combobox"
                        aria-expanded={cityQueryEnabled}
                        aria-controls="city-suggestions"
                      />
                      {cityQueryEnabled ? (
                        <div
                          id="city-suggestions"
                          role="listbox"
                          className="glass-panel scrollbar-none absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-lg p-1 text-sm shadow-lg"
                        >
                        {cityQueryResult.isFetching ? (
                          <PremiumState
                            compact
                            variant="loading"
                            eyebrow="Busca de cidades"
                            title="Procurando destinos"
                            description="Consultando cidades que combinam com sua busca."
                          />
                        ) : null}

                        {cityQueryResult.isError ? (
                          <PremiumState
                            compact
                            variant="error"
                            eyebrow="Busca indisponível"
                            title="Não foi possível encontrar cidades"
                            description={(cityQueryResult.error as Error).message}
                            action={{
                              label: "Tentar novamente",
                              onClick: () => void cityQueryResult.refetch(),
                            }}
                          />
                        ) : null}

                        {!cityQueryResult.isFetching &&
                        !cityQueryResult.isError &&
                        cityQueryResult.data?.length === 0 ? (
                          <PremiumState
                            compact
                            variant="empty"
                            eyebrow="Sem resultados"
                            title="Nenhuma cidade encontrada"
                            description="Ajuste o nome da cidade ou tente outra grafia."
                            action={{
                              label: "Limpar busca",
                              onClick: () => handleCityQueryChange(""),
                            }}
                          />
                        ) : null}

                        {cityQueryResult.data?.map((city) => (
                          <button
                            key={`${city.id ?? formatCityLabel(city)}-${city.coordinates.lat}-${city.coordinates.lon}`}
                            type="button"
                            role="option"
                            aria-selected={false}
                            className="flex w-full items-start gap-2 rounded-md px-3 py-2 text-left hover:bg-weather-card focus:bg-weather-card focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            onClick={() => handleCitySelect(city)}
                          >
                            <MapPin className="mt-0.5 size-4 shrink-0 text-weather-accent" aria-hidden="true" />
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
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10 shrink-0 border-glass bg-background/40 text-xs hover:border-weather-accent/50 hover:bg-weather-card"
                      disabled={locationFeedback.disabled}
                      onClick={handleLocationRetry}
                    >
                      {isDetectingLocation ? (
                        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                      ) : (
                        <MapPin className="size-3.5" aria-hidden="true" />
                      )}
                      {isDetectingLocation ? "Detectando" : locationActionLabel}
                    </Button>
                  </div>
                  {locationStatus !== "idle" ? (
                    <div
                      className={cn(
                        "rounded-md border px-2 py-1.5 text-[11px] leading-4 shadow-inner shadow-white/5",
                        locationFeedback.className,
                      )}
                    >
                      <span className="font-medium">{locationFeedback.title}: </span>
                      <span className="text-muted-foreground">
                        {locationFeedback.description}
                      </span>
                      <span className="block text-muted-foreground xl:hidden">
                        {CURRENT_LOCATION_ATTRIBUTION}
                      </span>
                    </div>
                  ) : null}
                </div>
                </ControlPanelSection>

                <ControlPanelSection
                  number="2"
                  title="Quando?"
                  description="Defina a data e, se quiser, sua disponibilidade."
                  compact={searchMode === "janela"}
                  className={cn(
                    "order-2",
                    searchMode === "janela" && "xl:order-none",
                  )}
                >
                <div
                  className={cn(
                    "grid gap-3",
                    searchMode === "janela" && "xl:gap-1",
                  )}
                >
                  {usesDate ? (
                    <div
                      className={cn(
                        "space-y-2",
                        searchMode === "janela" && "xl:space-y-1",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Label htmlFor="date">
                          {searchMode === "semana" ? "A partir de" : "Data"}
                        </Label>
                        {dateOptions[0] ? (
                          <button
                            type="button"
                            className={cn(
                              "hidden h-6 rounded-md border px-2 text-xs font-medium transition hover:border-weather-accent/50 xl:inline-flex xl:items-center 2xl:hidden",
                              selectedDate === dateOptions[0].value
                                ? "border-weather-accent/70 bg-weather-accent/15 text-foreground shadow-weather-glow"
                                : "border-soft bg-background/35 text-muted-foreground",
                            )}
                            aria-pressed={selectedDate === dateOptions[0].value}
                            onClick={() => {
                              setSelectedDate(dateOptions[0].value);
                              resetRecommendationState();
                            }}
                          >
                            {dateOptions[0].label}
                          </button>
                        ) : null}
                      </div>
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
                          className="peer h-10 rounded-md border-glass bg-background/35 pl-8 focus-visible:ring-weather-accent/45 xl:opacity-0 xl:text-transparent 2xl:opacity-100 2xl:text-foreground"
                        />
                        <span
                          className="pointer-events-none absolute inset-0 z-20 hidden items-center rounded-md border border-glass bg-background/35 pl-8 text-sm font-semibold text-slate-950 peer-focus-visible:ring-3 peer-focus-visible:ring-ring/40 dark:text-slate-50 xl:flex 2xl:hidden"
                          aria-hidden="true"
                        >
                          {selectedDateCompactLabel || "Selecionar data"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 xl:hidden">
                        {dateOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={cn(
                              "h-7 rounded-md border px-2 text-xs font-medium transition hover:border-weather-accent/50",
                              selectedDate === option.value
                                ? "border-weather-accent/70 bg-weather-accent/15 text-foreground shadow-weather-glow"
                                : "border-soft bg-background/35 text-muted-foreground",
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
                  ) : null}

                  {usesAvailability ? (
                    <details className="cockpit-surface group rounded-lg border p-2">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-xs [&::-webkit-details-marker]:hidden">
                        <span className="font-medium">Disponibilidade opcional</span>
                        <span
                          className={cn(
                            "text-[11px] leading-4 text-muted-foreground",
                            searchMode === "janela" && "xl:hidden",
                          )}
                        >
                          Filtra horário livre
                        </span>
                      </summary>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor="available-from" className="text-xs">
                            De
                          </Label>
                          <Input
                            id="available-from"
                            type="time"
                            value={availableFrom}
                            onChange={(event) => {
                              setAvailableFrom(event.target.value);
                              resetRecommendationState();
                            }}
                            className="h-9 rounded-md border-glass bg-background/35 focus-visible:ring-weather-accent/45"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="available-to" className="text-xs">
                            Até
                          </Label>
                          <Input
                            id="available-to"
                            type="time"
                            value={availableTo}
                            onChange={(event) => {
                              setAvailableTo(event.target.value);
                              resetRecommendationState();
                            }}
                            className="h-9 rounded-md border-glass bg-background/35 focus-visible:ring-weather-accent/45"
                          />
                        </div>
                      </div>
                    </details>
                  ) : null}
                </div>
                </ControlPanelSection>

                {modeUsesActivity(searchMode) ? (
                  <ControlPanelSection
                    number="3"
                    title="O que você quer fazer?"
                    description="Escolha uma atividade para receber a melhor janela."
                    compact={searchMode === "janela"}
                    className={cn(
                      "order-3",
                      searchMode === "janela" && "xl:order-none xl:col-span-2",
                    )}
                  >
                  <div className="space-y-2">
                    <Label id="atividade-label" className="sr-only">
                      Atividade
                    </Label>
                    <ActivitySelector
                      activities={activities}
                      value={selectedActivityId}
                      widePanel={searchMode === "janela"}
                      onChange={(activityId) => {
                        setSelectedActivityId(activityId);
                        resetRecommendationState();
                      }}
                    />
                  </div>
                  </ControlPanelSection>
                ) : null}
                </div>

                <div
                  className={cn(
                    "space-y-3 border-t border-soft pt-3 xl:shrink-0 xl:pt-3",
                    searchMode === "janela" &&
                      !demoMode &&
                      "xl:grid xl:grid-cols-[minmax(0,1fr)_auto] xl:items-stretch xl:gap-2 xl:space-y-0",
                  )}
                >
                {searchMode === "janela" && !demoMode ? (
                  <label className="cockpit-surface flex items-start gap-2 rounded-lg border p-2 text-xs">
                    <input
                      type="checkbox"
                      checked={compareModels}
                      onChange={(event) => {
                        setCompareModels(event.target.checked);
                        resetRecommendationState();
                      }}
                      className="mt-0.5 size-4 accent-weather-accent"
                    />
                    <span className="min-w-0">
                      <span className="block font-medium">
                        Comparar modelos Open-Meteo
                      </span>
                      <span className="block leading-4 text-muted-foreground xl:hidden">
                        Mostra concordância quando a recomendação for calculada.
                      </span>
                    </span>
                  </label>
                ) : null}

                <Button
                  type="submit"
                  size="lg"
                  className="glow-primary h-11 w-full rounded-md bg-weather-accent text-slate-950 hover:bg-weather-accent/90"
                  disabled={!canSearch || recommendationMutation.isPending}
                >
                  {recommendationMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Search className="size-4" aria-hidden="true" />
                  )}
                  {recommendationMutation.isPending
                    ? "Calculando..."
                    : searchMode === "dia"
                      ? "Consultar dia"
                      : searchMode === "clima_semana"
                        ? "Consultar semana"
                      : searchMode === "atividades"
                        ? "Ver o que fazer"
                        : searchMode === "semana"
                          ? "Comparar semana"
                          : "Encontrar janela"}
                </Button>

                </div>
              </form>
            </CardContent>
          </Card>
          </aside>

          <section
            className="flex min-h-0 min-w-0 flex-col gap-4 xl:h-full xl:gap-2"
            aria-label="Resultado da decisão"
          >
            {resultState === "content" && recommendation ? (
              <RecommendationCard
                recommendation={recommendation}
                forecastOverview={forecastStrip}
              />
            ) : resultState === "content" && activityRanking ? (
              <ActivityRankingCard ranking={activityRanking} />
            ) : resultState === "content" && weekComparison ? (
              <WeekComparisonCard comparison={weekComparison} />
            ) : resultState === "content" && dailyOverview ? (
              <DailyOverviewCard overview={dailyOverview} />
            ) : resultState === "content" && weeklyOverview ? (
              <WeeklyOverviewCard overview={weeklyOverview} />
            ) : (
              <Card className="glass-card min-h-[28rem] rounded-xl xl:min-h-0">
                <CardHeader className="cockpit-surface-strong border-b">
                  <CardTitle>Status</CardTitle>
                  <CardDescription>
                    {searchMode === "atividades"
                      ? selectedDate
                        ? `Ranking em ${selectedDate}`
                        : "Ranking de atividades"
                      : searchMode === "dia"
                        ? selectedDate
                          ? `Clima em ${selectedDate}`
                          : "Consulta do dia"
                      : searchMode === "clima_semana"
                        ? "Consulta da semana"
                      : selectedActivity
                      ? `${selectedActivity.name} em ${selectedDate || "data"}`
                      : "Aguardando seleção"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 xl:p-3">
                  {resultState === "initial" ? (
                    <PremiumState
                      variant="initial"
                      eyebrow="Cockpit pronto"
                      title="Monte sua próxima decisão"
                      description="Escolha cidade, atividade e data. A previsão horária transforma o clima em uma janela prática para você."
                    />
                  ) : null}

                  {resultState === "loading" ? (
                    <PremiumState
                      variant="loading"
                      eyebrow="Analisando previsão"
                      title="Calculando melhor janela"
                      description={`Combinando clima, horários e preferências para ${cockpitCityLabel}.`}
                    />
                  ) : null}

                  {resultState === "error" ? (
                    <PremiumState
                      variant="error"
                      eyebrow="Previsão indisponível"
                      title="Não foi possível concluir a análise"
                      description={(recommendationMutation.error as Error).message}
                      action={{
                        label: "Tentar novamente",
                        onClick: handleRecommendationRetry,
                      }}
                    />
                  ) : null}

                  {resultState === "empty" ? (
                    <PremiumState
                      variant="empty"
                      eyebrow="Sem dados para exibir"
                      title="Esta consulta não trouxe previsão"
                      description={
                        searchMode === "clima_semana"
                          ? "Não há dados suficientes para montar a visão da semana agora. Atualize a previsão em instantes."
                          : searchMode === "dia"
                            ? "Não há dados suficientes para este dia. Tente outra data ou atualize a previsão."
                            : "Não recebemos dados para calcular uma recomendação. Tente novamente em instantes."
                      }
                      action={{
                        label: "Atualizar previsão",
                        onClick: handleRecommendationRetry,
                      }}
                    />
                  ) : null}
                </CardContent>
              </Card>
            )}

          </section>
        </section>

        {contextualForecastOverview ? (
          <BottomForecastStrip
            overview={contextualForecastOverview}
            title={contextualForecastTitle}
            subtitle={contextualForecastSubtitle}
          />
        ) : (
          <section
            className="glass-panel rounded-xl p-3 sm:p-4 xl:shrink-0 xl:p-1.5"
            aria-label="Resumo da consulta"
          >
            <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-5 xl:gap-1.5">
              <div className="cockpit-surface rounded-lg border px-3 py-2 xl:px-2 xl:py-1.5">
                <p className="text-xs text-muted-foreground xl:text-[10px]">Modo</p>
                <p className="truncate text-sm font-medium">
                  {selectedModeOption?.label ?? "Janela perfeita"}
                </p>
              </div>
              <div className="cockpit-surface rounded-lg border px-3 py-2 xl:px-2 xl:py-1.5">
                <p className="text-xs text-muted-foreground xl:text-[10px]">Cidade</p>
                <p className="truncate text-sm font-medium">{cockpitCityLabel}</p>
              </div>
              <div className="cockpit-surface rounded-lg border px-3 py-2 xl:px-2 xl:py-1.5">
                <p className="text-xs text-muted-foreground xl:text-[10px]">Período</p>
                <p className="truncate text-sm font-medium">{cockpitDateLabel}</p>
              </div>
              <div className="cockpit-surface rounded-lg border px-3 py-2 xl:px-2 xl:py-1.5">
                <p className="text-xs text-muted-foreground xl:text-[10px]">Atividade</p>
                <p className="truncate text-sm font-medium">
                  {cockpitActivityLabel}
                </p>
              </div>
              <div className="cockpit-surface rounded-lg border px-3 py-2 xl:px-2 xl:py-1.5">
                <p className="text-xs text-muted-foreground xl:text-[10px]">Resultado</p>
                <p className="truncate text-sm font-medium">
                  {cockpitResultLabel}
                </p>
              </div>
            </div>
          </section>
        )}

        <AttributionFooter disclaimer={resultDisclaimer} />
      </div>
      </main>
    </>
  );
}

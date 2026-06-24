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
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityRankingCard } from "@/components/result/activity-ranking-card";
import { AttributionFooter } from "@/components/result/attribution-footer";
import { DailyOverviewCard } from "@/components/result/daily-overview-card";
import { ForecastStrip } from "@/components/result/forecast-strip";
import { RecommendationCard } from "@/components/result/recommendation-card";
import { ScoreBreakdown } from "@/components/result/score-breakdown";
import { OpportunityTimeline } from "@/components/result/opportunity-timeline";
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
  CURRENT_LOCATION_PRIVACY_NOTE,
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
  const weatherStageVariant = getWeatherStageVariant({
    activityId: selectedActivityId || undefined,
    recommendation,
    activityRanking,
    weekComparison,
    dailyOverview,
    weeklyOverview,
  });

  return (
    <>
      <WeatherStage variant={weatherStageVariant} />
      <main className="relative z-10 min-h-screen px-4 py-5 text-foreground sm:px-6 lg:h-dvh lg:overflow-hidden lg:px-5 lg:py-4">
      <div className="mx-auto flex w-full max-w-[1720px] flex-col gap-3 lg:h-full lg:min-h-0">
        <header className="glass-panel shrink-0 rounded-xl p-3">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="glow-primary flex size-10 shrink-0 items-center justify-center rounded-lg border border-weather-accent/55 bg-weather-card">
                <CloudSun
                  className="size-5 text-weather-accent"
                  aria-hidden="true"
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-weather-accent">
                  Clima por decisão
                </p>
                <h1 className="text-lg font-semibold text-slate-950 dark:text-slate-50 sm:text-xl">
                  Janela Perfeita
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="h-6 border-weather-accent/50 bg-weather-card px-2.5 text-xs text-weather-accent"
              >
                Previsão por hora
              </Badge>
              <Badge
                variant="outline"
                className="h-6 border-success/45 bg-success/10 px-2.5 text-xs text-success"
              >
                Open-Meteo
              </Badge>
              {demoMode ? (
                <Badge
                  variant="outline"
                  className="h-6 border-warning/45 bg-warning/10 px-2.5 text-xs text-warning"
                >
                  Demo
                </Badge>
              ) : null}
              <Link
                href="/como-funciona"
                className="inline-flex h-7 items-center gap-1.5 rounded-md border border-soft bg-weather-card px-2.5 text-xs font-medium text-muted-foreground transition hover:border-weather-accent/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <CircleHelp className="size-3" aria-hidden="true" />
                Como funciona
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(280px,320px)_minmax(0,1fr)]">
          <aside className="flex min-w-0 flex-col gap-3">
          <Card className="glass-card shrink-0 overflow-hidden rounded-xl">
            <CardHeader className="border-b border-soft bg-weather-card px-3 py-2.5">
              <CardTitle className="text-base">Painel de controle</CardTitle>
              <CardDescription className="text-xs">
                {searchMode === "clima_semana"
                  ? "Cidade define a consulta dos próximos 7 dias."
                  : searchMode === "dia"
                    ? "Cidade e data definem a consulta do dia."
                    : searchMode === "atividades"
                      ? "Cidade e data definem o ranking de atividades."
                      : "Cidade, atividade e data definem a recomendação."}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <form onSubmit={handleSubmit}>
                <div className="space-y-3 p-3">
                <ControlPanelSection
                  number="1"
                  title="Onde?"
                  description="Busque uma cidade."
                >
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
                      className="h-10 rounded-md pl-8 text-sm"
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
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 w-full justify-center rounded-md text-xs"
                    onClick={requestCurrentLocation}
                    disabled={isDetectingLocation}
                  >
                    {isDetectingLocation ? (
                      <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <MapPin className="size-3.5" aria-hidden="true" />
                    )}
                    {isDetectingLocation
                      ? "Detectando localização..."
                      : "Usar localização atual"}
                  </Button>
                  <p
                    className={cn(
                      "text-[11px] leading-4 text-muted-foreground",
                      locationStatus === "error" && "text-danger",
                      locationStatus === "success" && "text-success",
                    )}
                    aria-live="polite"
                  >
                    {locationMessage || CURRENT_LOCATION_PRIVACY_NOTE}
                    <span className="sr-only"> {CURRENT_LOCATION_ATTRIBUTION}</span>
                  </p>
                </div>
                </ControlPanelSection>

                {modeUsesActivity(searchMode) ? (
                  <ControlPanelSection
                    number="3"
                    title="O que você quer fazer?"
                    description="Escolha uma atividade."
                  >
                  <div className="space-y-2">
                    <Label id="atividade-label">Atividade</Label>
                    <ActivitySelector
                      activities={activities}
                      value={selectedActivityId}
                      compact
                      onChange={(activityId) => {
                        setSelectedActivityId(activityId);
                        resetRecommendationState();
                      }}
                    />
                  </div>
                  </ControlPanelSection>
                ) : null}

                <ControlPanelSection
                  number="2"
                  title="Quando?"
                  description="Defina a data e disponibilidade."
                >
                {usesAvailability ? (
                  <div className="space-y-2 border-t border-soft pt-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Disponibilidade opcional</Label>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        Limita a busca ao período disponível.
                      </p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="available-from" className="text-xs">
                          Disponível de
                        </Label>
                        <Input
                          id="available-from"
                          type="time"
                          value={availableFrom}
                          onChange={(event) => {
                            setAvailableFrom(event.target.value);
                            resetRecommendationState();
                          }}
                          className="h-9 rounded-md text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="available-to" className="text-xs">
                          Disponível até
                        </Label>
                        <Input
                          id="available-to"
                          type="time"
                          value={availableTo}
                          onChange={(event) => {
                            setAvailableTo(event.target.value);
                            resetRecommendationState();
                          }}
                          className="h-9 rounded-md text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="space-y-2">
                  {usesDate ? (
                    <div className="space-y-1.5">
                      <Label htmlFor="date" className="text-xs">
                        {searchMode === "semana" ? "A partir de" : "Data"}
                      </Label>
                      <div className="relative">
                        <CalendarDays className="pointer-events-none absolute top-2 left-2.5 size-3.5 text-muted-foreground" aria-hidden="true" />
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
                          className="h-9 rounded-md pl-8 text-sm"
                        />
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {dateOptions.slice(0, 4).map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={cn(
                              "h-7 rounded-md border px-2.5 text-xs font-medium transition hover:border-foreground/30",
                              selectedDate === option.value
                                ? "border-sky-600 bg-sky-50 text-sky-900 dark:border-sky-400 dark:bg-sky-950/60 dark:text-sky-100"
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
                  ) : null}

                </div>
                </ControlPanelSection>

                {searchMode === "janela" && !demoMode ? (
                  <label className="flex items-center gap-2 rounded-lg border border-soft bg-background/35 px-2.5 py-2 text-xs">
                    <input
                      type="checkbox"
                      checked={compareModels}
                      onChange={(event) => {
                        setCompareModels(event.target.checked);
                        resetRecommendationState();
                      }}
                      className="mt-0.5 size-3.5"
                    />
                    <span className="min-w-0">
                      <span className="block font-medium leading-snug">
                        Comparar modelos Open-Meteo
                      </span>
                      <span className="block leading-relaxed text-muted-foreground">
                        Mostra concordância ao calcular.
                      </span>
                    </span>
                  </label>
                ) : null}

                </div>
                <div className="shrink-0 border-t border-soft bg-weather-card/70 p-2.5">
                  <Button
                    type="submit"
                    size="default"
                    className="glow-primary h-10 w-full rounded-md bg-weather-accent text-sm font-medium text-slate-950 hover:bg-weather-accent/90"
                    disabled={!canSearch || recommendationMutation.isPending}
                  >
                    {recommendationMutation.isPending ? (
                      <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <Search className="size-3.5" aria-hidden="true" />
                    )}
                    {recommendationMutation.isPending
                      ? "Calculando..."
                      : searchMode === "dia"
                        ? "Consultar dia"
                        : searchMode === "clima_semana"
                          ? "Consultar semana"
                        : searchMode === "atividades"
                          ? "Ver ranking"
                          : searchMode === "semana"
                            ? "Comparar semana"
                            : "Encontrar janela"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <details className="glass-card relative shrink-0 overflow-hidden rounded-xl">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 bg-weather-card px-3 py-2.5 marker:content-none [&::-webkit-details-marker]:hidden">
              <span>
                <span className="block text-sm font-medium text-slate-950 dark:text-slate-50">
                  Buscas recentes
                </span>
                <span className="block text-xs text-muted-foreground">
                  {searchHistory.length > 0
                    ? `${searchHistory.length} salva${searchHistory.length === 1 ? "" : "s"}`
                    : "Nenhuma salva"}
                </span>
              </span>
              <History className="size-3.5 text-weather-accent" aria-hidden="true" />
            </summary>
            <div className="border-t border-soft bg-weather-card p-3 lg:absolute lg:bottom-full lg:left-0 lg:right-0 lg:z-30 lg:mb-2 lg:rounded-xl lg:border">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  Repita uma consulta anterior.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 shrink-0 rounded-md text-xs"
                  disabled={searchHistory.length === 0}
                  onClick={handleClearHistory}
                >
                  <Trash2 className="size-3" aria-hidden="true" />
                  Limpar
                </Button>
              </div>
              {searchHistory.length > 0 ? (
                <div className="grid gap-1.5">
                  {searchHistory.slice(0, 6).map((entry) => {
                    const mode = SEARCH_MODE_OPTIONS.find(
                      (option) => option.id === entry.mode,
                    );

                    return (
                      <button
                        key={`${entry.id}-${entry.createdAt}`}
                        type="button"
                        className="grid gap-1.5 rounded-lg border border-border bg-background p-2.5 text-left text-xs transition hover:border-foreground/30 hover:bg-muted/30 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
                        onClick={() => handleHistorySelect(entry)}
                      >
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5 font-medium text-slate-950 dark:text-slate-50">
                            <History className="size-3 text-sky-700" aria-hidden="true" />
                            <span className="truncate">{getSearchHistoryLabel(entry)}</span>
                          </span>
                          <span className="mt-0.5 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                            <span>{mode?.label ?? "Busca"}</span>
                            <span>•</span>
                            <span>{entry.date}</span>
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                  Nenhuma busca recente.
                </div>
              )}
            </div>
          </details>
          </aside>

          <div className="flex min-w-0 flex-col gap-3 lg:min-h-0">
            <ModeSelector
              options={SEARCH_MODE_OPTIONS}
              value={searchMode}
              onChange={(mode) => {
                setSearchMode(mode);
                resetRecommendationState();
              }}
            />

          <section
            className="flex min-w-0 flex-col gap-3 lg:min-h-0 lg:flex-1"
            aria-label="Resultado da decisão"
          >
            {resultState === "content" && recommendation ? (
              <>
                <RecommendationCard recommendation={recommendation} />
                <OpportunityTimeline recommendation={recommendation} />
                {forecastStrip ? <ForecastStrip overview={forecastStrip} /> : null}
                <details className="glass-card relative rounded-xl">
                  <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-muted-foreground transition hover:text-foreground">
                    Ver critérios da pontuação
                  </summary>
                  <div className="border-t border-soft p-3 lg:absolute lg:bottom-full lg:right-0 lg:z-40 lg:w-[min(34rem,calc(100vw-3rem))] lg:rounded-xl lg:border lg:bg-popover lg:shadow-weather-card">
                    <ScoreBreakdown recommendation={recommendation} />
                  </div>
                </details>
              </>
            ) : resultState === "content" && activityRanking ? (
              <ActivityRankingCard ranking={activityRanking} />
            ) : resultState === "content" && weekComparison ? (
              <WeekComparisonCard comparison={weekComparison} />
            ) : resultState === "content" && dailyOverview ? (
              <DailyOverviewCard overview={dailyOverview} />
            ) : resultState === "content" && weeklyOverview ? (
              <WeeklyOverviewCard overview={weeklyOverview} />
            ) : (
              <Card className="glass-card min-h-[24rem] overflow-hidden rounded-xl lg:flex-1">
                <CardHeader className="border-b border-soft bg-weather-card px-4 py-3">
                  <CardTitle className="text-base">Status</CardTitle>
                  <CardDescription className="text-xs">
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
                <CardContent className="p-4">
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

        <section
          className="glass-panel shrink-0 rounded-xl p-2 sm:p-2.5 lg:hidden"
          aria-label="Resumo da consulta"
        >
          <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-lg border border-soft bg-background/45 px-2.5 py-1.5">
              <p className="text-xs text-muted-foreground">Modo</p>
              <p className="truncate text-sm font-medium">
                {selectedModeOption?.label ?? "Janela perfeita"}
              </p>
            </div>
            <div className="rounded-lg border border-soft bg-background/45 px-2.5 py-1.5">
              <p className="text-xs text-muted-foreground">Cidade</p>
              <p className="truncate text-sm font-medium">{cockpitCityLabel}</p>
            </div>
            <div className="rounded-lg border border-soft bg-background/45 px-2.5 py-1.5">
              <p className="text-xs text-muted-foreground">Período</p>
              <p className="truncate text-sm font-medium">{cockpitDateLabel}</p>
            </div>
            <div className="rounded-lg border border-soft bg-background/45 px-2.5 py-1.5">
              <p className="text-xs text-muted-foreground">Atividade</p>
              <p className="truncate text-sm font-medium">
                {cockpitActivityLabel}
              </p>
            </div>
            <div className="rounded-lg border border-soft bg-background/45 px-2.5 py-1.5">
              <p className="text-xs text-muted-foreground">Resultado</p>
              <p className="truncate text-sm font-medium">
                {cockpitResultLabel}
              </p>
            </div>
          </div>
        </section>

        <AttributionFooter disclaimer={resultDisclaimer} />
          </div>
        </section>
      </div>
      </main>
    </>
  );
}

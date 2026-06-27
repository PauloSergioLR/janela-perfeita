"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  CalendarSearch,
  CheckCircle2,
  CircleHelp,
  CloudSun,
  Clock3,
  History,
  ListChecks,
  Loader2,
  MapPin,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityRankingCard } from "@/components/result/activity-ranking-card";
import { AttributionFooter } from "@/components/result/attribution-footer";
import { BottomForecastStrip } from "@/components/result/bottom-forecast-strip";
import { DailyOverviewCard } from "@/components/result/daily-overview-card";
import { WeekComparisonCard } from "@/components/result/week-comparison-card";
import { WeeklyOverviewCard } from "@/components/result/weekly-overview-card";
import { WeatherStage } from "@/components/weather/weather-stage";
import {
  ModeSelector,
  type ModeSelectorOption,
} from "@/components/search/mode-selector";
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
import { getActivityIcon, getWeatherMetricIcon } from "@/lib/ui/icon-system";
import {
  buildTimelineData,
  formatDecisionWindow,
  formatForecastConfidenceLevel,
  formatRecommendationDate,
  formatRecommendationLocation,
  getPeakHourScore,
} from "@/lib/ui/recommendation-result";
import { getScoreRingBand, type ScoreRingTone } from "@/lib/ui/score-ring";
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
import { getWeatherStats } from "@/lib/ui/weather-stats";
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

function getCompactScoreClassName(tone: ScoreRingTone): string {
  if (tone === "success") {
    return "border-success/55 bg-success/10 text-success";
  }

  if (tone === "accent") {
    return "border-weather-accent/55 bg-weather-accent/10 text-weather-accent";
  }

  if (tone === "warning") {
    return "border-warning/55 bg-warning/10 text-warning";
  }

  if (tone === "caution") {
    return "border-amber-400/55 bg-amber-400/10 text-amber-300";
  }

  return "border-danger/55 bg-danger/10 text-danger";
}

function CockpitRecommendationPanel({
  recommendation,
}: {
  recommendation: Recommendation;
}) {
  const bestWindow = recommendation.bestWindow;
  const resultScore =
    bestWindow !== null
      ? getPeakHourScore(bestWindow.scores)
      : getPeakHourScore(recommendation.scores);
  const displayScore = Math.round(
    bestWindow?.avgScore ?? resultScore?.score ?? 0,
  );
  const scoreBand = getScoreRingBand(displayScore);
  const timelineData = useMemo(
    () =>
      buildTimelineData(
        recommendation.scores,
        recommendation.activity.minRecommendedScore,
        bestWindow,
      ),
    [bestWindow, recommendation],
  );
  const defaultSelectedTime =
    timelineData.find((datum) => datum.isBestWindow)?.time ??
    timelineData[0]?.time ??
    null;
  const [selectedTime, setSelectedTime] = useState(defaultSelectedTime);
  const selectedDatum =
    timelineData.find((datum) => datum.time === selectedTime) ??
    timelineData[0] ??
    null;
  const reasonRules = (resultScore?.breakdown ?? []).slice(0, 4);
  const weatherStats = getWeatherStats({
    weather: resultScore?.weather ?? null,
    sunrise: recommendation.sunrise,
    sunset: recommendation.sunset,
  }).slice(0, 5);

  useEffect(() => {
    setSelectedTime(defaultSelectedTime);
  }, [defaultSelectedTime]);

  return (
    <section className="grid h-full min-h-0 gap-3 lg:grid-rows-[minmax(0,1fr)_7.25rem]">
      <div className="grid min-h-0 gap-3 xl:grid-cols-[minmax(220px,0.42fr)_minmax(0,1fr)]">
        <article className="grid min-h-0 content-center rounded-lg border border-weather-accent/40 bg-weather-accent/10 p-4 shadow-weather-glow">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-weather-accent">
            Decisão principal
          </p>
          <h2 className="mt-1 text-xl font-semibold">Recomendação</h2>
          <div
            className={cn(
              "mt-4 grid aspect-square w-32 place-items-center rounded-full border-8 text-center sm:w-36",
              getCompactScoreClassName(scoreBand.tone),
            )}
            role="img"
            aria-label={`Score ${displayScore} de 100: ${scoreBand.label}`}
          >
            <div>
              <p className="text-xs font-medium">Score</p>
              <p className="text-4xl font-semibold leading-none">
                {displayScore}
                <span className="text-sm">/100</span>
              </p>
              <p className="mt-1 text-xs font-semibold">{scoreBand.label}</p>
            </div>
          </div>
          <div className="mt-4 border-t border-weather-accent/25 pt-3">
            <p className="text-sm font-medium text-muted-foreground">
              Janela recomendada
            </p>
            <p className="mt-1 text-2xl font-semibold leading-tight">
              {formatDecisionWindow(bestWindow)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {recommendation.activity.name} ·{" "}
              {formatRecommendationLocation(recommendation)} ·{" "}
              {formatRecommendationDate(recommendation.date)}
            </p>
            {bestWindow ? (
              <Badge
                variant="outline"
                className="mt-3 h-7 border-success/45 bg-success/10 px-3 text-success"
              >
                <CheckCircle2 className="size-3" aria-hidden="true" />
                Confiança{" "}
                {formatForecastConfidenceLevel(
                  bestWindow.confidence.level,
                ).toLowerCase()}
              </Badge>
            ) : null}
          </div>
        </article>

        <div className="grid min-h-0 gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section
            className="min-h-0 rounded-lg border border-soft bg-background/45 p-3"
            aria-label="Motivos da recomendação"
          >
            <h3 className="text-sm font-medium">Motivos da recomendação</h3>
            <div className="mt-3 grid gap-2">
              {reasonRules.length > 0 ? (
                reasonRules.map((rule) => (
                  <div
                    key={`${rule.factor}-${rule.reason}`}
                    className="rounded-md border border-soft bg-weather-card/70 px-3 py-2"
                  >
                    <p className="text-xs font-semibold">{rule.label}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {rule.reason}
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-md border border-soft bg-weather-card/70 p-3 text-xs text-muted-foreground">
                  Sem detalhamento para esta janela.
                </p>
              )}
            </div>
          </section>

          <section
            className="min-h-0 rounded-lg border border-soft bg-background/45 p-3"
            aria-label="Estatísticas climáticas"
          >
            <h3 className="text-sm font-medium">Estatísticas climáticas</h3>
            <dl className="mt-3 grid grid-cols-2 gap-2 xl:grid-cols-3">
              {weatherStats.map((stat) => {
                const Icon = getWeatherMetricIcon(stat.id);

                return (
                  <div
                    key={stat.id}
                    className="rounded-md border border-soft bg-weather-card/70 p-2"
                  >
                    <dt className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      <Icon
                        className="size-3 text-weather-accent"
                        aria-hidden="true"
                      />
                      {stat.label}
                    </dt>
                    <dd className="mt-1 text-base font-semibold">{stat.value}</dd>
                    {stat.detail ? (
                      <p className="truncate text-[11px] text-muted-foreground">
                        {stat.detail}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </dl>
          </section>
        </div>
      </div>

      <section
        className="grid min-h-0 gap-3 rounded-lg border border-soft bg-background/45 p-3 lg:grid-cols-[minmax(0,1fr)_minmax(220px,0.42fr)]"
        aria-label="Timeline de oportunidade"
      >
        <div className="min-w-0">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="text-sm font-medium">Timeline de scores</h3>
            <Badge
              variant="outline"
              className="h-7 border-weather-accent/45 bg-weather-accent/10 px-3 text-weather-accent"
            >
              Mínimo {recommendation.activity.minRecommendedScore}/100
            </Badge>
          </div>
          <div className="flex min-w-0 gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {timelineData.map((datum) => {
              const isSelected = datum.time === selectedDatum?.time;
              const isStrong = datum.isBestWindow || datum.isRecommended;

              return (
                <button
                  key={datum.time}
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={`${datum.hourLabel}, score ${datum.score} de 100. ${datum.reason}`}
                  onClick={() => setSelectedTime(datum.time)}
                  className={cn(
                    "grid h-16 w-16 shrink-0 content-end rounded-md border p-1.5 text-left transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    isSelected
                      ? "border-weather-accent/65 bg-weather-accent/16 shadow-weather-glow"
                      : "border-soft bg-weather-card/70 hover:border-weather-accent/45",
                  )}
                >
                  <span
                    className={cn(
                      "rounded-sm",
                      isStrong ? "bg-weather-accent" : "bg-muted-foreground/45",
                    )}
                    style={{
                      height: `${Math.max(12, Math.min(48, datum.score / 2))}px`,
                    }}
                    aria-hidden="true"
                  />
                  <span className="mt-1 flex items-center justify-between gap-1 text-[11px]">
                    <span>{datum.hourLabel}</span>
                    <span className="font-semibold">{datum.score}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {selectedDatum ? (
          <div
            className="min-w-0 rounded-md border border-soft bg-weather-card/70 p-2"
            aria-live="polite"
            aria-label={`Detalhes de ${selectedDatum.hourLabel}`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">{selectedDatum.hourLabel}</p>
              <Badge variant="outline" className="h-7 px-2">
                {selectedDatum.score}/100
              </Badge>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {selectedDatum.reason}
            </p>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              {selectedDatum.rainRisk ? <span>{selectedDatum.rainRisk}</span> : null}
              {selectedDatum.wind ? <span>{selectedDatum.wind}</span> : null}
            </div>
          </div>
        ) : null}
      </section>
    </section>
  );
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
      <main
        className="relative z-10 min-h-screen px-3 py-2 text-foreground sm:px-4 lg:h-dvh lg:overflow-hidden lg:px-4"
        aria-label="Cockpit principal"
      >
      <div className="mx-auto grid w-full max-w-[1540px] gap-2 lg:h-[calc(100dvh-1rem)] lg:grid-rows-[auto_auto_minmax(0,1fr)_7rem_auto]">
        <header className="glass-panel flex min-h-0 flex-col gap-2 rounded-xl p-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="glow-primary flex size-9 shrink-0 items-center justify-center rounded-lg border border-weather-accent/55 bg-weather-card">
              <CloudSun
                className="size-4 text-weather-accent"
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-weather-accent">
                Clima por decisão
              </p>
              <h1 className="text-lg font-semibold text-slate-950 dark:text-slate-50 sm:text-xl">
                Janela Perfeita
              </h1>
              <p className="hidden max-w-2xl text-xs leading-5 text-slate-600 dark:text-slate-300 2xl:block">
                Previsão horária para decidir o melhor momento de cada atividade.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <Badge
              variant="outline"
              className="h-7 border-weather-accent/50 bg-weather-card px-3 text-weather-accent"
            >
              Previsão por hora
            </Badge>
            <Badge
              variant="outline"
              className="h-7 border-success/45 bg-success/10 px-3 text-success"
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
              className="inline-flex h-7 items-center gap-2 rounded-md border border-soft bg-weather-card px-2.5 text-xs font-medium text-muted-foreground transition hover:border-weather-accent/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <CircleHelp className="size-3.5" aria-hidden="true" />
              Como funciona
            </Link>
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

        <section className="grid min-h-0 gap-2 xl:grid-cols-[minmax(360px,0.64fr)_minmax(0,1.36fr)]">
          <aside className="min-h-0 min-w-0">
          <Card className="glass-card h-full min-h-0 overflow-visible rounded-xl py-2">
            <CardHeader className="border-b border-soft bg-weather-card px-3 pb-2">
              <CardTitle>Painel de controle</CardTitle>
              <CardDescription className="hidden lg:block">
                {searchMode === "clima_semana"
                  ? "Cidade define a consulta dos próximos 7 dias."
                  : searchMode === "dia"
                    ? "Cidade e data definem a consulta do dia."
                    : searchMode === "atividades"
                      ? "Cidade e data definem o ranking de atividades."
                      : "Cidade, atividade e data definem a recomendação."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col px-3 pt-3">
              <form className="flex min-h-0 flex-1 flex-col gap-2.5" onSubmit={handleSubmit}>
                <section className="rounded-lg border border-soft bg-background/35 p-2">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-md border border-weather-accent/45 bg-weather-accent/10 text-[11px] font-semibold text-weather-accent">
                      1
                    </span>
                    <h2 className="text-sm font-semibold">Onde?</h2>
                  </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city" className="text-xs">Cidade</Label>
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
                      className="h-9 rounded-md pl-8"
                      autoComplete="off"
                      role="combobox"
                      aria-expanded={cityQueryEnabled}
                      aria-controls="city-suggestions"
                    />
                    {cityQueryEnabled ? (
                      <div
                        id="city-suggestions"
                        role="listbox"
                        className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-lg border border-border bg-popover p-1 text-sm shadow-lg"
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
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex h-7 items-center gap-1.5 rounded-md border border-soft px-2 text-xs text-muted-foreground transition hover:border-weather-accent/45 hover:text-weather-accent disabled:cursor-wait disabled:opacity-65"
                      disabled={isDetectingLocation}
                      onClick={handleLocationRetry}
                    >
                      <RefreshCw className="size-3" aria-hidden="true" />
                      {isDetectingLocation
                        ? "Detectando..."
                        : "Usar localização atual"}
                    </button>
                    <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                      {isDetectingLocation
                        ? locationMessage || CURRENT_LOCATION_WAITING_MESSAGE
                        : locationStatus === "error"
                          ? locationMessage || CURRENT_LOCATION_PRIVACY_NOTE
                          : locationStatus === "success"
                            ? locationMessage
                            : CURRENT_LOCATION_ATTRIBUTION}
                    </p>
                  </div>
                </div>
                </section>

                {modeUsesActivity(searchMode) ? (
                  <section className="rounded-lg border border-soft bg-background/35 p-2">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-md border border-weather-accent/45 bg-weather-accent/10 text-[11px] font-semibold text-weather-accent">
                        2
                      </span>
                      <h2 id="atividade-label" className="text-sm font-semibold">
                        Atividade
                      </h2>
                    </div>
                    <div
                      className="grid grid-cols-2 gap-1.5 sm:grid-cols-3"
                      role="radiogroup"
                      aria-labelledby="atividade-label"
                    >
                      {activities.map((activity) => {
                        const ActivityIcon = getActivityIcon(activity.id);
                        const selected = selectedActivityId === activity.id;

                        return (
                          <button
                            key={activity.id}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            className={cn(
                              "grid h-9 min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-1.5 rounded-md border px-2 text-left text-xs transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                              selected
                                ? "border-weather-accent/65 bg-weather-accent/14 text-weather-accent"
                                : "border-soft bg-weather-card/55 hover:border-weather-accent/45",
                            )}
                            onClick={() => {
                              setSelectedActivityId(activity.id);
                              resetRecommendationState();
                            }}
                          >
                            <ActivityIcon className="size-3.5" aria-hidden="true" />
                            <span className="truncate">{activity.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ) : null}

                <section className="rounded-lg border border-soft bg-background/35 p-2">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-md border border-weather-accent/45 bg-weather-accent/10 text-[11px] font-semibold text-weather-accent">
                      3
                    </span>
                    <h2 className="text-sm font-semibold">Quando?</h2>
                  </div>
                {usesAvailability ? (
                  <details className="mb-2 rounded-md border border-soft bg-weather-card/45 p-2">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-xs font-medium">
                      Disponibilidade opcional
                      <Clock3 className="size-3.5 text-weather-accent" aria-hidden="true" />
                    </summary>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="available-from" className="text-xs">Disponivel de</Label>
                        <Input
                          id="available-from"
                          type="time"
                          value={availableFrom}
                          onChange={(event) => {
                            setAvailableFrom(event.target.value);
                            resetRecommendationState();
                          }}
                          className="h-8 rounded-md"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="available-to" className="text-xs">Disponivel ate</Label>
                        <Input
                          id="available-to"
                          type="time"
                          value={availableTo}
                          onChange={(event) => {
                            setAvailableTo(event.target.value);
                            resetRecommendationState();
                          }}
                          className="h-8 rounded-md"
                        />
                      </div>
                    </div>
                  </details>
                ) : null}

                <div className="grid gap-2">
                  {usesDate ? (
                    <div className="space-y-1.5">
                      <Label htmlFor="date" className="text-xs">
                        {searchMode === "semana" ? "A partir de" : "Data"}
                      </Label>
                      <div className="relative">
                        <CalendarDays className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" aria-hidden="true" />
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
                          className="h-9 rounded-md pl-8"
                        />
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {dateOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            className={cn(
                              "h-7 rounded-md border px-2 text-xs font-medium transition hover:border-foreground/30",
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
                  ) : null}

                </div>
                </section>

                {searchMode === "janela" && !demoMode ? (
                  <label className="flex items-start gap-2 rounded-lg border border-soft bg-background/35 p-2 text-xs">
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
                      <span className="hidden leading-5 text-muted-foreground 2xl:block">
                        Mostra concordância quando a recomendação for calculada.
                      </span>
                    </span>
                  </label>
                ) : null}

                <details className="rounded-lg border border-soft bg-background/35 p-2">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-xs font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <History className="size-3.5 text-weather-accent" aria-hidden="true" />
                      Buscas recentes
                    </span>
                    <span className="rounded-md border border-soft px-1.5 py-0.5 text-[11px] text-muted-foreground">
                      {searchHistory.length}
                    </span>
                  </summary>
                  <div className="mt-2 grid gap-1.5">
                    {searchHistory.length > 0 ? (
                      searchHistory.slice(0, 3).map((entry) => {
                        const mode = SEARCH_MODE_OPTIONS.find(
                          (option) => option.id === entry.mode,
                        );

                        return (
                          <button
                            key={`${entry.id}-${entry.createdAt}`}
                            type="button"
                            className="grid gap-1 rounded-md border border-soft bg-weather-card/55 p-2 text-left text-xs transition hover:border-weather-accent/45 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                            onClick={() => handleHistorySelect(entry)}
                          >
                            <span className="flex min-w-0 items-center gap-1.5 font-medium">
                              <RotateCcw
                                className="size-3 text-weather-accent"
                                aria-hidden="true"
                              />
                              <span className="truncate">
                                {getSearchHistoryLabel(entry)}
                              </span>
                            </span>
                            <span className="truncate text-[11px] text-muted-foreground">
                              {mode?.label ?? "Busca"} · {entry.date}
                            </span>
                          </button>
                        );
                      })
                    ) : (
                      <p className="rounded-md border border-soft bg-weather-card/55 p-2 text-xs text-muted-foreground">
                        Nenhuma busca recente.
                      </p>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 justify-self-start rounded-md text-xs"
                      disabled={searchHistory.length === 0}
                      onClick={handleClearHistory}
                    >
                      <Trash2 className="size-3" aria-hidden="true" />
                      Limpar
                    </Button>
                  </div>
                </details>

                <Button
                  type="submit"
                  size="lg"
                  className="glow-primary mt-auto h-10 w-full rounded-md bg-weather-accent text-slate-950 hover:bg-weather-accent/90"
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
              </form>
            </CardContent>
          </Card>
          </aside>

          <section
            className="glass-card h-full min-h-0 min-w-0 overflow-y-auto rounded-xl p-2 pr-2.5 [scrollbar-width:thin]"
            aria-label="Resultado da decisão"
          >
            {resultState === "content" && recommendation ? (
              <CockpitRecommendationPanel recommendation={recommendation} />
            ) : resultState === "content" && activityRanking ? (
              <ActivityRankingCard ranking={activityRanking} />
            ) : resultState === "content" && weekComparison ? (
              <WeekComparisonCard comparison={weekComparison} />
            ) : resultState === "content" && dailyOverview ? (
              <DailyOverviewCard overview={dailyOverview} />
            ) : resultState === "content" && weeklyOverview ? (
              <WeeklyOverviewCard overview={weeklyOverview} />
            ) : (
              <Card className="h-full min-h-0 overflow-hidden rounded-xl border-0 bg-transparent shadow-none ring-0">
                <CardHeader className="border-b border-soft bg-weather-card">
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
                <CardContent className="p-4 sm:p-5">
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

        <BottomForecastStrip
          className="min-h-0"
          overview={forecastStrip}
          modeLabel={selectedModeOption?.label ?? "Janela perfeita"}
          cityLabel={cockpitCityLabel}
          dateLabel={cockpitDateLabel}
          activityLabel={cockpitActivityLabel}
          resultLabel={cockpitResultLabel}
        />

        <AttributionFooter compact disclaimer={resultDisclaimer} />
      </div>
      </main>
    </>
  );
}

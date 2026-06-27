"use client";

import { useState } from "react";
import {
  Bike,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  CloudRain,
  CloudSun,
  Dumbbell,
  Footprints,
  History,
  LocateFixed,
  MapPin,
  Radar,
  RotateCcw,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  SunMedium,
  Thermometer,
  Trophy,
  Trash2,
  Waves,
  Wind,
} from "lucide-react";
import Link from "next/link";
import { ScoreRing } from "@/components/result/score-ring";
import { WeatherStage } from "@/components/weather/weather-stage";

const decisionModes = [
  {
    id: "janela-perfeita",
    label: "Janela perfeita",
    eyebrow: "Melhor horario",
    title: "Resultado futuro",
    description:
      "Score protagonista, janela recomendada e sinais climaticos no MainPanel.",
    metric: "86",
    icon: Sparkles,
  },
  {
    id: "fazer-hoje",
    label: "O que fazer hoje?",
    eyebrow: "Ranking rapido",
    title: "Atividades do dia",
    description: "Comparativo compacto para escolher atividade sem abrir nova secao.",
    metric: "4",
    icon: SunMedium,
  },
  {
    id: "consulta-dia",
    label: "Consulta do dia",
    eyebrow: "Dia especifico",
    title: "Agenda climatica",
    description: "Leitura hora a hora com pontos de atencao dentro do painel principal.",
    metric: "12h",
    icon: CalendarDays,
  },
  {
    id: "consulta-semana",
    label: "Consulta da semana",
    eyebrow: "7 dias",
    title: "Panorama semanal",
    description: "Tendencia, melhores dias e riscos resumidos no mesmo MainPanel.",
    metric: "7d",
    icon: Radar,
  },
];

const climateBlocks = [
  { time: "06h", label: "Ceu limpo", value: "18C" },
  { time: "09h", label: "Brisa leve", value: "21C" },
  { time: "12h", label: "Sol forte", value: "26C" },
  { time: "15h", label: "Nuvens", value: "24C" },
  { time: "18h", label: "Vento baixo", value: "20C" },
];

const activityCards = [
  {
    id: "caminhada",
    label: "Caminhada",
    detail: "leve",
    icon: Footprints,
  },
  {
    id: "bike",
    label: "Bike",
    detail: "vento",
    icon: Bike,
  },
  {
    id: "treino",
    label: "Treino",
    detail: "externo",
    icon: Dumbbell,
  },
  {
    id: "praia",
    label: "Praia",
    detail: "sol",
    icon: Waves,
  },
];

const perfectWindowReasons = [
  "Chuva quase nula",
  "Vento leve",
  "Sensacao agradavel",
  "Luz estavel",
];

const perfectWindowStats = [
  {
    label: "Temperatura",
    value: "22C",
    detail: "sensacao 21C",
    icon: Thermometer,
  },
  {
    label: "Chuva",
    value: "6%",
    detail: "0.0 mm",
    icon: CloudRain,
  },
  {
    label: "Vento",
    value: "9 km/h",
    detail: "rajadas 14 km/h",
    icon: Wind,
  },
  {
    label: "Confianca",
    value: "Alta",
    detail: "modelo estavel",
    icon: ShieldCheck,
  },
];

const perfectWindowTimeline = [
  { time: "07h", score: 61, label: "ok" },
  { time: "08h", score: 74, label: "boa" },
  { time: "09h", score: 86, label: "pico" },
  { time: "10h", score: 88, label: "pico" },
  { time: "11h", score: 81, label: "boa" },
  { time: "12h", score: 68, label: "atenção" },
  { time: "13h", score: 54, label: "fraca" },
];

const todayRankingCards = [
  {
    id: "caminhada",
    position: 1,
    label: "Caminhada",
    score: 91,
    window: "08h - 10h",
    summary: "Brisa leve, baixa chuva e luz confortavel.",
    signal: "ideal agora",
    icon: Footprints,
  },
  {
    id: "bike",
    position: 2,
    label: "Bike",
    score: 84,
    window: "07h - 09h",
    summary: "Vento controlado antes do aquecimento do meio-dia.",
    signal: "boa janela",
    icon: Bike,
  },
  {
    id: "praia",
    position: 3,
    label: "Praia",
    score: 78,
    window: "09h - 11h",
    summary: "Sol firme com atencao ao indice UV depois das 11h.",
    signal: "vale cedo",
    icon: Waves,
  },
  {
    id: "treino",
    position: 4,
    label: "Treino",
    score: 72,
    window: "17h - 18h",
    summary: "Temperatura cai no fim da tarde e melhora conforto.",
    signal: "fim do dia",
    icon: Dumbbell,
  },
  {
    id: "jardim",
    position: 5,
    label: "Jardim",
    score: 66,
    window: "06h - 08h",
    summary: "Solo seco e vento fraco, mas pouca luz no inicio.",
    signal: "moderada",
    icon: SunMedium,
  },
  {
    id: "externo",
    position: 6,
    label: "Tarefas externas",
    score: 58,
    window: "14h - 16h",
    summary: "Calor e nuvens reduzem conforto para deslocamentos longos.",
    signal: "com cautela",
    icon: MapPin,
  },
];

interface CockpitRecentSearch {
  id: string;
  city: string;
  date: string;
  activityId: string;
  activityLabel: string;
  modeLabel: string;
}

const cockpitRecentSearches: CockpitRecentSearch[] = [
  {
    id: "sao-paulo-caminhada",
    city: "Sao Paulo, SP",
    date: "2026-06-26",
    activityId: "caminhada",
    activityLabel: "Caminhada",
    modeLabel: "Janela perfeita",
  },
  {
    id: "santos-bike",
    city: "Santos, SP",
    date: "2026-06-27",
    activityId: "bike",
    activityLabel: "Bike",
    modeLabel: "O que fazer hoje?",
  },
];

interface LeftControlPanelProps {
  onSearch: () => void;
}

interface ModePreviewPanelProps {
  activeMode: (typeof decisionModes)[number];
}

interface TodayRankingViewProps {
  hasResult: boolean;
}

interface PerfectWindowViewProps {
  hasResult: boolean;
}

function PerfectWindowView({ hasResult }: PerfectWindowViewProps) {
  const [selectedTimelineIndex, setSelectedTimelineIndex] = useState(2);
  const selectedPoint = perfectWindowTimeline[selectedTimelineIndex];

  if (!hasResult) {
    return (
      <section
        className="grid h-full min-h-0 place-items-center rounded-lg border border-white/10 bg-white/7 p-6 text-center"
        aria-label="Estado vazio Janela perfeita"
      >
        <div className="max-w-xl">
          <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-xl border border-weather-accent/45 bg-weather-accent/12 shadow-weather-glow">
            <Sparkles className="size-7 text-weather-accent" aria-hidden="true" />
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-weather-accent">
            Cockpit pronto
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            Preencha cidade, atividade e data
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            A melhor janela aparece aqui com score, horario, confianca, motivos
            climaticos, estatisticas e timeline em uma unica tela.
          </p>
          <div className="mt-6 grid gap-2 sm:grid-cols-3">
            {["Cidade", "Atividade", "Data"].map((item) => (
              <div
                key={item}
                className="rounded-lg border border-white/10 bg-slate-950/28 px-4 py-3"
              >
                <p className="text-sm font-semibold text-slate-100">{item}</p>
                <p className="mt-1 text-xs text-slate-400">necessario</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="grid h-full min-h-0 gap-4 lg:grid-rows-[minmax(0,1fr)_auto]"
      aria-label="MainPanel Janela perfeita"
    >
      <div className="grid min-h-0 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
        <div className="grid min-h-0 rounded-lg border border-white/10 bg-white/7 p-4 lg:grid-cols-[210px_minmax(0,1fr)] lg:items-center">
          <div className="flex items-center justify-center">
            <ScoreRing score={86} className="w-44 sm:w-48" />
          </div>
          <div className="min-w-0 space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-weather-accent">
              Melhor janela para
            </p>
            <h2 className="text-3xl font-semibold leading-tight">Caminhada</h2>
            <p className="text-5xl font-semibold leading-none text-slate-50">
              09h - 11h
            </p>
            <div className="inline-flex h-8 items-center gap-2 rounded-md border border-success/35 bg-success/10 px-3 text-sm font-semibold text-success">
              <ShieldCheck className="size-4" aria-hidden="true" />
              Confianca alta
            </div>
            <div className="flex flex-wrap gap-2">
              {perfectWindowReasons.map((reason) => (
                <span
                  key={reason}
                  className="rounded-md border border-weather-accent/30 bg-weather-accent/10 px-2.5 py-1 text-xs font-medium text-weather-accent"
                >
                  {reason}
                </span>
              ))}
            </div>
          </div>
        </div>

        <aside
          className="grid min-h-0 gap-3 rounded-lg border border-white/10 bg-slate-950/24 p-3 sm:grid-cols-2"
          aria-label="Estatisticas climaticas"
        >
          {perfectWindowStats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-lg border border-white/10 bg-white/7 p-3"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs text-slate-400">{stat.label}</p>
                  <Icon className="size-4 text-weather-accent" aria-hidden="true" />
                </div>
                <p className="text-xl font-semibold text-slate-50">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-slate-400">{stat.detail}</p>
              </div>
            );
          })}
        </aside>
      </div>

      <section
        className="rounded-lg border border-white/10 bg-white/7 p-3"
        aria-label="Timeline Janela perfeita"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-weather-accent">
              Timeline
            </p>
            <h3 className="text-sm font-semibold">
              {selectedPoint.time}: score {selectedPoint.score}/100
            </h3>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              aria-label="Horario anterior"
              onClick={() =>
                setSelectedTimelineIndex((index) => Math.max(0, index - 1))
              }
              className="flex size-8 items-center justify-center rounded-md border border-white/12 bg-slate-950/30 text-slate-200 transition hover:border-weather-accent/45 hover:text-weather-accent focus-visible:ring-2 focus-visible:ring-weather-accent focus-visible:outline-none"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Proximo horario"
              onClick={() =>
                setSelectedTimelineIndex((index) =>
                  Math.min(perfectWindowTimeline.length - 1, index + 1),
                )
              }
              className="flex size-8 items-center justify-center rounded-md border border-white/12 bg-slate-950/30 text-slate-200 transition hover:border-weather-accent/45 hover:text-weather-accent focus-visible:ring-2 focus-visible:ring-weather-accent focus-visible:outline-none"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {perfectWindowTimeline.map((point, index) => {
            const isSelected = index === selectedTimelineIndex;
            const isBest = point.score >= 86;

            return (
              <button
                key={point.time}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedTimelineIndex(index)}
                className={`grid h-20 min-w-0 content-end rounded-md border p-2 text-left transition focus-visible:ring-2 focus-visible:ring-weather-accent focus-visible:outline-none ${
                  isSelected
                    ? "border-weather-accent/60 bg-weather-accent/14 shadow-weather-glow"
                    : "border-white/10 bg-slate-950/22 hover:border-white/25"
                }`}
              >
                <span
                  className={`mb-1 rounded-sm ${
                    isBest ? "bg-weather-accent" : "bg-slate-500"
                  }`}
                  style={{ height: `${Math.max(20, point.score - 24)}px` }}
                  aria-hidden="true"
                />
                <span className="flex items-center justify-between gap-1 text-xs">
                  <span>{point.time}</span>
                  <span className="font-semibold text-slate-50">
                    {point.score}
                  </span>
                </span>
                <span className="truncate text-[10px] text-slate-400">
                  {point.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </section>
  );
}

function TodayRankingView({ hasResult }: TodayRankingViewProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 3;
  const totalPages = Math.ceil(todayRankingCards.length / pageSize);
  const firstCardIndex = pageIndex * pageSize;
  const visibleCards = todayRankingCards.slice(
    firstCardIndex,
    firstCardIndex + pageSize,
  );
  const bestActivity = todayRankingCards[0];
  const BestIcon = bestActivity.icon;

  return (
    <section
      className="grid h-full min-h-0 gap-4 lg:grid-cols-[minmax(0,1fr)_260px]"
      aria-label="MainPanel O que fazer hoje"
    >
      <div className="grid min-h-0 gap-4 lg:grid-rows-[minmax(150px,0.45fr)_minmax(0,1fr)]">
        <section className="grid min-h-0 gap-4 rounded-lg border border-weather-accent/35 bg-weather-accent/10 p-4 shadow-weather-glow lg:grid-cols-[minmax(0,1fr)_170px] lg:items-center">
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-weather-accent">
              <Trophy className="size-4" aria-hidden="true" />
              Mais recomendada
            </div>
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-weather-accent/45 bg-slate-950/28">
                <BestIcon className="size-5 text-weather-accent" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-3xl font-semibold leading-tight">
                  {bestActivity.label}
                </h2>
                <p className="mt-1 text-sm text-slate-300">
                  {bestActivity.window} · {bestActivity.summary}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-slate-950/30 p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
              Score do dia
            </p>
            <p className="mt-1 text-5xl font-semibold leading-none text-slate-50">
              {bestActivity.score}
            </p>
            <p className="mt-2 text-xs font-semibold text-success">
              {bestActivity.signal}
            </p>
          </div>
        </section>

        <section
          className="grid min-h-0 gap-3 rounded-lg border border-white/10 bg-white/7 p-3"
          aria-label="Ranking de atividades do dia"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-weather-accent">
                Ranking compacto
              </p>
              <h3 className="truncate text-sm font-semibold">
                Pagina {pageIndex + 1} de {totalPages}
              </h3>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                aria-label="Atividades anteriores"
                disabled={pageIndex === 0}
                onClick={() => setPageIndex((index) => Math.max(0, index - 1))}
                className="flex size-8 items-center justify-center rounded-md border border-white/12 bg-slate-950/30 text-slate-200 transition hover:border-weather-accent/45 hover:text-weather-accent disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-weather-accent focus-visible:outline-none"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Proximas atividades"
                disabled={pageIndex === totalPages - 1}
                onClick={() =>
                  setPageIndex((index) => Math.min(totalPages - 1, index + 1))
                }
                className="flex size-8 items-center justify-center rounded-md border border-white/12 bg-slate-950/30 text-slate-200 transition hover:border-weather-accent/45 hover:text-weather-accent disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-weather-accent focus-visible:outline-none"
              >
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <ol className="grid min-h-0 gap-3 md:grid-cols-3">
            {visibleCards.map((activity) => {
              const Icon = activity.icon;
              const isBest = activity.position === 1;

              return (
                <li
                  key={activity.id}
                  className={`grid min-h-[142px] gap-3 rounded-lg border p-3 ${
                    isBest
                      ? "border-weather-accent/45 bg-weather-accent/12"
                      : "border-white/10 bg-slate-950/24"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-white/12 bg-white/8">
                        <Icon className="size-4 text-weather-accent" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {activity.position}. {activity.label}
                        </p>
                        <p className="text-xs text-slate-400">
                          {activity.window}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-md border border-success/35 bg-success/10 px-2 py-1 text-xs font-semibold text-success">
                      {activity.score}
                    </span>
                  </div>
                  <p className="text-xs leading-5 text-slate-300">
                    {activity.summary}
                  </p>
                  <p className="mt-auto text-[11px] font-semibold uppercase tracking-[0.12em] text-weather-accent">
                    {activity.signal}
                  </p>
                </li>
              );
            })}
          </ol>

          <div className="flex justify-center gap-1.5" aria-label="Paginacao do ranking">
            {Array.from({ length: totalPages }, (_, index) => (
              <span
                key={index}
                className={`h-1.5 rounded-full transition-all ${
                  index === pageIndex
                    ? "w-6 bg-weather-accent"
                    : "w-2 bg-white/25"
                }`}
              />
            ))}
          </div>
        </section>
      </div>

      <aside className="grid min-h-0 gap-3 lg:grid-rows-[1fr_auto]">
        <section className="rounded-lg border border-white/10 bg-slate-950/24 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-weather-accent">
            Resumo curto
          </p>
          <div className="mt-4 grid gap-3">
            {[
              ["Cidade", "Sao Paulo, SP"],
              ["Data", "Hoje"],
              ["Atividades", `${todayRankingCards.length} analisadas`],
              ["Criterio", hasResult ? "Busca simulada" : "Preview estatico"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-lg border border-white/10 bg-white/7 px-3 py-2"
              >
                <p className="text-[11px] text-slate-400">{label}</p>
                <p className="truncate text-sm font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </section>
        <button
          type="button"
          className="flex h-10 items-center justify-center gap-2 rounded-md border border-weather-accent/45 bg-weather-accent/12 px-3 text-sm font-semibold text-weather-accent transition hover:bg-weather-accent/18 focus-visible:ring-2 focus-visible:ring-weather-accent focus-visible:outline-none"
        >
          <Share2 className="size-4" aria-hidden="true" />
          Compartilhar ranking
        </button>
      </aside>
    </section>
  );
}

function ModePreviewPanel({ activeMode }: ModePreviewPanelProps) {
  const ActiveModeIcon = activeMode.icon;

  return (
    <section
      className="grid h-full min-h-0 rounded-lg border border-white/10 bg-white/7 p-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center"
      aria-label="MainPanel modo auxiliar"
    >
      <div className="mx-auto flex aspect-square max-h-[220px] w-full max-w-[220px] items-center justify-center rounded-full border border-weather-accent/40 bg-weather-accent/10 shadow-weather-glow">
        <div className="text-center">
          <p className="text-5xl font-semibold leading-none">
            {activeMode.metric}
          </p>
          <p className="mt-2 text-sm text-slate-300">protagonista</p>
        </div>
      </div>
      <div className="grid gap-3">
        <div className="rounded-lg border border-white/10 bg-slate-950/24 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-100">
            <ActiveModeIcon className="size-4 text-weather-accent" aria-hidden="true" />
            Conteudo muda dentro do MainPanel
          </div>
          <p className="text-sm leading-6 text-slate-300">
            {activeMode.description}
          </p>
        </div>
      </div>
    </section>
  );
}

function LeftControlPanel({ onSearch }: LeftControlPanelProps) {
  const [cityValue, setCityValue] = useState("Sao Paulo, SP");
  const [dateValue, setDateValue] = useState("2026-06-26");
  const [selectedActivityId, setSelectedActivityId] = useState(
    activityCards[0].id,
  );
  const [recentSearches, setRecentSearches] = useState(cockpitRecentSearches);
  const [recentPanelOpen, setRecentPanelOpen] = useState(false);

  function handleRecentSearchSelect(search: CockpitRecentSearch) {
    setCityValue(search.city);
    setDateValue(search.date);
    setSelectedActivityId(search.activityId);
    setRecentPanelOpen(false);
  }

  return (
    <aside
      className="glass-card relative flex min-h-0 flex-col rounded-xl p-2.5"
      aria-label="LeftControlPanel"
    >
      <div className="mb-1.5 flex shrink-0 items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-weather-accent">
            Painel de controle
          </p>
          <h2 className="truncate text-lg font-semibold">Sua consulta</h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            aria-expanded={recentPanelOpen}
            aria-controls="cockpit-recent-searches"
            onClick={() => setRecentPanelOpen((isOpen) => !isOpen)}
            className="inline-flex h-8 items-center gap-2 rounded-md border border-white/12 bg-slate-950/28 px-2.5 text-xs font-semibold text-slate-200 transition hover:border-weather-accent/45 hover:text-weather-accent focus-visible:ring-2 focus-visible:ring-weather-accent focus-visible:outline-none"
          >
            <History className="size-3.5" aria-hidden="true" />
            Recentes
            <span className="rounded-full bg-weather-accent/18 px-1.5 py-0.5 text-[10px] leading-none text-weather-accent">
              {recentSearches.length}
            </span>
          </button>
          <span className="flex size-9 items-center justify-center rounded-md border border-weather-accent/45 bg-weather-accent/12">
            <Search className="size-4 text-weather-accent" aria-hidden="true" />
          </span>
        </div>
      </div>

      {recentPanelOpen ? (
        <section
          id="cockpit-recent-searches"
          aria-label="Buscas recentes"
          className="absolute top-[4.25rem] right-3 left-3 z-20 rounded-lg border border-weather-accent/35 bg-slate-950/95 p-3 shadow-weather-glow backdrop-blur-md"
        >
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">Buscas recentes</h3>
              <p className="text-[11px] text-slate-400">
                Atalhos deste cockpit
              </p>
            </div>
            <button
              type="button"
              disabled={recentSearches.length === 0}
              onClick={() => setRecentSearches([])}
              className="inline-flex h-7 items-center gap-1.5 rounded-md border border-white/12 px-2 text-[11px] font-semibold text-slate-300 transition hover:border-danger/45 hover:text-danger disabled:cursor-not-allowed disabled:opacity-45 focus-visible:ring-2 focus-visible:ring-weather-accent focus-visible:outline-none"
            >
              <Trash2 className="size-3" aria-hidden="true" />
              Limpar
            </button>
          </div>

          {recentSearches.length > 0 ? (
            <div className="grid gap-2">
              {recentSearches.map((search) => (
                <button
                  key={search.id}
                  type="button"
                  onClick={() => handleRecentSearchSelect(search)}
                  className="grid min-h-12 gap-1 rounded-md border border-white/10 bg-white/7 p-2 text-left transition hover:border-weather-accent/45 hover:bg-weather-accent/10 focus-visible:ring-2 focus-visible:ring-weather-accent focus-visible:outline-none"
                >
                  <span className="flex min-w-0 items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold text-slate-100">
                      {search.city}
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-weather-accent">
                      <RotateCcw className="size-3" aria-hidden="true" />
                      Repetir
                    </span>
                  </span>
                  <span className="truncate text-[11px] text-slate-400">
                    {search.modeLabel} - {search.activityLabel} - {search.date}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="rounded-md border border-white/10 bg-white/7 p-3 text-xs text-slate-400">
              Nenhuma busca recente.
            </p>
          )}
        </section>
      ) : null}

      <form
        className="flex h-full min-h-0 flex-col gap-1.5"
        onSubmit={(event) => {
          event.preventDefault();
          onSearch();
        }}
      >
        <section className="rounded-lg border border-white/10 bg-white/7 p-2">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-weather-accent/18 text-[11px] font-semibold text-weather-accent">
              1
            </span>
            <h3 className="flex items-center gap-1.5 text-sm font-semibold">
              <MapPin className="size-3.5 text-weather-accent" aria-hidden="true" />
              Onde?
            </h3>
          </div>
          <label className="grid gap-1 text-xs font-medium text-slate-300">
            Cidade
            <input
              type="text"
              value={cityValue}
              onChange={(event) => setCityValue(event.target.value)}
              className="h-7 rounded-md border border-white/12 bg-slate-950/35 px-2.5 text-sm text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-weather-accent focus:ring-2 focus:ring-weather-accent/25"
            />
          </label>
          <button
            type="button"
            className="mt-1.5 inline-flex h-7 w-full items-center justify-center gap-2 rounded-md border border-weather-accent/35 bg-weather-accent/10 text-xs font-semibold text-weather-accent transition hover:bg-weather-accent/16 focus-visible:ring-2 focus-visible:ring-weather-accent focus-visible:outline-none"
          >
            <LocateFixed className="size-3.5" aria-hidden="true" />
            Usar localização atual
          </button>
        </section>

        <section className="rounded-lg border border-white/10 bg-white/7 p-2">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-weather-accent/18 text-[11px] font-semibold text-weather-accent">
              2
            </span>
            <h3 className="text-sm font-semibold">Quando?</h3>
          </div>
          <label className="grid gap-1 text-xs font-medium text-slate-300">
            Data
            <span className="relative">
              <CalendarDays
                className="pointer-events-none absolute top-2 left-2.5 size-3.5 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="date"
                value={dateValue}
                onChange={(event) => setDateValue(event.target.value)}
                className="h-7 w-full rounded-md border border-white/12 bg-slate-950/35 px-2.5 pl-8 text-sm text-slate-50 outline-none transition focus:border-weather-accent focus:ring-2 focus:ring-weather-accent/25"
              />
            </span>
          </label>
          <details className="group mt-1.5 rounded-md border border-white/10 bg-slate-950/20 p-1.5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-xs font-semibold text-slate-200">
              <span>Disponibilidade opcional</span>
              <Clock3 className="size-3.5 text-weather-accent" aria-hidden="true" />
            </summary>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="grid gap-1 text-xs font-medium text-slate-300">
                De
                <input
                  type="time"
                  defaultValue="08:00"
                  className="h-7 rounded-md border border-white/12 bg-slate-950/35 px-2 text-sm text-slate-50 outline-none focus:border-weather-accent focus:ring-2 focus:ring-weather-accent/25"
                />
              </label>
              <label className="grid gap-1 text-xs font-medium text-slate-300">
                Até
                <input
                  type="time"
                  defaultValue="18:00"
                  className="h-7 rounded-md border border-white/12 bg-slate-950/35 px-2 text-sm text-slate-50 outline-none focus:border-weather-accent focus:ring-2 focus:ring-weather-accent/25"
                />
              </label>
            </div>
          </details>
        </section>

        <section className="rounded-lg border border-white/10 bg-white/7 p-2">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-weather-accent/18 text-[11px] font-semibold text-weather-accent">
              3
            </span>
            <h3 className="text-sm font-semibold">O que você quer fazer?</h3>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {activityCards.map((activity) => {
              const Icon = activity.icon;
              const isSelected = activity.id === selectedActivityId;

              return (
                <button
                  key={activity.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedActivityId(activity.id)}
                  className={`grid h-11 min-w-0 place-items-center gap-0.5 rounded-md border p-1.5 text-center transition focus-visible:ring-2 focus-visible:ring-weather-accent focus-visible:outline-none ${
                    isSelected
                      ? "border-weather-accent/65 bg-weather-accent/16 text-weather-accent"
                      : "border-white/10 bg-slate-950/22 text-slate-200 hover:border-white/25"
                  }`}
                >
                  <span className="flex min-w-0 flex-col items-center gap-0.5 text-[11px] font-semibold leading-tight">
                    <Icon className="size-3 shrink-0" aria-hidden="true" />
                    <span className="truncate">{activity.label}</span>
                  </span>
                  <span className="text-[10px] leading-none text-slate-400">
                    {activity.detail}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <button
          type="submit"
          className="glow-primary mt-auto flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-weather-accent px-3 text-sm font-semibold text-slate-950 transition hover:bg-weather-accent/90 focus-visible:ring-2 focus-visible:ring-weather-accent focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none"
        >
          <Search className="size-4" aria-hidden="true" />
          Encontrar janela
        </button>
      </form>
    </aside>
  );
}

export default function Home() {
  const [activeModeId, setActiveModeId] = useState(decisionModes[0].id);
  const [hasPerfectWindowResult, setHasPerfectWindowResult] = useState(false);
  const activeMode =
    decisionModes.find((mode) => mode.id === activeModeId) ?? decisionModes[0];

  return (
    <>
      <WeatherStage variant="night" />
      <main className="relative z-10 min-h-screen px-4 py-3 text-slate-50 lg:h-screen">
        <div className="mx-auto grid h-full w-full max-w-[1400px] gap-2 lg:grid-rows-[3.5rem_3.25rem_minmax(0,1fr)_5.75rem_1.25rem]">
          <header className="glass-panel flex min-h-0 items-center justify-between gap-5 rounded-xl px-5 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="glow-primary flex size-11 shrink-0 items-center justify-center rounded-lg border border-weather-accent/55 bg-weather-card">
                <CloudSun
                  className="size-5 text-weather-accent"
                  aria-hidden="true"
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-weather-accent">
                  Clima por decisao
                </p>
                <h1 className="truncate text-2xl font-semibold">
                  Janela Perfeita
                </h1>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden h-8 items-center gap-2 rounded-md border border-success/35 bg-success/10 px-3 text-xs font-medium text-success lg:inline-flex">
                <LocateFixed className="size-3.5" aria-hidden="true" />
                Open-Meteo
              </span>
              <span className="hidden h-8 items-center rounded-md border border-weather-accent/40 bg-weather-card px-3 text-xs font-medium text-weather-accent sm:inline-flex">
                Previsao por hora
              </span>
              <Link
                href="/como-funciona"
                className="inline-flex size-9 items-center justify-center rounded-md border border-white/15 bg-white/8 text-slate-200 transition hover:border-weather-accent/50 hover:text-weather-accent focus-visible:ring-2 focus-visible:ring-weather-accent focus-visible:outline-none"
                aria-label="Como funciona"
              >
                <CircleHelp className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </header>

          <nav
            className="glass-panel flex min-h-0 items-center gap-2 rounded-xl p-2"
            aria-label="ModeBar"
          >
            {decisionModes.map((mode) => {
              const Icon = mode.icon;
              const isActive = mode.id === activeMode.id;

              return (
                <button
                  key={mode.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActiveModeId(mode.id)}
                  className={`flex h-full min-w-0 flex-1 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition ${
                    isActive
                      ? "border-weather-accent/60 bg-weather-accent/18 text-weather-accent shadow-weather-glow"
                      : "border-white/10 bg-white/7 text-slate-300 hover:border-white/25 hover:bg-white/10"
                  }`}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{mode.label}</span>
                </button>
              );
            })}
          </nav>

          <section className="grid min-h-0 gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
            <LeftControlPanel onSearch={() => setHasPerfectWindowResult(true)} />

            <section
              className="glass-card grid min-h-0 rounded-xl p-4"
              aria-label="MainPanel"
            >
              {activeMode.id === "janela-perfeita" ? (
                <PerfectWindowView hasResult={hasPerfectWindowResult} />
              ) : activeMode.id === "fazer-hoje" ? (
                <TodayRankingView hasResult={hasPerfectWindowResult} />
              ) : (
                <ModePreviewPanel activeMode={activeMode} />
              )}
            </section>
          </section>

          <section
            className="glass-panel grid min-h-0 gap-3 rounded-xl p-3 lg:grid-cols-[180px_minmax(0,1fr)]"
            aria-label="BottomForecastStrip placeholder"
          >
            <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/7 px-4">
              <Sparkles
                className="size-5 text-weather-accent"
                aria-hidden="true"
              />
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-weather-accent">
                  BottomStrip
                </p>
                <p className="text-sm font-semibold">Previsao futura</p>
              </div>
            </div>
            <div className="grid min-h-0 grid-cols-5 gap-3">
              {climateBlocks.map((block) => (
                <div
                  key={block.time}
                  className="flex min-w-0 flex-col justify-between rounded-lg border border-white/10 bg-white/7 p-3"
                >
                  <p className="text-xs text-slate-400">{block.time}</p>
                  <p className="truncate text-sm font-medium">{block.label}</p>
                  <p className="text-lg font-semibold text-weather-accent">
                    {block.value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <footer className="flex min-h-0 items-center justify-between gap-3 px-1 text-xs text-slate-400">
            <span>FooterHint: dados meteorologicos por Open-Meteo.</span>
            <span className="hidden sm:inline">Shell desktop T74.</span>
          </footer>
        </div>
      </main>
    </>
  );
}

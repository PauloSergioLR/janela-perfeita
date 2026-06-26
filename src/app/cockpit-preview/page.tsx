"use client";

import { useState } from "react";
import {
  Bike,
  CalendarDays,
  CircleHelp,
  Clock3,
  CloudSun,
  Compass,
  Dumbbell,
  Footprints,
  Gauge,
  LocateFixed,
  MapPin,
  Radar,
  Search,
  Sparkles,
  SunMedium,
  Waves,
} from "lucide-react";
import Link from "next/link";
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

function PlaceholderLine({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block rounded-full bg-white/12 ${className}`}
    />
  );
}

function LeftControlPanel() {
  const [selectedActivityId, setSelectedActivityId] = useState(
    activityCards[0].id,
  );

  return (
    <aside
      className="glass-card flex min-h-0 flex-col rounded-xl p-3"
      aria-label="LeftControlPanel"
    >
      <div className="mb-2 flex shrink-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-weather-accent">
            Painel de controle
          </p>
          <h2 className="truncate text-lg font-semibold">Sua consulta</h2>
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-weather-accent/45 bg-weather-accent/12">
          <Search className="size-4 text-weather-accent" aria-hidden="true" />
        </span>
      </div>

      <form
        className="flex h-full min-h-0 flex-col gap-2"
        onSubmit={(event) => event.preventDefault()}
      >
        <section className="rounded-lg border border-white/10 bg-white/7 p-2.5">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-weather-accent/18 text-xs font-semibold text-weather-accent">
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
              defaultValue="São Paulo, SP"
              className="h-8 rounded-md border border-white/12 bg-slate-950/35 px-2.5 text-sm text-slate-50 outline-none transition placeholder:text-slate-500 focus:border-weather-accent focus:ring-2 focus:ring-weather-accent/25"
            />
          </label>
          <button
            type="button"
            className="mt-2 inline-flex h-8 w-full items-center justify-center gap-2 rounded-md border border-weather-accent/35 bg-weather-accent/10 text-xs font-semibold text-weather-accent transition hover:bg-weather-accent/16 focus-visible:ring-2 focus-visible:ring-weather-accent focus-visible:outline-none"
          >
            <LocateFixed className="size-3.5" aria-hidden="true" />
            Usar localização atual
          </button>
        </section>

        <section className="rounded-lg border border-white/10 bg-white/7 p-2.5">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-weather-accent/18 text-xs font-semibold text-weather-accent">
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
                defaultValue="2026-06-26"
                className="h-8 w-full rounded-md border border-white/12 bg-slate-950/35 px-2.5 pl-8 text-sm text-slate-50 outline-none transition focus:border-weather-accent focus:ring-2 focus:ring-weather-accent/25"
              />
            </span>
          </label>
          <details className="group mt-2 rounded-md border border-white/10 bg-slate-950/20 p-2">
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
                  className="h-8 rounded-md border border-white/12 bg-slate-950/35 px-2 text-sm text-slate-50 outline-none focus:border-weather-accent focus:ring-2 focus:ring-weather-accent/25"
                />
              </label>
              <label className="grid gap-1 text-xs font-medium text-slate-300">
                Até
                <input
                  type="time"
                  defaultValue="18:00"
                  className="h-8 rounded-md border border-white/12 bg-slate-950/35 px-2 text-sm text-slate-50 outline-none focus:border-weather-accent focus:ring-2 focus:ring-weather-accent/25"
                />
              </label>
            </div>
          </details>
        </section>

        <section className="rounded-lg border border-white/10 bg-white/7 p-2.5">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-weather-accent/18 text-xs font-semibold text-weather-accent">
              3
            </span>
            <h3 className="text-sm font-semibold">O que você quer fazer?</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {activityCards.map((activity) => {
              const Icon = activity.icon;
              const isSelected = activity.id === selectedActivityId;

              return (
                <button
                  key={activity.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedActivityId(activity.id)}
                  className={`grid min-h-12 gap-1 rounded-md border p-2 text-left transition focus-visible:ring-2 focus-visible:ring-weather-accent focus-visible:outline-none ${
                    isSelected
                      ? "border-weather-accent/65 bg-weather-accent/16 text-weather-accent"
                      : "border-white/10 bg-slate-950/22 text-slate-200 hover:border-white/25"
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-xs font-semibold">
                    <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{activity.label}</span>
                  </span>
                  <span className="text-[11px] leading-none text-slate-400">
                    {activity.detail}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <button
          type="submit"
          className="glow-primary mt-auto flex h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-weather-accent px-3 text-sm font-semibold text-slate-950 transition hover:bg-weather-accent/90 focus-visible:ring-2 focus-visible:ring-weather-accent focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none"
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
  const activeMode =
    decisionModes.find((mode) => mode.id === activeModeId) ?? decisionModes[0];
  const ActiveModeIcon = activeMode.icon;

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
            <LeftControlPanel />

            <section
              className="glass-card grid min-h-0 rounded-xl p-4 lg:grid-rows-[auto_minmax(0,1fr)]"
              aria-label="MainPanel placeholder"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-weather-accent">
                    {activeMode.eyebrow}
                  </p>
                  <h2 className="text-xl font-semibold">{activeMode.title}</h2>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-weather-accent/40 bg-weather-accent/12 px-3 py-2 text-weather-accent">
                  <ActiveModeIcon className="size-5" aria-hidden="true" />
                  <span className="text-sm font-semibold">
                    {activeMode.metric}
                  </span>
                </div>
              </div>
              <div className="grid min-h-0 items-center gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <div className="mx-auto flex aspect-square max-h-[250px] w-full max-w-[250px] items-center justify-center rounded-full border border-weather-accent/40 bg-weather-accent/10 shadow-weather-glow">
                  <div className="text-center">
                    <p className="text-6xl font-semibold leading-none">
                      {activeMode.metric}
                    </p>
                    <p className="mt-2 text-sm text-slate-300">protagonista</p>
                  </div>
                </div>
                <div className="grid gap-3">
                  <div className="rounded-lg border border-white/10 bg-white/7 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-100">
                      <Gauge
                        className="size-4 text-weather-accent"
                        aria-hidden="true"
                      />
                      Conteudo muda dentro do MainPanel
                    </div>
                    <p className="text-sm leading-6 text-slate-300">
                      {activeMode.description}
                    </p>
                    <PlaceholderLine className="mt-3 h-2 w-full" />
                    <PlaceholderLine className="mt-2 h-2 w-5/6" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {["Chuva", "Vento", "UV"].map((item) => (
                      <div
                        key={item}
                        className="rounded-lg border border-white/10 bg-white/7 p-3"
                      >
                        <p className="text-xs text-slate-400">{item}</p>
                        <PlaceholderLine className="mt-3 h-2 w-3/4" />
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/7 p-3">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                      <Compass
                        className="size-4 text-weather-accent"
                        aria-hidden="true"
                      />
                      Timeline placeholder
                    </div>
                    <div className="grid grid-cols-8 gap-2">
                      {Array.from({ length: 8 }, (_, index) => (
                        <span
                          key={index}
                          aria-hidden="true"
                          className="h-10 rounded-md bg-white/10"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
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

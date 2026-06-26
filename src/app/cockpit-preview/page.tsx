import {
  CircleHelp,
  CloudSun,
  Compass,
  Gauge,
  Layers,
  PanelLeft,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { WeatherStage } from "@/components/weather/weather-stage";

const decisionModes = [
  "Janela perfeita",
  "O que fazer hoje?",
  "Consulta do dia",
  "Consulta da semana",
];

const controlSteps = ["Local", "Atividade", "Periodo"];

const climateBlocks = [
  { time: "06h", label: "Ceu limpo", value: "18C" },
  { time: "09h", label: "Brisa leve", value: "21C" },
  { time: "12h", label: "Sol forte", value: "26C" },
  { time: "15h", label: "Nuvens", value: "24C" },
  { time: "18h", label: "Vento baixo", value: "20C" },
];

function PlaceholderLine({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block rounded-full bg-white/12 ${className}`}
    />
  );
}

export default function Home() {
  return (
    <>
      <WeatherStage variant="night" />
      <main className="relative z-10 min-h-screen px-4 py-4 text-slate-50 lg:h-screen lg:overflow-clip">
        <div className="mx-auto grid h-full w-full max-w-[1400px] gap-3 lg:grid-rows-[4.5rem_4rem_minmax(0,1fr)_8.25rem_1.75rem]">
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
              <span className="hidden h-8 items-center rounded-md border border-success/35 bg-success/10 px-3 text-xs font-medium text-success md:inline-flex">
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
            {decisionModes.map((mode, index) => (
              <button
                key={mode}
                type="button"
                className={`flex h-full min-w-0 flex-1 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition ${
                  index === 0
                    ? "border-weather-accent/60 bg-weather-accent/18 text-weather-accent shadow-weather-glow"
                    : "border-white/10 bg-white/7 text-slate-300 hover:border-white/25 hover:bg-white/10"
                }`}
              >
                <Layers className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{mode}</span>
              </button>
            ))}
          </nav>

          <section className="grid min-h-0 gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
            <aside
              className="glass-card flex min-h-0 flex-col rounded-xl p-4"
              aria-label="LeftPanel placeholder"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-weather-accent">
                    LeftPanel placeholder
                  </p>
                  <h2 className="text-lg font-semibold">Controle futuro</h2>
                </div>
                <PanelLeft className="size-5 text-weather-accent" aria-hidden="true" />
              </div>
              <div className="grid flex-1 content-between gap-3">
                {controlSteps.map((step, index) => (
                  <div
                    key={step}
                    className="rounded-lg border border-white/10 bg-white/7 p-3"
                  >
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                      <span className="flex size-6 items-center justify-center rounded-md bg-weather-accent/18 text-xs text-weather-accent">
                        {index + 1}
                      </span>
                      {step}
                    </div>
                    <PlaceholderLine className="h-2 w-5/6" />
                    <PlaceholderLine className="mt-2 h-2 w-2/3" />
                  </div>
                ))}
              </div>
              <div className="glow-primary mt-4 flex h-11 items-center justify-center rounded-md bg-weather-accent text-sm font-semibold text-slate-950">
                CTA placeholder
              </div>
            </aside>

            <section
              className="glass-card grid min-h-0 rounded-xl p-4 lg:grid-rows-[auto_minmax(0,1fr)]"
              aria-label="MainPanel placeholder"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-weather-accent">
                    MainPanel placeholder
                  </p>
                  <h2 className="text-xl font-semibold">Resultado futuro</h2>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-weather-accent/40 bg-weather-accent/12 px-3 py-2 text-weather-accent">
                  <Gauge className="size-5" aria-hidden="true" />
                  <span className="text-sm font-semibold">Score</span>
                </div>
              </div>
              <div className="grid min-h-0 items-center gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                <div className="mx-auto flex aspect-square max-h-[250px] w-full max-w-[250px] items-center justify-center rounded-full border border-weather-accent/40 bg-weather-accent/10 shadow-weather-glow">
                  <div className="text-center">
                    <p className="text-6xl font-semibold leading-none">86</p>
                    <p className="mt-2 text-sm text-slate-300">protagonista</p>
                  </div>
                </div>
                <div className="grid gap-3">
                  <div className="rounded-lg border border-white/10 bg-white/7 p-4">
                    <PlaceholderLine className="h-3 w-4/5" />
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
                      <Compass className="size-4 text-weather-accent" aria-hidden="true" />
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
              <Sparkles className="size-5 text-weather-accent" aria-hidden="true" />
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

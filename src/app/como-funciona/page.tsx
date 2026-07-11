import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CalendarRange,
  CloudSun,
  Gauge,
  ListChecks,
  MapPin,
  ShieldCheck,
  Sparkles,
  Timer,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { WeatherStage } from "@/components/weather/weather-stage";
import { getAllActivities } from "@/lib/domain/activities";
import { buildScoreExplainerActivities } from "@/lib/ui/score-explainer";

export const metadata: Metadata = {
  title: "Como funciona | Janela Perfeita",
  description:
    "Entenda os quatro modos, os dados meteorológicos, o score e a privacidade do Janela Perfeita.",
};

const MODES = [
  {
    title: "Janela perfeita",
    description:
      "Escolha cidade, data, disponibilidade opcional e atividade. O sistema calcula a melhor janela e apresenta score, confiança e motivos.",
    icon: Sparkles,
  },
  {
    title: "O que fazer hoje?",
    description:
      "Compara as atividades disponíveis, monta um ranking e destaca quais combinam melhor com o clima do dia.",
    icon: ListChecks,
  },
  {
    title: "Consulta do dia",
    description:
      "Reúne resumo climático, estatísticas e timeline das 24 horas, com navegação por todos os horários.",
    icon: CalendarDays,
  },
  {
    title: "Consulta da semana",
    description:
      "Compara os próximos dias, mostra condições, alertas e uma visão semanal para planejar com antecedência.",
    icon: CalendarRange,
  },
] as const;

const STEPS = [
  {
    title: "Score por hora",
    description:
      "Cada hora recebe uma nota de 0 a 100. A engine combina fatores meteorológicos com pesos próprios da atividade.",
    icon: Gauge,
  },
  {
    title: "Pesos por atividade",
    description:
      "Correr dá mais peso a conforto térmico; lavar carro pesa chuva; estrelas pesa noite e céu limpo.",
    icon: ListChecks,
  },
  {
    title: "Janelas consecutivas",
    description:
      "Horas acima do mínimo são agrupadas. A melhor janela considera média, pico, duração e início.",
    icon: Timer,
  },
  {
    title: "Confiança",
    description:
      "A estabilidade dentro da janela gera uma leitura de confiança alta, média ou baixa.",
    icon: ShieldCheck,
  },
] as const;

const LIMITATIONS = [
  "A recomendação depende de previsão meteorológica, então não promete precisão absoluta.",
  "O app não substitui avaliação local de chuva, vento, segurança ou restrições do lugar.",
  "Scores diferentes entre atividades são esperados, porque cada atividade tem pesos próprios.",
  "Quando não há janela boa, o app mostra o melhor horário isolado apenas para comparação.",
  "A recomendação é estimada e não substitui alertas meteorológicos oficiais.",
];

function formatDuration(hours: number): string {
  return hours === 1 ? "1 hora" : `${hours} horas`;
}

export default function ComoFuncionaPage() {
  const activities = buildScoreExplainerActivities(getAllActivities());

  return (
    <>
      <WeatherStage variant="clear" />
      <main className="relative z-10 min-h-screen px-4 py-5 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="glass-panel rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Voltar ao painel
            </Link>
            <ThemeToggle />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className="h-7 border-weather-accent/40 bg-weather-accent/10 px-3 text-weather-accent"
            >
              Quatro modos de decisão
            </Badge>
            <Badge
              variant="outline"
              className="h-7 border-success/40 bg-success/10 px-3 text-success"
            >
              Dados Open-Meteo
            </Badge>
          </div>
          <div className="mt-3 max-w-3xl space-y-2">
            <h1 className="text-3xl font-semibold tracking-normal text-slate-950 dark:text-slate-50 sm:text-4xl">
              Como funciona
            </h1>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
              Janela Perfeita transforma a previsão da Open-Meteo em decisões
              práticas, sem login e sem exigir criação de conta.
            </p>
          </div>
        </header>

        <section aria-labelledby="modos-title">
          <div className="mb-3">
            <h2 id="modos-title" className="text-xl font-semibold text-slate-950 dark:text-slate-50">
              Escolha como quer consultar
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Os quatro modos usam a mesma aplicação e os mesmos dados reais.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {MODES.map((mode) => {
              const Icon = mode.icon;

              return (
                <Card key={mode.title} className="glass-card rounded-xl">
                  <CardHeader>
                    <div className="flex size-9 items-center justify-center rounded-lg border border-weather-accent/35 bg-weather-accent/10 text-weather-accent">
                      <Icon className="size-4" aria-hidden="true" />
                    </div>
                    <CardTitle>{mode.title}</CardTitle>
                    <CardDescription className="leading-6">
                      {mode.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-3" aria-label="Dados, privacidade e acesso">
          <Card className="glass-card rounded-xl">
            <CardHeader>
              <CloudSun className="size-5 text-sky-300" aria-hidden="true" />
              <CardTitle>Fonte dos dados</CardTitle>
              <CardDescription className="leading-6">
                A previsão meteorológica e a busca de cidades usam somente a Open-Meteo.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="glass-card rounded-xl">
            <CardHeader>
              <ShieldCheck className="size-5 text-success" aria-hidden="true" />
              <CardTitle>Privacidade e acesso</CardTitle>
              <CardDescription className="leading-6">
                Não existe login. A localização só é usada após autorização; você também pode informar a cidade manualmente.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="glass-card rounded-xl">
            <CardHeader>
              <MapPin className="size-5 text-amber-300" aria-hidden="true" />
              <CardTitle>Condições locais</CardTitle>
              <CardDescription className="leading-6">
                Previsões mudam. Observe o local e consulte alertas oficiais antes de atividades sensíveis.
              </CardDescription>
            </CardHeader>
          </Card>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {STEPS.map((step) => {
            const Icon = step.icon;

            return (
              <Card
                key={step.title}
                className="glass-card rounded-xl"
              >
                <CardHeader>
                  <div className="flex size-9 items-center justify-center rounded-md bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-200">
                    <Icon className="size-4" aria-hidden="true" />
                  </div>
                  <CardTitle>{step.title}</CardTitle>
                  <CardDescription className="leading-6">
                    {step.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-50">
                Pesos por atividade
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Cada regra calcula uma nota própria. O peso define o impacto da
                regra no score final da hora.
              </p>
            </div>

            <div className="grid gap-3">
              {activities.map((activity) => (
                <Card
                  key={activity.id}
                  className="glass-card rounded-xl"
                >
                  <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle>{activity.name}</CardTitle>
                      <CardDescription className="leading-6">
                        {activity.shortDescription}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="h-7 px-3">
                        Mínimo {activity.minRecommendedScore}/100
                      </Badge>
                      <Badge variant="outline" className="h-7 px-3">
                        {formatDuration(activity.minDurationHours)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2">
                      {activity.rules.map((rule) => (
                        <div
                          key={`${activity.id}-${rule.factor}`}
                          className="grid gap-2 text-sm sm:grid-cols-[minmax(0,1fr)_minmax(170px,0.45fr)] sm:items-center"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-medium text-slate-950 dark:text-slate-50">
                              {rule.label}
                            </span>
                            <span className="text-muted-foreground">
                              Peso {rule.weight}
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-sky-600"
                              style={{ width: `${rule.weight}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <aside className="flex flex-col gap-4">
            <Card className="glass-card rounded-xl">
              <CardHeader>
                <CardTitle>Agrupamento de janelas</CardTitle>
                <CardDescription className="leading-6">
                  A engine ordena horas consecutivas que passam do score mínimo.
                  Depois escolhe a janela mais forte para a atividade.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm leading-6 text-muted-foreground">
                <p>1. Calcula score hora a hora.</p>
                <p>2. Remove horas abaixo do mínimo da atividade.</p>
                <p>3. Agrupa horas consecutivas suficientes.</p>
                <p>4. Ordena por média, pico, duração e início.</p>
              </CardContent>
            </Card>

            <Card className="glass-card rounded-xl">
              <CardHeader>
                <div className="flex items-start gap-2">
                  <AlertTriangle
                    className="mt-0.5 size-4 shrink-0 text-amber-700"
                    aria-hidden="true"
                  />
                  <div>
                    <CardTitle>Limitações</CardTitle>
                    <CardDescription>
                      Score ajuda decisão, mas continua sendo estimativa.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-2 text-sm leading-6 text-muted-foreground">
                  {LIMITATIONS.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </aside>
        </section>
      </div>
      </main>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Gauge,
  ListChecks,
  ShieldCheck,
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
import { getAllActivities } from "@/lib/domain/activities";
import { buildScoreExplainerActivities } from "@/lib/ui/score-explainer";

export const metadata: Metadata = {
  title: "Como funciona | Janela Perfeita",
  description:
    "Entenda os modos, o score, as janelas, a confiança, os dados e as limitações do Janela Perfeita.",
};

const MODES = [
  {
    title: "Janela perfeita",
    description:
      "Combina cidade, data, atividade e disponibilidade opcional para indicar a melhor janela, alternativas e motivos.",
  },
  {
    title: "O que fazer hoje?",
    description:
      "Compara as sete atividades para a cidade, a data e a disponibilidade escolhidas e monta um ranking.",
  },
  {
    title: "Consulta do dia",
    description:
      "Resume temperatura, chuva, vento, umidade, UV, luz solar e a timeline completa, sem exigir atividade.",
  },
  {
    title: "Consulta da semana",
    description:
      "Compara os próximos sete dias da cidade e destaca condições melhores, piores, mais chuvosas e extremas.",
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
      "Correr dá mais peso ao conforto térmico; lavar carro, à chuva; observar estrelas, à noite e à qualidade do céu.",
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
  "A recomendação depende de previsão meteorológica, que pode mudar, então não promete precisão absoluta.",
  "O app não substitui alertas meteorológicos oficiais nem avaliação local de chuva, vento, segurança ou restrições do lugar.",
  "Scores diferentes entre atividades são esperados, porque cada atividade tem pesos próprios.",
  "Quando não há janela boa, o app mostra o melhor horário isolado apenas para comparação.",
  "A confiança resume a estabilidade dentro da janela; não é uma probabilidade de acerto fornecida pela Open-Meteo.",
];

const RESULT_EXPLORATION = [
  "Resumo com score, melhor janela, confiança e motivos.",
  "Timeline horária, estatísticas climáticas e detalhamento dos fatores.",
  "Próximos dias, comparação semanal e alternativas quando disponíveis.",
  "Recomendações e rankings podem usar o compartilhamento nativo ou copiar um resumo em texto.",
  "Manifesto e ícones permitem instalar a experiência; consultas reais continuam dependentes de rede.",
] as const;

const DATA_DETAILS = [
  "A Open-Meteo é a única fonte climática e também atende à busca textual de cidades.",
  "O Nominatim/OpenStreetMap é usado somente para dar um nome aproximado às coordenadas autorizadas na localização atual.",
  "No modo demo, busca e previsão usam dados locais; a localização automática fica desligada, mas o acionamento manual ainda pode consultar o Nominatim.",
] as const;

const PRIVACY_DETAILS = [
  "A localização atual só é solicitada com permissão do navegador.",
  "Até cinco consultas recentes podem ficar no navegador, incluindo cidade, coordenadas associadas e preferências; a interface permite limpar esse histórico.",
  "Não há login, banco de dados ou histórico pessoal persistido no servidor.",
  "A preferência de tema também fica somente no navegador.",
] as const;

function formatDuration(hours: number): string {
  return hours === 1 ? "1 hora" : `${hours} horas`;
}

export default function ComoFuncionaPage() {
  const activities = buildScoreExplainerActivities(getAllActivities());

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_48%,#eef6f5_100%)] px-4 py-5 text-foreground dark:bg-[linear-gradient(180deg,#101b2b_0%,#172339_52%,#102525_100%)] sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="border-b border-border pb-5">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Voltar ao painel
          </Link>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className="h-7 border-sky-200 bg-sky-50 px-3 text-sky-900"
            >
              Engine de decisão
            </Badge>
            <Badge
              variant="outline"
              className="h-7 border-emerald-200 bg-emerald-50 px-3 text-emerald-800"
            >
              Score 0-100
            </Badge>
          </div>
          <div className="mt-3 max-w-3xl space-y-2">
            <h1 className="text-3xl font-semibold tracking-normal text-slate-950 dark:text-slate-50 sm:text-4xl">
              Como funciona o Janela Perfeita
            </h1>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
              Quatro modos transformam previsão por hora em recomendação,
              ranking ou panorama climático, sempre com contexto e limitações
              visíveis.
            </p>
          </div>
        </header>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-50">
              Quatro modos para perguntas diferentes
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              A cidade é sempre necessária. Data, atividade e disponibilidade
              aparecem apenas quando ajudam o modo escolhido.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {MODES.map((mode) => (
              <Card
                key={mode.title}
                className="rounded-lg border-border/80 bg-white shadow-sm dark:bg-card"
              >
                <CardHeader>
                  <CardTitle role="heading" aria-level={3}>
                    {mode.title}
                  </CardTitle>
                  <CardDescription className="leading-6">
                    {mode.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-50">
              Do dado à decisão
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              A API interna valida a consulta, normaliza a previsão da
              Open-Meteo e entrega o contexto necessário à engine.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {STEPS.map((step) => {
              const Icon = step.icon;

              return (
                <Card
                  key={step.title}
                  className="rounded-lg border-border/80 bg-white shadow-sm dark:bg-card"
                >
                  <CardHeader>
                    <div className="flex size-9 items-center justify-center rounded-md bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-200">
                      <Icon className="size-4" aria-hidden="true" />
                    </div>
                    <CardTitle role="heading" aria-level={3}>
                      {step.title}
                    </CardTitle>
                    <CardDescription className="leading-6">
                      {step.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
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
                  className="rounded-lg border-border/80 bg-white shadow-sm dark:bg-card"
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
            <Card className="rounded-lg border-border/80 bg-white shadow-sm dark:bg-card">
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

            <Card className="rounded-lg border-border/80 bg-white shadow-sm dark:bg-card">
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

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-50">
              Resultado, dados e privacidade
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              O cockpit mantém a decisão explorável e deixa claro de onde vêm
              os dados e o que permanece no navegador.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="rounded-lg border-border/80 bg-white shadow-sm dark:bg-card">
              <CardHeader>
                <CardTitle role="heading" aria-level={3}>
                  Depois do cálculo
                </CardTitle>
                <CardDescription>
                  O resultado continua explorável sem esconder a decisão
                  principal.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-2 text-sm leading-6 text-muted-foreground">
                  {RESULT_EXPLORATION.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="rounded-lg border-border/80 bg-white shadow-sm dark:bg-card">
              <CardHeader>
                <CardTitle role="heading" aria-level={3}>
                  Dados e geolocalização
                </CardTitle>
                <CardDescription>
                  Serviços externos têm papéis separados e transparentes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-2 text-sm leading-6 text-muted-foreground">
                  {DATA_DETAILS.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="rounded-lg border-border/80 bg-white shadow-sm dark:bg-card">
              <CardHeader>
                <CardTitle role="heading" aria-level={3}>
                  Privacidade
                </CardTitle>
                <CardDescription>
                  Sem conta e sem histórico remoto de consultas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-2 text-sm leading-6 text-muted-foreground">
                  {PRIVACY_DETAILS.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}

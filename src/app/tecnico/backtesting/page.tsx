import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  buildSampleBacktestDays,
  sampleBacktestCity,
} from "@/lib/backtesting/sample-weather-backtest";
import { runWeatherBacktest } from "@/lib/backtesting/weather-backtesting";
import { getActivityById } from "@/lib/domain/activities";

export const metadata: Metadata = {
  title: "Backtesting | Janela Perfeita",
  description: "Relatório técnico de backtesting das recomendações.",
};

function formatPercent(value: number): string {
  return `${value}%`;
}

function formatScore(value: number): string {
  return `${value}/100`;
}

export default function BacktestingPage() {
  const activity = getActivityById("correr");

  if (!activity) {
    throw new Error("Atividade de backtesting não encontrada.");
  }

  const report = runWeatherBacktest({
    activity,
    city: sampleBacktestCity,
    days: buildSampleBacktestDays(),
    generatedAt: "2026-06-13T00:00:00.000Z",
  });

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 dark:bg-slate-950 dark:text-slate-50 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="border-b border-border pb-5">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="h-7 bg-white px-3 dark:bg-card">
              Relatório técnico
            </Badge>
            <Badge variant="outline" className="h-7 bg-white px-3 dark:bg-card">
              Fixture local
            </Badge>
          </div>
          <div className="mt-3 max-w-3xl space-y-2">
            <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
              Backtesting de acurácia
            </h1>
            <p className="text-sm leading-6 text-muted-foreground sm:text-base">
              {report.city.name} - {report.activity.name} -{" "}
              {report.period.startDate} a {report.period.endDate}
            </p>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-lg bg-white dark:bg-card">
            <CardHeader>
              <CardDescription>Janelas recomendadas</CardDescription>
              <CardTitle className="text-3xl">
                {report.evaluatedWindows}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="rounded-lg bg-white dark:bg-card">
            <CardHeader>
              <CardDescription>Janelas secas</CardDescription>
              <CardTitle className="text-3xl">
                {formatPercent(report.dryWindowRate)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="rounded-lg bg-white dark:bg-card">
            <CardHeader>
              <CardDescription>Taxa estimada de acerto</CardDescription>
              <CardTitle className="text-3xl">
                {formatPercent(report.estimatedHitRate)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="rounded-lg bg-white dark:bg-card">
            <CardHeader>
              <CardDescription>Erro médio de temperatura</CardDescription>
              <CardTitle className="text-3xl">
                {report.averageTemperatureErrorC.toFixed(1)}°C
              </CardTitle>
            </CardHeader>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
          <Card className="rounded-lg bg-white dark:bg-card">
            <CardHeader>
              <CardTitle>Dias avaliados</CardTitle>
              <CardDescription>
                Comparação entre a janela que teria sido recomendada e a condição
                histórica preparada.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b text-xs text-muted-foreground">
                    <tr>
                      <th className="py-2 pr-3 font-medium">Data</th>
                      <th className="py-2 pr-3 font-medium">Janela</th>
                      <th className="py-2 pr-3 font-medium">Score previsto</th>
                      <th className="py-2 pr-3 font-medium">Score observado</th>
                      <th className="py-2 pr-3 font-medium">Seca</th>
                      <th className="py-2 font-medium">Resultado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {report.days.slice(0, 12).map((day) => (
                      <tr key={day.date}>
                        <td className="py-3 pr-3">{day.date}</td>
                        <td className="py-3 pr-3">
                          {day.recommendedWindow
                            ? `${day.recommendedWindow.startLabel} - ${day.recommendedWindow.endLabel}`
                            : "Sem janela"}
                        </td>
                        <td className="py-3 pr-3">
                          {day.recommendedWindow
                            ? formatScore(day.recommendedWindow.avgScore)
                            : "-"}
                        </td>
                        <td className="py-3 pr-3">
                          {day.averageObservedScore !== null
                            ? formatScore(day.averageObservedScore)
                            : "-"}
                        </td>
                        <td className="py-3 pr-3">
                          {day.stayedDry === null
                            ? "-"
                            : day.stayedDry
                              ? "Sim"
                              : "Não"}
                        </td>
                        <td className="py-3">
                          {day.hit === null ? (
                            <Badge variant="outline">Não avaliada</Badge>
                          ) : day.hit ? (
                            <Badge className="bg-emerald-600 text-white">
                              Acerto
                            </Badge>
                          ) : (
                            <Badge variant="destructive">Divergência</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            <Card className="rounded-lg bg-white dark:bg-card">
              <CardHeader>
                <CardTitle>Métricas</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Score previsto</span>
                  <span>{formatScore(report.averageRecommendedScore)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Score observado</span>
                  <span>{formatScore(report.averageObservedScore)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Janelas secas</span>
                  <span>
                    {report.dryWindows}/{report.evaluatedWindows}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-lg bg-white dark:bg-card">
              <CardHeader>
                <CardTitle>Principais fatores de erro</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm">
                {report.topErrorFactors.map((factor) => (
                  <div
                    key={factor.factor}
                    className="rounded-md border border-border p-3"
                  >
                    <div className="flex justify-between gap-3 font-medium">
                      <span>{factor.label}</span>
                      <span>
                        {factor.averageError.toFixed(1)}
                        {factor.unit}
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-sky-600"
                        style={{ width: `${factor.impactScore}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-lg bg-white dark:bg-card">
              <CardHeader>
                <CardTitle>Limitações</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-2 text-sm leading-6 text-muted-foreground">
                  {report.limitations.map((limitation) => (
                    <li key={limitation}>{limitation}</li>
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

export default function Home() {
  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <section className="mx-auto flex min-h-[70vh] w-full max-w-5xl flex-col justify-center gap-6">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          MVP em construcao
        </p>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-normal sm:text-5xl">
            Janela Perfeita
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
            Um motor de recomendacao que transforma previsao meteorologica
            horaria em melhores janelas para atividades ao ar livre.
          </p>
        </div>
        <p className="max-w-xl text-sm leading-6 text-muted-foreground">
          Setup inicial concluido. A busca por cidade, atividades e scores sera
          implementada nas proximas tarefas do roteiro.
        </p>
      </section>
    </main>
  );
}

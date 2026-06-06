# AGENTS.md

Este arquivo resume as regras, decisões técnicas, validações e pendências do
projeto Janela Perfeita para continuidade em novas sessões do Codex.

## Idioma e comunicação

- Conversar em português.
- Issues, PRs, títulos, descrições, checklists e documentação em português.
- Commits seguem Conventional Commits com prefixo técnico em inglês e descrição
  em português.
- Exemplos:
  - `feat: cria servico de forecast open-meteo`
  - `test: cobre servicos open-meteo`
  - `docs: documenta dependencias no readme`
  - `chore: adiciona cobertura ao ci`

## Fluxo Git

- Branch final: `main`.
- Branch de integração: `develop`.
- Features saem de `develop` e voltam por PR para `develop`.
- No fim do MVP, abrir PR de `develop` para `main`.
- Não usar `master`.
- Nomes de branches devem ser curtos, sem numeração:
  - `feature/tipos-dominio`
  - `feature/regras-atividades`
  - `feature/servicos-open-meteo`
  - `test/cobertura-testes`
  - `docs/dependencias-projeto`
- Não excluir branches de feature após merge; o usuário pediu para preservá-las.
- Cada tarefa deve ter commits pequenos e separados por intenção.
- Antes de iniciar nova tarefa:
  - sincronizar `develop`
  - mover a issue para `In Progress`
  - criar/vincular branch pela issue quando possível
  - comentar na issue o início da etapa
- Ao finalizar:
  - marcar checklist da issue
  - abrir PR para `develop`
  - aguardar CI verde
  - fazer merge sem excluir branch
  - fechar issue
  - mover card para `Done`
  - sincronizar `develop` local

## Contexto de sessões

- Ao fim de cada branch/tarefa, consolidar no `AGENTS.md` o contexto relevante
  da sessão:
  - decisões novas
  - status de issues, PRs e branches
  - validações executadas
  - pendências e próxima etapa recomendada
- Registrar essa atualização em commit separado na branch `contexto-agents`.
- Usar commit Conventional Commit, por exemplo:
  `docs: atualiza contexto agents`.
- Não misturar atualização de contexto com commits de feature, teste ou correção.

## GitHub

- Repositório: `PauloSergioLR/janela-perfeita`.
- Project/Kanban: `Janela Perfeita`, Project #2.
- Project URL: `https://github.com/users/PauloSergioLR/projects/2`.
- O Project está vinculado ao repositório.
- Status usados:
  - `Todo`
  - `In Progress`
  - `Done`
- Issues criadas:
  - #1 Configuração inicial com CI e base de testes - concluída.
  - #2 Tipos centrais do domínio - concluída.
  - #3 Regras das atividades - concluída.
  - #4 Serviços Open-Meteo - concluída.
  - #5 Motor de score e janelas - próxima etapa de produto.
  - #6 Rotas internas da API.
  - #7 Interface de busca.
  - #8 Resultado visual e timeline.
  - #9 Testes e qualidade - aberta; já recebeu base de cobertura.
  - #10 PWA, README e deploy - aberta; já recebeu documentação inicial.

## Validação obrigatória

Antes de abrir PR, sempre rodar:

```bash
npm run lint
npm test
npm run test:coverage
npm run build
```

Na PR, aguardar o GitHub Actions passar antes de mergear.

Workflow atual:

- Arquivo: `.github/workflows/ci.yml`.
- Roda em PRs e pushes para `develop` e `main`.
- Job atual: `Lint, testes, cobertura e build`.
- Executa:
  - `npm ci`
  - `npm run lint`
  - `npm test`
  - `npm run test:coverage`
  - `npm run build`

## Cobertura de testes

- Script:

```bash
npm run test:coverage
```

- Relatório local HTML:

```text
coverage/index.html
```

- `coverage/` não deve ser commitado.
- Cobertura registrada após a issue #4:
  - Statements: 89.25%
  - Branches: 63.41%
  - Functions: 92.85%
  - Lines: 90.51%
- Regra do projeto: toda nova funcionalidade deve vir acompanhada de teste.
- Testes não devem depender de chamadas reais de rede; usar mocks quando
  envolver serviços externos.

## Arquivos que nunca devem entrar em commit

Sempre conferir antes de commit:

```bash
git status --ignored --short
```

Devem aparecer apenas como ignorados, nunca staged:

- `.next/`
- `coverage/`
- `next-env.d.ts`
- `node_modules/`
- caches, logs, builds e relatórios gerados

Arquivos de ignore/configuração relevantes:

- `.gitignore`
- `eslint.config.mjs`
- `.gitattributes`

## Decisões técnicas

- Produto: web app responsivo, sem app nativo no MVP.
- Stack:
  - Next.js 15 com App Router
  - React 19
  - TypeScript strict
  - Tailwind CSS
  - shadcn/ui
  - TanStack Query
  - Zod
  - date-fns
  - Recharts
  - Vitest
- Node recomendado: 20, documentado em `.nvmrc`.
- Gerenciador: npm.
- Instalação local:

```bash
npm install
```

- Instalação em CI:

```bash
npm ci
```

## Escopo do MVP

Incluir:

- Consulta por cidade, sem exigir GPS.
- Data de hoje até hoje+6.
- Seis atividades:
  - correr
  - caminhar
  - pedalar
  - fotografar pôr do sol
  - observar estrelas
  - lavar carro
- Melhor janela do dia.
- Score de 0 a 100.
- Motivos principais.
- Timeline de scores.
- Alternativas quando houver.
- Mensagem honesta quando não houver janela boa.

Não incluir no MVP:

- login
- banco de dados
- autenticação
- pagamento
- anúncios
- marketplace
- IA dentro do produto
- backend externo separado
- bibliotecas extras sem necessidade clara

## Open-Meteo

- Projeto tratado como não comercial e de portfólio.
- Usar Open-Meteo com atribuição visível.
- Não prometer precisão meteorológica absoluta.
- Não armazenar localização, IP, histórico ou dados pessoais no MVP.
- Fontes oficiais usadas:
  - Forecast API: `https://open-meteo.com/en/docs`
  - Geocoding API: `https://open-meteo.com/en/docs/geocoding-api`
  - Terms: `https://open-meteo.com/en/terms`
  - Licence: `https://open-meteo.com/en/licence`

Endpoints definidos no roteiro:

```text
GET https://api.open-meteo.com/v1/forecast
  ?latitude={lat}
  &longitude={lon}
  &hourly=temperature_2m,precipitation,wind_speed_10m,cloud_cover,uv_index,relative_humidity_2m
  &daily=sunrise,sunset
  &timezone=auto
  &start_date={yyyy-mm-dd}
  &end_date={yyyy-mm-dd}
```

```text
GET https://geocoding-api.open-meteo.com/v1/search
  ?name={query}
  &count=5
  &language=pt
  &format=json
```

## Estado técnico atual

Concluído:

- Setup inicial com Next.js, TypeScript, Tailwind, shadcn/ui, TanStack Query,
  Vitest e CI.
- Tipos centrais em `src/types/index.ts`.
- Regras das atividades em:
  - `src/lib/domain/activity-rules.ts`
  - `src/lib/domain/activities.ts`
- Serviços Open-Meteo em:
  - `src/lib/services/open-meteo.schemas.ts`
  - `src/lib/services/open-meteo-weather.service.ts`
  - `src/lib/services/open-meteo-geocoding.service.ts`
- Testes atuais:
  - `tests/configuracao-inicial.test.ts`
  - `tests/tipos-dominio.test.ts`
  - `tests/activity-rules.test.ts`
  - `tests/open-meteo-services.test.ts`
- Documentação inicial:
  - `README.md`
  - `CONTRIBUTING.md`
  - `.nvmrc`

## Próxima etapa recomendada

Issue #5: Motor de score e janelas.

Branch sugerida:

```text
feature/engine-score-janelas
```

Arquivos esperados:

- `src/lib/engine/weather-context.ts`
- `src/lib/engine/score-calculator.ts`
- `src/lib/engine/window-finder.ts`
- testes correspondentes em `tests/`

Critérios principais:

- `buildWeatherContext` calcula:
  - hora local
  - se a data é hoje
  - se a hora já passou
  - noite
  - golden hour usando `sunset` real
  - minutos em relação ao pôr do sol
- `calculateHourScore` aplica regras ponderadas.
- `calculateDayScores` retorna até 24 scores.
- Horários passados devem ser ignorados ou zerados quando a data for hoje.
- `findBestWindows` agrupa horas consecutivas com score mínimo.
- Janelas menores que `minDurationHours` devem ser removidas.
- Ordenação por:
  - maior `avgScore`
  - maior `peakScore`
  - maior duração
- Retornar top 3 janelas.
- Sem `fetch` dentro da engine.
- Funções puras e testáveis.

## Observações importantes para novas sessões

- Não avançar várias issues sem finalizar a anterior.
- Não fechar issue sem checklist marcado.
- Não fazer merge se CI falhar.
- Não deletar branch remota após merge.
- Sempre atualizar o Project/Kanban.
- Sempre documentar decisões relevantes na issue ou PR.
- Sempre preservar o escopo do MVP.

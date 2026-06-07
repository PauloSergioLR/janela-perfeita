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
  - aprovar a PR após testes/checks passarem e antes do merge
  - se o GitHub bloquear autoaprovação, registrar a limitação na PR
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
- Depois de atualizar e enviar `contexto-agents`, sempre abrir PR para `develop`
  e não deixar a atualização de contexto sem PR.
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
  - #5 Motor de score e janelas - concluída.
  - #6 Rotas internas da API - concluída.
  - #7 Interface de busca - concluída.
  - #8 Resultado visual e timeline - concluída.
  - #9 Testes e qualidade - concluída.
  - #10 PWA, README e deploy - concluída.

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
- Cobertura registrada após a issue #9:
  - Statements: 93.13%
  - Branches: 78.91%
  - Functions: 93.25%
  - Lines: 93.72%
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
- Engine de recomendação em:
  - `src/lib/engine/weather-context.ts`
  - `src/lib/engine/score-calculator.ts`
  - `src/lib/engine/window-finder.ts`
- Rotas internas em:
  - `src/app/api/geocoding/route.ts`
  - `src/app/api/recommendation/route.ts`
- UI principal e resultado em:
  - `src/app/page.tsx`
  - `src/lib/ui/search-page.ts`
  - `src/lib/ui/recommendation-result.ts`
  - `src/components/result/recommendation-card.tsx`
  - `src/components/result/score-timeline.tsx`
  - `src/components/result/score-breakdown.tsx`
  - `src/components/result/attribution-footer.tsx`
- Testes atuais:
  - `tests/configuracao-inicial.test.ts`
  - `tests/tipos-dominio.test.ts`
  - `tests/activity-rules.test.ts`
  - `tests/weather-context.test.ts`
  - `tests/score-calculator.test.ts`
  - `tests/window-finder.test.ts`
  - `tests/api-routes.test.ts`
  - `tests/search-page-ui.test.ts`
  - `tests/recommendation-result-ui.test.ts`
  - `tests/open-meteo-services.test.ts`
  - `tests/api-schema.test.ts`
  - `tests/fixtures/`
- Documentação inicial:
  - `README.md`
  - `CONTRIBUTING.md`
  - `.nvmrc`

Última sessão registrada:

- Issue #9 concluída na branch `test/testes-qualidade`.
- PR #23 (`test/testes-qualidade` -> `develop`) mergeada com CI verde.
- Commit principal: `ad12a26 test: cobre engine de recomendacao`.
- Issue #10 iniciada na branch `docs/pwa-ci-readme`.
- PR #25 (`docs/pwa-ci-readme` -> `develop`) mergeada com CI verde.
- PR #27 (`docs/pwa-ci-readme` -> `develop`) mergeada com CI verde para incluir
  a URL final do deploy no README.
- Commits da PR #25:
  - `b8a3efb chore: revisa configuracao de pwa e ci`
  - `5d61e7e docs: finaliza readme do portfolio`
- Commit da PR #27:
  - `be0571d docs: adiciona url de deploy ao readme`
- PR #25 entrega:
  - `public/manifest.json`
  - ícones PWA em `public/icons/`
  - metadata PWA em `src/app/layout.tsx`
  - README final de portfólio
  - screenshot em `docs/screenshot-home.png`
- Deploy Vercel concluído e verificado:
  - produção: `https://janela-perfeita.vercel.app`
  - raiz retornou HTTP 200
  - `/manifest.json` retornou HTTP 200
- Configuração Vercel ajustada via CLI/API:
  - projeto `janela-perfeita` criado na conta `paulosergiolr`
  - `framework=nextjs`
  - `installCommand=npm ci`
  - `buildCommand=npm run build`
  - `devCommand=npm run dev`
  - `nodeVersion=20.x`
  - proteções SSO/git fork desativadas para liberar acesso público
- Issue #10 fechada e card movido para `Done`.
- Não há issues abertas no momento.
- PR #29 (`develop` -> `main`) mergeada com CI verde.
- MVP integrado em `main`.
- Branches locais `develop` e `main` sincronizadas após o merge.
- Validações locais executadas:
  - `npm run lint`
  - `npm test`
  - `npm run test:coverage`
  - `npm run build`
- No Windows local, `npm test` via PATH falhou por Volta procurar
  `npm-prefix.js`; executar via `C:\Program Files\Volta\npm.cmd` funcionou.
- GitHub bloqueou autoaprovação da PR por ser do mesmo autor; limitação foi
  registrada nas PRs antes do merge ou antes de manter a PR aberta.
- Vercel CLI usado via `C:\Program Files\Volta\npx.cmd --yes vercel@latest`.

## Próxima etapa recomendada

MVP concluído.

Branches principais:

```text
main
develop
```

Produção atual:

```text
https://janela-perfeita.vercel.app
```

Próximos passos possíveis:

- Fazer revisão manual final no deploy público.
- Criar novas issues apenas se surgirem ajustes pós-MVP.
- Manter `develop` e `main` sincronizadas antes de novas tarefas.
- Preservar branches remotas de feature, teste, docs e contexto.

## Observações importantes para novas sessões

- Não avançar várias issues sem finalizar a anterior.
- Não fechar issue sem checklist marcado.
- Não fazer merge se CI falhar.
- Não deletar branch remota após merge.
- Sempre atualizar o Project/Kanban.
- Sempre documentar decisões relevantes na issue ou PR.
- Sempre preservar o escopo do MVP.

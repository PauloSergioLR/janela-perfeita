# AGENTS.md — Janela Perfeita

Este arquivo define regras permanentes para execução de tarefas com Codex neste repositório.

Prioridade: executar cada issue com qualidade, máxima economia de contexto, tokens e tempo de agente.

---

## Idioma e comunicação

- Conversar em português.
- Issues, PRs, títulos, descrições, checklists e documentação em português.
- Commits seguem Conventional Commits: prefixo técnico em inglês e descrição em português.
  - `feat: cria seletor visual de modos`
  - `fix: corrige score de chuva futura`
  - `test: cobre regra de atividade`
  - `docs: atualiza readme do projeto`
  - `chore: ajusta configuração do projeto`
- Evitar respostas longas.
- Não enviar atualizações intermediárias, salvo bloqueio real, aprovação necessária ou pedido explícito.
- Ao final: resumo curto, arquivos principais, validações, PR e pendências.

---

## Fluxo Git obrigatório

- Base: `develop`. Produção: `main`. Nunca usar `master`.
- Toda feature, correção ou documentação sai de `develop` e volta por PR para `develop`.
- Não fazer merge, aprovar PR, fechar issue, mover card, editar Project/Kanban ou comentar em issue sem pedido explícito.
- Não deletar branches remotas após merge.
- Criar branch curta, sem numeração desnecessária:
  - `feature/design-system`
  - `feature/weather-stage`
  - `fix/score-chuva`
  - `test/timeline-score`
  - `docs/readme-visual`

Antes de iniciar:

```bash
git checkout develop
git pull
git checkout -b nome-da-branch
```

Ao finalizar: commit, push, PR para `develop`; nunca merge.

---

## Economia de contexto

Obrigatório em toda issue:

- Uma thread por issue. Não usar `Resume all` em issue nova.
- Não carregar histórico antigo sem necessidade.
- Não consultar `docs/ai/agents-history.md` salvo pedido explícito do usuário.
- Não ler o repositório inteiro; preferir `rg` e arquivos citados pelo usuário, importados ou diretamente testados.
- Nunca abrir `node_modules/`, `.next/`, `coverage/`, `test-results/`, `playwright-report/`, `dist/`, `build/`, logs, caches ou arquivos gerados.
- Evitar buscas amplas no GitHub e listas extensas de issues, PRs, branches ou arquivos.
- Não rodar Project/Kanban: `gh project item-list`, `gh project item-edit`, `gh issue comment`.
- Não atualizar este arquivo sem pedido explícito.

---

## Modo de trabalho por issue

### Entendimento

Antes de editar, para tarefa grande, ambígua ou arriscada: plano curto com objetivo, arquivos a consultar/alterar, plano e validações; aguardar aprovação.

Para tarefa pequena e clara: implementar direto, preservando escopo e economia de contexto.

### Implementação

- Alterar somente o necessário; evitar refatoração e mudanças cosméticas fora do escopo.
- Não adicionar biblioteca ou alterar arquitetura sem aprovação clara.
- Não alterar regra de negócio em issue puramente visual.
- Não remover testes, não usar `any`, preservar TypeScript strict e interface em PT-BR.
- Mudanças de regra, comportamento ou bug exigem teste.
- Testes de serviços externos usam mocks; nunca rede real.

### Validação

Durante desenvolvimento, rodar só validações focadas:

```bash
npm test -- tests/nome-do-teste.test.ts
npm run lint
```

Evitar repetir `npm run build`, `npm test` completo e `npm run test:coverage` na mesma issue.

Antes do PR:

- Documentação/configuração sem impacto no app: `git diff --check`.
- Código pequeno: `npm run lint` e teste relacionado.
- App, regra, UI, engine, API ou comportamento relevante:

```bash
npm run lint
npm test
npm run test:coverage
npm run build
```

Se falhar: relatar comando, erro relevante, arquivo e ação/bloqueio.

---

## Escopo técnico

- Web app responsivo: Next.js App Router, React, TypeScript strict, Tailwind, shadcn/ui, TanStack Query, Zod, date-fns, Recharts, Vitest e npm.
- Node recomendado: 20.
- Sem login, banco, autenticação, pagamentos, anúncios, marketplace, backend externo separado ou IA no produto.
- Não adicionar bibliotecas sem justificativa e aprovação; preferir CSS, Tailwind e componentes existentes.

---

## Produto e dados

- Open-Meteo é fonte principal.
- APIs adicionais: gratuitas e opcionais; nunca API paga ou chave paga obrigatória.
- Nunca adicionar mapas, MapLibre, MapTiler ou Google Maps.
- Não prometer precisão meteorológica absoluta.
- Não armazenar localização, IP, histórico ou dados pessoais.
- Manter atribuição visível da Open-Meteo quando aplicável.

---

## UI e redesign

Direção: Weather Decision Cockpit; interface escura, premium e climática; midnight blue, glassmorphism discreto, gradientes climáticos, glow suave, score protagonista, painel lateral, resultado principal, timeline visual e cards climáticos.

Em issues visuais:

- Não alterar backend ou reescrever engine sem necessidade.
- Não alterar regra de negócio em tarefa puramente visual.
- Usar animações leves, respeitar `prefers-reduced-motion`, acessibilidade e responsividade mobile.
- Preservar testes existentes.

---

## Testes e qualidade

- Toda funcionalidade relevante deve ter teste.
- `coverage/` e arquivos gerados nunca entram em commit.
- Antes de commit:

```bash
git status --short
```

Se necessário:

```bash
git status --ignored --short
```

Nunca commitar `.next/`, `coverage/`, `node_modules/`, logs, caches, builds ou relatórios.

---

## GitHub e histórico

- Repositório: `PauloSergioLR/janela-perfeita`.
- Project/Kanban é responsabilidade do usuário.
- Documentar decisões relevantes no PR.
- Histórico antigo: `docs/ai/agents-history.md`; somente referência, nunca carregar automaticamente.

# Guia de contribuição

Este projeto é desenvolvido por etapas, usando issues, branches curtas e pull
requests para `develop`.

## Ambiente local

Pré-requisitos:

- Node.js 20 LTS
- npm
- Git

Instale as dependências:

```bash
npm install
```

Rode o app:

```bash
npm run dev
```

O app abre em `http://localhost:3000`.

## Scripts do projeto

```bash
npm run lint
npm test
npm run test:coverage
npm run build
```

Esses comandos também rodam no GitHub Actions.

## Regra de testes

Toda nova funcionalidade deve vir acompanhada de teste. Quando a mudança alterar
regra de domínio, engine, serviço, schema, API ou UI crítica, adicione ou atualize
testes na mesma branch.

## Commits

Use Conventional Commits com descrição em português:

```text
feat: implementa regras das atividades
test: cobre regras das atividades
docs: documenta dependencias do projeto
chore: ajusta workflow de ci
```

## Branches

Crie branches a partir de `develop`:

```text
feature/nome-curto
test/nome-curto
docs/nome-curto
```

## Pull requests

Antes de abrir PR:

- rode `npm run lint`
- rode `npm test`
- rode `npm run test:coverage`
- rode `npm run build`
- confirme que `.next/`, `coverage/`, `next-env.d.ts` e `node_modules/` não
  entraram no Git

As PRs devem apontar para `develop` durante o desenvolvimento do MVP.

## Escopo do MVP

Não adicionar login, banco, autenticação, pagamento, anúncios, IA no produto ou
bibliotecas extras sem necessidade clara.

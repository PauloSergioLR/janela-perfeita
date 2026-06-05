# Janela Perfeita

Motor de recomendação que transforma previsão meteorológica horária em melhores
janelas para atividades ao ar livre.

Este projeto está sendo construído por etapas, com issues, branches por feature,
pull requests para `develop` e commits semânticos com descrição em português.

## Pré-requisitos

- Node.js 20 LTS
- npm
- Git

O projeto usa npm como gerenciador de pacotes. O arquivo `package-lock.json` deve
ser respeitado para manter instalações reproduzíveis.

## Instalação

```bash
npm install
```

Em ambientes de CI ou instalação limpa, prefira:

```bash
npm ci
```

## Como rodar

```bash
npm run dev
```

O app abre em `http://localhost:3000`.

## Scripts disponíveis

```bash
npm run dev
npm run build
npm start
npm run lint
npm test
npm run test:coverage
npm run test:ui
```

- `npm run dev`: inicia o servidor local de desenvolvimento.
- `npm run build`: gera o build de produção do Next.js.
- `npm start`: executa o build de produção.
- `npm run lint`: valida padrões de código com ESLint.
- `npm test`: executa os testes com Vitest.
- `npm run test:coverage`: gera relatório de cobertura em `coverage/`.
- `npm run test:ui`: abre a interface do Vitest.

## Dependências principais

- Next.js 15 com App Router
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Zod
- date-fns
- Recharts
- Vitest

As versões exatas ficam em `package.json` e `package-lock.json`.

## Validação obrigatória

Antes de abrir uma PR, rode:

```bash
npm run lint
npm test
npm run test:coverage
npm run build
```

Relatórios e artefatos gerados, como `.next/`, `coverage/`, `next-env.d.ts` e
`node_modules/`, são ignorados pelo Git.

## Fluxo de branches

- `main`: branch final e estável.
- `develop`: branch de integração das features.
- `feature/*`: branches de implementação criadas a partir de `develop`.
- `test/*`: branches focadas em testes e qualidade.
- `docs/*`: branches focadas em documentação.

O fluxo padrão é:

```text
develop -> branch da tarefa -> PR para develop
```

Ao final do MVP, `develop` será integrado em `main`.

## Observação

Projeto não comercial, criado para portfólio. A documentação completa, PWA,
deploy e atribuição Open-Meteo entram nas etapas finais do roteiro.

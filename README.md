# Janela Perfeita

Motor de recomendação que transforma previsão meteorológica horária em melhores
janelas para atividades ao ar livre.

Este projeto está sendo construído por etapas, com issues, branches por feature,
pull requests para `develop` e commits semânticos com descrição em português.

## Stack inicial

- Next.js 15 com App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Zod
- Recharts
- Vitest

## Fluxo de branches

- `main`: branch final e estável.
- `develop`: branch de integração das features.
- `feature/*`: branches de implementação criadas a partir de `develop`.
- `test/*`: branches focadas em testes e qualidade.
- `docs/*`: branches focadas em documentação.

## Como rodar

```bash
npm install
npm run dev
```

O app abre em `http://localhost:3000`.

## Validação

```bash
npm run lint
npm test
npm run build
```

## Observação

Projeto não comercial, criado para portfólio. A documentação completa, PWA,
CI/CD e atribuição Open-Meteo entram nas etapas finais do roteiro.

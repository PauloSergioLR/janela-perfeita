# QA visual do cockpit

Checklist manual para evitar regressões no cockpit desktop.

## Resoluções obrigatórias

- `1366x768`
- `1440x900`
- `1600x900`
- `1920x1080`

## Roteiro

1. Abrir a Home em modo demo: `/?demo=true`.
2. Confirmar que não há scroll horizontal no navegador.
3. Confirmar que a página desktop não vira uma página longa; rolagem deve ficar restrita aos painéis internos quando necessário.
4. Confirmar que o CTA principal está visível e inteiro.
5. Confirmar que o painel principal de resultado está visível e inteiro.
6. Confirmar que a faixa inferior de resumo ou previsão fica dentro da viewport.
7. Selecionar cidade demo, atividade e gerar recomendação.
8. Alternar os modos `Janela perfeita`, `O que fazer hoje?`, `Consulta do dia` e `Consulta da semana`.
9. Repetir as checagens de overflow, CTA, painel principal e faixa inferior após cada alternância.

## Guarda automatizada

O teste `e2e/cockpit-visual.spec.ts` cobre as resoluções acima com dados demo locais, sem depender de rede externa. Ele valida overflow horizontal no documento, `body`, `main` e painel principal, além de conferir CTA, painel principal, faixa inferior e alternância dos modos.

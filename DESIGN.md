# Janela Perfeita — Design Direction

## Identidade

Janela Perfeita é um decision dashboard meteorológico.
Não deve parecer apenas um formulário de clima.
Deve parecer um produto técnico, confiável, limpo e levemente premium.

O usuário entra com uma pergunta simples: "qual é a melhor janela para fazer
isso?". A interface deve responder como um painel de decisão: clara, objetiva,
com hierarquia forte e sem teatralizar a previsão.

## Referência Taste Skill

Referência: https://github.com/Leonxlnx/taste-skill

O Taste Skill será usado como inspiração de direção, não como dependência do
produto. A referência orienta a evitar interfaces genéricas, reforçando layout,
tipografia, espaçamento, densidade e motion com intenção.

Aplicação no projeto:

- Usar os dials como limites de decisão antes de redesenhar componentes.
- Tratar cada tela como produto de decisão, não como landing page.
- Evitar mudanças aleatórias: toda escolha visual deve apoiar score, janela,
  confiança da previsão ou leitura da timeline.
- Manter compatibilidade com shadcn/ui, Tailwind e a arquitetura atual.

## Objetivos Visuais

- Melhorar hierarquia.
- Dar protagonismo ao score.
- Dar protagonismo à janela recomendada.
- Tornar timeline mais útil.
- Melhorar cards.
- Melhorar estados de loading, erro e vazio.
- Melhorar responsividade.

## Dials

```txt
DESIGN_VARIANCE: 6
MOTION_INTENSITY: 4
VISUAL_DENSITY: 5
```

Interpretação:

- DESIGN_VARIANCE 6: permitir composição mais sofisticada que um formulário
  centralizado, mas sem layout experimental demais.
- MOTION_INTENSITY 4: usar movimento discreto para feedback e transições, sem
  animações pesadas ou decorativas.
- VISUAL_DENSITY 5: mostrar informação suficiente para decisão rápida, sem
  lotar a tela.

## Direção

- Visual limpo, moderno e técnico.
- Cards com profundidade discreta.
- Uso controlado de cor.
- Sem visual infantil.
- Sem excesso de gradientes.
- Sem poluição visual.
- Interface confiável e fácil de entender.

## Princípios

- O score é o ponto focal, mas nunca sozinho: precisa vir com janela, confiança
  e motivo principal.
- A melhor janela deve ser reconhecível em poucos segundos.
- A timeline deve ajudar comparação por horário, não ser apenas decoração.
- Cores devem comunicar estado: recomendado, atenção, risco e ausência de boa
  janela.
- Textos devem ser curtos, honestos e em PT-BR.
- Layout mobile deve preservar a decisão principal antes dos detalhes.

## Home

- A primeira viewport deve ser a ferramenta, não uma landing page.
- Busca, atividade e data devem ficar próximos e fáceis de escanear.
- O contexto do produto pode existir, mas não deve competir com o fluxo.
- Evitar hero marketing, slogans grandes e blocos explicativos longos.
- Priorizar uma composição de dashboard leve: entrada clara, estado atual e
  chamada para gerar recomendação.

## Resultado

- Score, janela recomendada e confiança devem formar o bloco principal.
- A hierarquia recomendada é:
  1. Score.
  2. Janela.
  3. Confiança.
  4. Motivos.
  5. Alternativas.
- Cards devem ter borda, sombra leve e raio de até 8px.
- Evitar cards aninhados.
- Badge e cor devem reforçar status, não virar decoração.

## Timeline

- Deve facilitar comparação entre horários.
- Precisa evidenciar picos, quedas e limiar mínimo recomendado.
- Deve mostrar motivo principal por horário quando útil.
- No mobile, deve continuar legível sem comprimir texto.
- Cores da timeline devem ser consistentes com score e confiança.

## Estados

### Loading

- Deve transmitir que a previsão está sendo consultada.
- Usar feedback visual discreto e estável.
- Não deslocar layout de forma brusca.

### Empty

- Deve explicar o próximo passo em uma frase curta.
- Não culpar o usuário.
- Não parecer erro técnico.

### Error

- Deve ser direto, recuperável e sem stack trace.
- Preferir ações claras: tentar novamente, trocar cidade ou revisar dados.
- Manter tom honesto sobre limitações de previsão.

## Mobile e Acessibilidade

- Score e janela devem aparecer antes de detalhes secundários.
- Botões e campos precisam manter alvo confortável de toque.
- Textos não podem truncar informação essencial.
- Contraste deve ser suficiente em badges, cards e timeline.
- Ícones precisam apoiar leitura, não substituir texto crítico.
- Estados de foco devem continuar visíveis.

## Restrições

- Não quebrar shadcn/ui.
- Não adicionar biblioteca de UI nova.
- Não adicionar animações pesadas.
- Não comprometer acessibilidade.
- Não usar landing page como tela principal.
- Não criar tema visual dominado por uma única cor.
- Não depender de dados pessoais, login ou histórico remoto.

## Critério de Qualidade para Próximas Issues

Antes de considerar um redesign pronto:

- A decisão principal deve ser entendida em até cinco segundos.
- A melhor janela deve ser mais forte visualmente que alternativas.
- A timeline deve mostrar diferença real entre horários.
- Loading, empty e error devem ter aparência consistente com o produto.
- Desktop e mobile devem preservar a mesma hierarquia de decisão.
- A UI deve parecer produto técnico confiável, não template genérico.

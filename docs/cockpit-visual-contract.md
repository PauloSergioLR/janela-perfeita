# Contrato visual do cockpit desktop

Este documento define o contrato visual para reconstruir o cockpit desktop do Janela Perfeita. O mock aprovado e a direcao "Weather Decision Cockpit" sao a referencia principal para qualquer decisao de layout, proporcao, densidade e hierarquia visual.

## Objetivo

Garantir que a nova interface desktop caiba em uma tela util sem cortar campos, botoes, cards, timeline ou CTAs, e sem transformar o cockpit em uma pagina longa. Este contrato deve orientar as proximas tarefas visuais antes de qualquer alteracao de layout.

## Referencia visual

- O mock aprovado e a referencia visual principal.
- A composicao deve comunicar cockpit climatico premium: fundo escuro, midnight blue, glassmorphism discreto, gradientes climaticos, glow suave e score como elemento protagonista.
- A tela deve parecer um painel de decisao, nao uma landing page e nao uma pagina vertical longa.
- Nenhuma decisao visual pode remover funcionalidade existente apenas para fazer o layout caber.

## Estrutura alvo

```txt
Header
ModeBar
MainGrid
  LeftControlPanel
  MainContentPanel
BottomForecastStrip
FooterHint
```

## Largura maxima

Para desktop, o cockpit deve usar um container centralizado com largura maxima entre `1280px` e `1440px`, ajustando-se ao viewport sem exigir rolagem horizontal.

Diretrizes por viewport:

| Viewport | Comportamento esperado |
| --- | --- |
| `1366x768` | Layout completo visivel, com densidade maior e faixa inferior compacta. |
| `1440x900` | Layout completo visivel, respirando melhor entre regioes. |
| `1600x900` | Container pode crescer ate o limite maximo, mantendo proporcoes. |
| `1920x1080` | Container permanece controlado; nao espalhar conteudo ate as bordas. |

## Altura alvo

- O cockpit desktop deve mirar uma composicao de tela unica.
- A altura util deve considerar header, modos, grid principal, faixa inferior e dica de rodape.
- Em desktop, a rolagem vertical principal nao pode ser usada como solucao de layout.
- Em `1366x768`, o conteudo deve continuar acessivel sem cortar controles essenciais.

## Regioes da tela

### Header

- Identifica o produto e o contexto da consulta.
- Deve ser compacto, com altura controlada.
- Nao deve competir visualmente com o score ou com o resultado principal.

### ModeBar

- Exibe modos de decisao como controle direto.
- Deve ser horizontal em desktop.
- Deve preservar estados ativo, hover, foco e disabled quando existirem.
- Nao pode empurrar o formulario para fora da area visivel.

### MainGrid

- E a area principal de trabalho.
- Deve conter duas colunas: painel esquerdo de controle e painel direito de resultado.
- Deve manter alinhamento vertical entre `LeftControlPanel` e `MainContentPanel`.
- Nao deve usar `overflow-hidden` para esconder conteudo que nao coube.

### LeftControlPanel

- Contem formulario, preferencias, localizacao, data, hora, atividade e CTA.
- Nenhum campo, label, ajuda, erro, botao ou CTA pode ficar cortado.
- Formularios nao podem usar `overflow-hidden`.
- Se faltar espaco, usar agrupamento, tabs, accordions, etapas compactas ou paineis contextuais, sem esconder informacao obrigatoria.

### MainContentPanel

- Contem score, diagnostico, resumo climatico, justificativas e timeline principal.
- Score deve ser protagonista visual.
- Conteudo secundario deve ser compacto, escaneavel e hierarquizado.
- Cards nao podem deslocar a faixa inferior para fora da tela em desktop.

### BottomForecastStrip

- Exibe previsao horaria ou blocos climaticos compactos.
- Deve ficar abaixo do `MainGrid`, ainda dentro da composicao desktop.
- Altura alvo: `130px` a `170px`.
- Pode usar navegacao por setas, tabs, carrossel ou paginacao compacta quando houver muitos itens.
- Nao deve depender de scrollbar visivel como solucao principal.

### FooterHint

- Deve ser discreto e curto.
- Pode conter dica, atribuicao e contexto de dados.
- A atribuicao da Open-Meteo deve permanecer visivel quando aplicavel.

## Proporcoes desktop

Para `desktop >= 1366px`:

| Elemento | Medida inicial |
| --- | --- |
| Largura maxima do cockpit | `1280px` a `1440px` |
| Coluna esquerda | `320px` a `360px` |
| Coluna direita | Restante do espaco disponivel |
| Gap entre colunas | `20px` a `28px` |
| Faixa inferior | `130px` a `170px` |

Regras:

- A coluna esquerda deve ter largura suficiente para o formulario sem cortes.
- A coluna direita deve receber prioridade visual para score e resultado.
- O gap deve separar regioes sem desperdiçar espaco util.
- Em viewports menores dentro do desktop suportado, reduzir densidade antes de remover conteudo.

## Regras de overflow

Proibido:

- Campos cortados.
- Botoes escondidos.
- CTAs fora da area visivel.
- Timeline cortada.
- Cards climaticos cortados.
- Scrollbars visiveis na tela principal como solucao de layout.
- `overflow-hidden` em formulario.
- Empilhamento vertical longo no desktop.
- Layout que exige rolagem vertical principal para operar o cockpit.

Permitido, com criterio:

- `overflow-x` controlado em trilhas horizontais pequenas, desde que haja setas, paginacao, tabs ou indicacao clara.
- Scroll interno apenas em painel secundario e nao essencial, sem esconder campos de formulario nem CTA.
- Accordion, tabs, segmentacao por modo, carrossel e paineis contextuais para manter densidade.

## Regras para formulario

- Todo campo deve mostrar label, valor, estado de erro e ajuda essencial sem corte.
- Nenhum formulario pode depender de mascara visual que esconda conteudo excedente.
- CTA principal deve permanecer acessivel em desktop.
- Estados de validacao devem caber no layout.
- Responsividade nao pode reduzir altura de campos ate comprometer toque, leitura ou foco.

## Comportamento dos modos

- Modos devem reorganizar prioridade visual, nao quebrar a estrutura base.
- Trocar modo nao deve causar salto grande de layout.
- O `MainGrid` deve continuar com painel esquerdo e painel principal.
- Conteudos especificos de modo devem caber por compactacao, tabs ou paineis contextuais.
- Um modo nao pode esconder dados obrigatorios para decisao sem alternativa clara de acesso.

## Comportamento da faixa inferior

- A faixa inferior deve funcionar como resumo temporal compacto.
- Deve aceitar muitos pontos de previsao sem crescer verticalmente sem controle.
- Quando houver excesso de itens, usar navegacao horizontal controlada.
- Deve preservar leitura de horario, icone/condicao, temperatura, chuva, vento ou variaveis relevantes.
- Nao deve competir com o score como elemento principal.

## Checklist de aprovacao visual

Antes de implementar ou aprovar tarefa visual baseada neste contrato:

- [ ] O mock aprovado foi usado como referencia principal.
- [ ] O cockpit cabe em uma tela desktop sem pagina longa.
- [ ] O layout foi conferido em `1366x768`.
- [ ] O layout foi conferido em `1440x900`.
- [ ] O layout foi conferido em `1600x900`.
- [ ] O layout foi conferido em `1920x1080`.
- [ ] Nenhum campo do formulario esta cortado.
- [ ] Nenhum botao ou CTA esta escondido.
- [ ] Nenhuma timeline ou card essencial esta cortado.
- [ ] Nao ha scrollbar visivel na tela principal como solucao de layout.
- [ ] Nenhum formulario usa `overflow-hidden`.
- [ ] A faixa inferior permanece dentro da composicao.
- [ ] A atribuicao da Open-Meteo continua visivel quando aplicavel.
- [ ] Nenhuma funcionalidade foi removida para fazer o layout caber.
- [ ] Nenhum mapa foi adicionado.
- [ ] Nenhuma API paga foi adicionada.
- [ ] Backend e engine permanecem inalterados, salvo issue futura explicita.

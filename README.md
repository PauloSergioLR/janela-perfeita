# Janela Perfeita

Aplicação web responsiva para encontrar o melhor momento climático para uma
atividade. O Janela Perfeita transforma a previsão por hora em recomendações
práticas: mostra quando sair, a qualidade da janela e os fatores que sustentam
a decisão.

![Janela Perfeita em funcionamento](docs/screenshot-home.png)

## Visão geral

O projeto ajuda a decidir o melhor horário ou dia para atividades sensíveis ao
clima. A pessoa escolhe cidade, data e atividade; a aplicação avalia a previsão,
calcula um score por hora e destaca as melhores janelas disponíveis.

A interface segue o conceito de *Weather Decision Cockpit*: controles e
resultado ficam reunidos em um painel escuro, climático e responsivo.

## Funcionalidades atuais

- Busca de cidade com sugestões.
- Detecção opcional da localização atual pelo navegador.
- Seleção de data, atividade e faixa de disponibilidade.
- Recomendação da melhor janela e alternativas próximas.
- Score de 0 a 100 com detalhamento dos fatores avaliados.
- Confiança da previsão e motivos favoráveis ou desfavoráveis.
- Estatísticas climáticas e timeline por hora.
- Faixa dos próximos dias e visão climática semanal.
- Ranking de atividades para o dia.
- Consultas recentes salvas somente no navegador.
- Compartilhamento textual do resultado.
- Modo demo para conhecer a experiência sem depender de uma busca externa.
- Temas claro e escuro, acessibilidade e layout responsivo.

## Modos da aplicação

### Janela perfeita

Encontra os melhores horários para uma atividade e data escolhidas. Permite
limitar o cálculo à faixa de tempo em que a pessoa estará disponível.

### O que fazer hoje?

Avalia todas as atividades no mesmo dia e cria um ranking conforme as condições
previstas.

### Consulta do dia

Apresenta o clima completo da data selecionada sem exigir uma atividade.

### Consulta da semana

Resume a previsão dos próximos sete dias para facilitar o planejamento.

## Atividades suportadas

- Correr
- Caminhar
- Pedalar
- Fotografar pôr do sol
- Observar estrelas
- Lavar carro
- Lavar roupa

Cada atividade possui pesos, duração mínima e critérios próprios para fatores
como temperatura, chuva, vento, umidade, visibilidade, radiação UV e luz solar.

## Como a recomendação funciona

1. O app consulta a previsão horária da cidade e do período escolhido.
2. Cada hora recebe notas conforme as regras da atividade.
3. As notas ponderadas formam um score entre 0 e 100.
4. Horas consecutivas adequadas são agrupadas em janelas.
5. A melhor janela é escolhida por score médio, pico, duração e horário.

A confiança resume a estabilidade das condições dentro da janela. O resultado é
uma estimativa de apoio à decisão, não garantia meteorológica.

## Fonte de dados

Os dados meteorológicos são fornecidos pela
[Open-Meteo](https://open-meteo.com/), usada sem chave no fluxo atual.

A busca textual de cidades usa o geocoding da Open-Meteo. Quando a localização
do navegador é autorizada, o nome aproximado do local é resolvido com o
[Nominatim](https://nominatim.org/).

## Stack

- Next.js 15 com App Router
- React 19 e TypeScript strict
- Tailwind CSS e shadcn/ui
- TanStack Query e Zod
- date-fns, Recharts e Lucide
- Vitest e Playwright

## Como rodar localmente

Requisitos: Node.js 20 e npm.

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Variáveis de ambiente

Nenhuma variável de ambiente é obrigatória. A Open-Meteo não exige chave para o
uso atual do projeto.

## Validação

```bash
npm run lint
npm test
npm run test:coverage
npm run test:e2e
npm run build
```

Para instalar os navegadores do Playwright em um ambiente novo:

```bash
npx playwright install
```

## Estrutura principal

```text
src/app/                         páginas e rotas internas
src/components/search/           controles de consulta
src/components/result/           cockpit e visualizações do resultado
src/lib/domain/                  atividades e regras
src/lib/engine/                  score, janelas e explorações
src/lib/services/                acesso e normalização da Open-Meteo
src/lib/ui/                      contratos de apresentação
tests/                           testes unitários e de integração
e2e/                             testes de ponta a ponta
docs/                            documentação e imagem da aplicação
```

## Privacidade

- Não há login, banco de dados ou armazenamento de dados pessoais no servidor.
- A localização só é solicitada após permissão do navegador.
- Consultas recentes permanecem no armazenamento local do navegador e podem ser
  apagadas pela interface.

## Status do projeto

- [x] Busca de cidade e localização atual
- [x] Regras e scores por atividade
- [x] Melhor janela e alternativas
- [x] Confiança, motivos e estatísticas
- [x] Timeline horária e faixa dos próximos dias
- [x] Ranking de atividades
- [x] Consultas diária e semanal
- [x] Histórico local de consultas
- [x] Cockpit climático responsivo
- [x] Modo demo
- [x] Testes unitários, integração e E2E

Melhorias futuras devem preservar a Open-Meteo como fonte climática, a
privacidade da pessoa usuária e o foco em decisões simples e transparentes.

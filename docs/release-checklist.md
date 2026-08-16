# Checklist de lançamento

Checklist operacional para uma futura promoção de `develop` para `main` e
publicação na Vercel. Este documento não autoriza executar merge, release,
deploy ou alteração do Project/Kanban automaticamente.

## Antes do merge em `main`

- [ ] Confirmar que `develop` está atualizada com o remoto.
- [ ] Confirmar que todos os PRs necessários foram revisados e aprovados.
- [ ] Revisar o README final em busca de afirmações desatualizadas ou
  funcionalidades inexistentes.
- [ ] Validar a screenshot principal em zoom de navegador de 100%, sem
  DevTools, indicador de desenvolvimento, cortes ou sobreposições.
- [ ] Revisar `/como-funciona` e suas limitações.
- [ ] Validar os diagramas Mermaid no GitHub.
- [ ] Abrir todos os links, badges e imagens do README.
- [ ] Conferir `LICENSE`, autoria e créditos.
- [ ] Confirmar que somente a Open-Meteo é descrita como fonte climática.
- [ ] Confirmar que Nominatim/OpenStreetMap aparecem somente no fluxo de
  geocodificação reversa.
- [ ] Verificar ausência de segredos, tokens e arquivos `.env` versionados.
- [ ] Verificar que `.next/`, `coverage/`, `node_modules/`, relatórios,
  screenshots temporárias, logs e caches não estão no commit.

## Validações automatizadas

- [ ] Instalar dependências com `npm ci` em ambiente limpo.
- [ ] Executar `npm run lint`.
- [ ] Executar `npm test`.
- [ ] Executar `npm run test:coverage` e revisar o resumo atual.
- [ ] Executar `npm run build`.
- [ ] Instalar Chromium com `npx playwright install chromium`, se necessário.
- [ ] Executar `npm run test:e2e`.
- [ ] Confirmar o workflow de CI verde para a revisão que será promovida.

## QA manual antes da release

- [ ] Testar Janela perfeita com cidade, data, atividade e disponibilidade.
- [ ] Testar O que fazer hoje? e revisar o ranking das sete atividades.
- [ ] Testar Consulta do dia e navegar pela timeline completa.
- [ ] Testar Consulta da semana e os sete dias exibidos.
- [ ] Testar tema claro e tema escuro.
- [ ] Testar desktop principal em zoom de 100%.
- [ ] Testar desktop menor, incluindo `1280 × 720`.
- [ ] Testar viewport mobile e navegação por teclado.
- [ ] Revisar contraste, foco visível, nomes acessíveis e alvos de toque.
- [ ] Testar estados de carregamento, vazio e erro.
- [ ] Testar compartilhamento nativo e fallback de cópia.
- [ ] Testar histórico recente e ação de limpeza.
- [ ] Testar `/?demo=true` sem depender de serviços externos.
- [ ] Abrir `/como-funciona`.
- [ ] Abrir `/tecnico/backtesting` e conferir o aviso sobre fixture local.
- [ ] Revisar console e rede do navegador, sem erros inesperados.

## Preparação da release

- [ ] Definir a versão pública.
- [ ] Atualizar a versão somente após decisão explícita.
- [ ] Preparar notas de release em português.
- [ ] Abrir PR de `develop` para `main`.
- [ ] Aguardar revisão e CI.
- [ ] Fazer merge somente após aprovação explícita.
- [ ] Criar tag depois do merge.
- [ ] Criar GitHub Release com as notas aprovadas.
- [ ] Não deletar branches remotas.

## Vercel

- [ ] Confirmar que o projeto aponta para
  `PauloSergioLR/janela-perfeita`.
- [ ] Confirmar `main` como branch de produção.
- [ ] Confirmar Node.js 24.
- [ ] Confirmar instalação com `npm ci`.
- [ ] Confirmar build com `npm run build`.
- [ ] Confirmar que nenhuma variável de ambiente obrigatória foi introduzida.
- [ ] Revisar log completo do build.
- [ ] Revisar domínio e redirecionamentos.
- [ ] Confirmar HTTPS e resposta da rota `/`.
- [ ] Testar `/api/geocoding`, `/api/reverse-geocoding` e
  `/api/recommendation` por meio dos fluxos da interface.
- [ ] Testar busca de cidade, localização atual e os quatro modos publicados.
- [ ] Verificar logs da aplicação após os smoke tests.
- [ ] Atualizar a URL do README se domínio ou caminho mudar.

## Pós-deploy

- [ ] Executar smoke test em desktop e mobile.
- [ ] Confirmar que a versão publicada corresponde ao commit de `main`.
- [ ] Confirmar screenshot, badges, Mermaid e links do README no GitHub.
- [ ] Confirmar atribuições da Open-Meteo e OpenStreetMap/Nominatim.
- [ ] Verificar novamente `/como-funciona`, `/tecnico/backtesting` e
  `/?demo=true`.
- [ ] Registrar problemas encontrados em issues separadas.
- [ ] Confirmar que existe caminho de rollback para o deploy anterior.
- [ ] Registrar commit, tag, release e deploy aprovados.

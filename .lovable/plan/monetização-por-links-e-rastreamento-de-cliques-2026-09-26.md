# Monetização por links e rastreamento de cliques

## Objetivo
Adicionar links de afiliado opcionais e métricas básicas de cliques sem alterar o visual, o questionário, o motor de recomendação, a IA ou o catálogo existente.

## Implementação
- Evoluir os produtos para manter dois campos distintos: URL do produto obrigatória e URL de afiliado opcional.
- Preservar todos os links atuais como URL do produto durante a migração, sem perda de dados.
- Atualizar o formulário administrativo para editar os dois links, com validação clara e a explicação solicitada.
- Usar o link de afiliado quando preenchido; caso contrário, usar a URL do produto.
- Criar um registro persistente para cada clique, contendo produto, data, origem e identificador anônimo da sessão quando disponível.
- Persistir também os eventos básicos já produzidos pelo fluxo: geração de recomendações, clique, refinamento solicitado e recomendação refinada.
- Redirecionar diretamente pelo botão “Ver produto”, mesmo se o registro do clique falhar, sem exibir a URL completa.
- Acrescentar ao Dashboard os totais de cliques, cliques dos últimos 7 dias e uma lista simples dos produtos mais clicados.
- Acrescentar a contagem de cliques à listagem administrativa de produtos, incluindo a visualização móvel.

## Segurança e dados
- Permitir que visitantes apenas registrem cliques e eventos, sem consultar métricas ou dados internos.
- Permitir leitura das métricas somente aos administradores autenticados.
- Não coletar nome, e-mail, IP ou outro dado pessoal; a sessão será apenas um identificador aleatório temporário.
- Manter as regras atuais de acesso administrativo e de catálogo.

## Validação
- Confirmar que um produto sem link de afiliado registra o clique e abre a URL do produto.
- Confirmar que um produto com link de afiliado registra o clique e prioriza esse endereço.
- Confirmar o aumento das métricas no Dashboard e na lista de produtos.
- Confirmar que recomendações, refinamentos, IA e painel continuam funcionando sem regressões.

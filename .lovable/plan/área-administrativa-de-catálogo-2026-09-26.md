# Área administrativa de catálogo

## Objetivo
Transformar o painel atual em uma área administrativa completa para gerenciar o catálogo usado pelas recomendações, sem alterar a jornada pública.

## O que será construído
- Manter `/admin` protegido pelo login e pela permissão de administrador já existentes, sem expor links na área pública.
- Criar uma navegação administrativa própria, adaptada para computador e celular, com Dashboard, Produtos e Adicionar produto.
- Criar o dashboard com totais de produtos ativos/inativos, distribuição por categoria e itens cadastrados recentemente.
- Criar `/admin/products` com busca por nome, filtros de categoria/loja/status, ordenação por nome/preço/mais recentes e visualização responsiva em tabela ou cartões.
- Criar `/admin/products/new` e `/admin/products/:id/edit` com validações claras, prévia da imagem e campos de nome, descrição, preço, loja, links, categoria, tags, ocasiões, perfis e status.
- Permitir tags, ocasiões e perfis livres, separados por vírgula, sem listas fechadas.
- Adicionar confirmação antes de excluir, mensagens de sucesso e alteração rápida de status na listagem.
- Garantir que produtos inativos continuem fora das recomendações e que alterações em produtos ativos apareçam no fluxo público.

## Dados e organização
- Acrescentar `profiles` e `updated_at` aos produtos existentes, preservando os 26 itens atuais.
- Centralizar as operações de produto em um serviço administrativo para facilitar uma futura troca por uma API Java/Spring Boot.
- Manter produto e recomendação como estruturas separadas; nenhum score será salvo no catálogo.
- Reutilizar a fonte de catálogo existente, com a base atual como fonte principal e os dados locais apenas como contingência.

## Validação
- Testar com uma sessão administrativa real: dashboard, busca, filtros, cadastro, edição, ativação/desativação e exclusão.
- Confirmar no fluxo público que um produto ativo pode ser recomendado e um inativo não aparece.
- Conferir as telas em larguras de computador e celular e validar que não há erros de execução.

# Cadastros centrais e associações múltiplas

## Objetivo
Centralizar categorias, ocasiões e perfis no painel administrativo, usando somente os valores que já existem no catálogo atual. Produtos poderão ter múltiplos itens de cada tipo, sem alterar tags, IA, links, analytics ou a experiência principal.

## Implementação

1. **Estrutura segura no banco**
   - Criar os cadastros `categories`, `occasions` e `profiles` com nome, status e datas.
   - Criar relações muitos-para-muitos entre produtos e cada cadastro.
   - Aplicar permissões: consulta pública dos dados necessários ao questionário e recomendações; alterações somente para administradores.
   - Impedir exclusão de itens associados a produtos e preservar as associações ao desativar.
   - Manter os campos antigos no banco, marcados como descontinuados, para não interromper a versão publicada durante a transição.

2. **Migração sem perdas**
   - Cadastrar somente categorias, ocasiões e perfis atualmente encontrados nos produtos e nas opções atuais do questionário.
   - Converter o campo atual de categoria em uma ou mais associações, inclusive quando houver vários nomes separados por vírgulas.
   - Copiar todas as ocasiões e perfis atuais para as novas relações.
   - Registrar e comparar antes/depois: produtos, categorias e total de associações.

3. **Serviços centralizados**
   - Criar uma única camada de acesso para listar, criar, editar, ativar/desativar e excluir cada tipo de cadastro.
   - Adaptar o serviço de produtos para carregar e salvar as três relações múltiplas.
   - Sincronizar as associações de forma atômica e autorizada, evitando produtos parcialmente atualizados.

4. **Painel administrativo**
   - Adicionar uma área “Cadastros” com abas para Categorias, Ocasiões e Perfis.
   - Em cada aba: busca, inclusão, edição, status, quantidade de produtos e exclusão com confirmação.
   - Quando um item estiver em uso, bloquear a exclusão e orientar a desativação.
   - Atualizar filtros e listagens de produtos para reconhecer múltiplas categorias.

5. **Formulário de produto**
   - Substituir categoria, ocasiões e perfis livres por seletores múltiplos alimentados pelo banco.
   - Mostrar somente itens ativos para novas associações.
   - Continuar mostrando itens inativos já ligados ao produto, marcados como inativos, até o administrador removê-los.
   - Manter tags como texto livre separado por vírgulas.

6. **Questionário e recomendações**
   - Carregar perfis e ocasiões ativos dos cadastros centrais, mantendo “Outra pessoa” como fallback.
   - Adaptar o catálogo para entregar nomes das relações ao mecanismo determinístico.
   - Fazer qualquer categoria relevante pontuar no motor, sem contar o mesmo conceito duas vezes.
   - Preservar orçamento, refinamentos, feedback, IA e explicações existentes.

7. **Validação**
   - Testar CRUD e bloqueio de exclusão em uso nos três cadastros.
   - Testar criação e edição de produto com múltiplas categorias, ocasiões e perfis.
   - Confirmar que itens inativos não aparecem em novas escolhas, mas associações antigas permanecem.
   - Comparar as contagens migradas e confirmar que todos os produtos e associações continuam disponíveis.
   - Executar testes do motor, fluxo público em computador/celular e verificar o painel responsivo.

## Detalhes técnicos
- Mudança aditiva, com tabelas de relacionamento e chaves estrangeiras restritivas.
- Os nomes continuam sendo fornecidos ao motor para preservar a pontuação existente.
- O catálogo operacional continua vindo exclusivamente do banco; nenhum fallback local será criado.
- A taxonomia inicial será composta apenas pelos valores atuais, conforme decidido.

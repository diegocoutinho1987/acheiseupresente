# Exclusão de produtos em massa

## O que será alterado
- Adicionar uma caixa de seleção ao lado de cada produto na lista administrativa, tanto na tabela quanto nos cartões para celular.
- Adicionar “selecionar todos” para marcar ou desmarcar os produtos atualmente visíveis após busca e filtros.
- Exibir uma ação de exclusão em massa com a quantidade selecionada.
- Pedir confirmação antes de excluir e informar sucesso ou falha ao concluir.
- Manter a exclusão individual e todos os filtros, métricas e demais comportamentos atuais.

## Detalhes técnicos
- Reutilizar o componente de checkbox e o serviço de produtos existentes.
- Executar as exclusões selecionadas em conjunto e atualizar a lista local após a conclusão.
- Limpar seleções que deixarem de existir após exclusão ou recarregamento.

## Validação
- Conferir seleção individual, seleção de todos os itens filtrados, cancelamento e confirmação da exclusão.
- Validar a apresentação em computador e celular sem alterar o restante do painel.

# Catálogo persistente único

## Objetivo
Garantir que o painel administrativo e as recomendações públicas usem exclusivamente o mesmo catálogo persistente já existente no Lovable Cloud, sem alterar o design ou adicionar novas funcionalidades.

## Alterações
- Remover os produtos locais como contingência da leitura pública; o banco passa a ser a única fonte oficial.
- Manter a camada de serviços existente: o painel continua realizando cadastro, edição, exclusão e mudança de status pelo serviço de produtos, e as recomendações consultam o serviço de catálogo.
- Preservar os 26 produtos já migrados e os campos equivalentes existentes (`affiliate_url` como URL do produto e `active` como status).
- Manter produtos inativos visíveis no painel e excluí-los da consulta pública.
- Exibir mensagens claras quando o catálogo não puder ser carregado ou não houver produtos ativos, sem mostrar detalhes técnicos.
- Atualizar a documentação interna para registrar que não existe mais fallback local como fonte operacional.

## Validação
- Conferir persistência e quantidade de produtos no banco.
- Testar com uma sessão administrativa real: criar, editar, desativar, reativar e excluir um produto temporário.
- Confirmar no fluxo público que o produto ativo pode aparecer, que a edição é refletida e que o produto inativo não aparece.
- Confirmar que a aplicação permanece sem erros e que o fluxo e o visual públicos não mudaram.

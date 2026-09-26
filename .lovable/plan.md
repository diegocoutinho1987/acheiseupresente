# Camada de IA para interpretação do perfil

## Resultado
- Preservar integralmente a Home, o questionário, os resultados, os refinamentos, o feedback, o painel administrativo e o catálogo atual.
- Adicionar IA somente entre o texto livre do usuário e o motor determinístico existente.
- Manter os produtos exclusivamente no catálogo persistente; a IA nunca poderá escolher, criar ou alterar produtos, preços ou links.

## Implementação
1. Criar um perfil estruturado com `interests`, `traits`, `lifestyle`, `giftPreferences` e `avoid`.
2. Interpretar a descrição e o campo “O que evitar?” em uma única chamada segura no servidor, com resposta estruturada e validação.
3. Reutilizar esse perfil durante refinamentos e feedbacks, sem repetir a interpretação completa.
4. Incorporar os termos estruturados ao cálculo atual de tags, categoria e exclusões, sem substituir as regras de orçamento, ocasião, destinatário, diversidade ou histórico.
5. Depois do ranking, gerar explicações curtas usando somente respostas do usuário, motivos calculados e dados reais dos produtos selecionados.
6. Se a IA falhar ou estiver indisponível, continuar automaticamente com o motor e as explicações determinísticas atuais.

## Segurança e custo
- Manter chave, prompts e chamadas exclusivamente no servidor.
- Usar o modelo padrão do Lovable AI, resposta estruturada e chamadas agrupadas: uma interpretação por questionário e uma explicação em lote para os resultados.
- Não enviar links de afiliado nem permitir que a IA retorne produtos.

## Validação
- Testar a interpretação estruturada, a influência do perfil no ranking, as exclusões e o fallback.
- Confirmar que refinamentos reutilizam o perfil interpretado.
- Executar uma chamada real do Lovable AI e validar o fluxo completo no navegador, em computador e celular.
- Confirmar que o painel e o banco de produtos permaneceram inalterados.

# Primeiro motor real de recomendações

## Objetivo
Substituir as regras provisórias pelo primeiro ranking determinístico completo, usando somente as respostas do questionário e os produtos ativos do catálogo persistente, sem IA, integrações externas, páginas novas ou mudança relevante de visual.

## Implementação
- Manter o questionário atual e converter a faixa escolhida para `budgetMin` e `budgetMax` dentro do serviço.
- Ampliar o produto usado pelo motor para incluir `occasions` e `profiles`; o adaptador do catálogo passará esses campos já existentes no banco, além de tags e categoria.
- Organizar o motor em funções puras e testáveis para:
  - normalizar caixa, acentos e variações simples de singular/plural;
  - extrair interesses da descrição por um vocabulário explícito de palavras-chave e sinônimos;
  - excluir termos informados em “O que evitar?” comparando nome, descrição, categoria e tags;
  - eliminar produtos acima do teto relevante e pontuar preço dentro ou abaixo da faixa;
  - pontuar ocasião (`+25`), destinatário/perfil (`+20`), tags (`+10` por correspondência), categoria (`+10`) e preço (`+25`, `+15` ou `+5`);
  - ordenar com critérios de desempate estáveis, sem aleatoriedade;
  - diversificar categorias entre resultados de relevância próxima, preservando a prioridade do score;
  - retornar até cinco produtos, sem inventar opções e sem exigir que existam cinco.
- Gerar a explicação a partir dos motivos efetivamente registrados durante a pontuação, sem afirmações que não vieram do perfil ou do produto; o score continuará interno e invisível.
- Fazer os refinamentos existentes alterarem o ranking:
  - “Mais barato” favorece menores preços compatíveis;
  - “Mais criativo”, “Mais útil” e “Mais pessoal” aplicam os conjuntos de tags descritos;
  - “Quero outras opções” exclui, quando houver alternativas, os IDs já apresentados na sessão.
- Fazer o feedback já coletado influenciar a próxima rodada da sessão: preço menor para “Muito caro”, menor repetição/similaridade para “Não combina” e “Já tem algo parecido”, e maior diversidade para “Muito comum” ou “Quero algo diferente”.
- Ajustar somente os textos dinâmicos da tela de resultados: informar a quantidade real quando houver menos de cinco e usar “Não encontramos boas opções para esse perfil.” no estado sem compatíveis, mantendo “Editar respostas”.

## Regras de dados
- Usar exclusivamente produtos ativos vindos do catálogo persistente.
- Não criar produtos, não preencher automaticamente ocasiões/perfis vazios e não salvar score ou recomendação no produto.
- Continuar com `recommendationService.getRecommendations(profile)` como único ponto de entrada do motor e futura troca por uma API Java/Spring Boot.

## Validação
- Criar testes determinísticos para: irmão/tecnologia/café, mãe/casa/cozinha, exclusão por “roupas”, produto inativo, nenhum compatível, menos de cinco resultados, diversificação, cada refinamento e histórico da sessão.
- Validar no navegador o questionário completo, explicações, quantidade variável, ausência de resultados, refinamentos e feedback, em computador e celular.
- Confirmar que o painel administrativo e o visual público permanecem inalterados e que o projeto termina sem erros.

## Observação sobre o catálogo atual
Os 26 produtos estão ativos e possuem tags, mas os campos de ocasiões e perfis estão vazios. O motor já ficará preparado para pontuá-los assim que forem preenchidos pelo Admin; até lá, o ranking real continuará funcionando com orçamento, descrição, tags, categoria e exclusões.

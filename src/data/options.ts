export const RECIPIENTS = ["Mãe", "Pai", "Esposo(a)", "Namorado(a)", "Filho(a)", "Irmão(ã)", "Amigo(a)", "Colega", "Outra pessoa"];

export const OCCASIONS = [
  "Aniversário", "Natal", "Dia dos Namorados", "Casamento", "Formatura",
  "Dia das Mães", "Dia dos Pais", "Outra ocasião", "Sem ocasião específica",
];

export const BUDGETS: { label: string; min: number; max: number }[] = [
  { label: "Até R$50", min: 0, max: 50 },
  { label: "R$50 a R$100", min: 50, max: 100 },
  { label: "R$100 a R$200", min: 100, max: 200 },
  { label: "R$200 a R$500", min: 200, max: 500 },
  { label: "Mais de R$500", min: 500, max: Infinity },
];

export const REFINEMENTS = ["Mais barato", "Mais criativo", "Mais útil", "Mais pessoal", "Quero outras opções"] as const;

export const FEEDBACK_OPTIONS = [
  "Muito caro", "Muito comum", "Não combina com a pessoa",
  "Já tem algo parecido", "Quero algo diferente", "Outro",
];

export const LOADING_MESSAGES = [
  "Pensando em algumas ideias para você...",
  "Analisando o perfil da pessoa...",
  "Encontrando presentes que combinam...",
  "Considerando seu orçamento...",
  "Preparando suas sugestões...",
];

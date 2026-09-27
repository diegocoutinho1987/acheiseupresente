export type QuickSuggestionKey =
  | "mae"
  | "pai"
  | "casamento"
  | "criancas"
  | "homem"
  | "mulher"
  | "namorado"
  | "namorada"
  | "amiga"
  | "esposo";

export interface QuickSuggestion {
  key: QuickSuggestionKey;
  label: string;
  resultTitle: string;
  terms: string[];
  occasionName?: string;
  profileName?: string;
}

export const QUICK_SUGGESTIONS: QuickSuggestion[] = [
  { key: "mae", label: "Presente para mãe", resultTitle: "Presentes para mãe", profileName: "Mãe", terms: ["mãe"] },
  { key: "pai", label: "Presente para o pai", resultTitle: "Presentes para o pai", profileName: "Pai", terms: ["pai"] },
  { key: "casamento", label: "Presente de casamento", resultTitle: "Presentes de casamento", occasionName: "Casamento", terms: ["casamento"] },
  { key: "criancas", label: "Presente Dia das Crianças", resultTitle: "Presentes para o Dia das Crianças", occasionName: "Dia da Criança", terms: ["criança", "infantil"] },
  { key: "homem", label: "Presente para homem", resultTitle: "Presentes para homem", terms: ["homem", "masculino"] },
  { key: "mulher", label: "Presente para mulher", resultTitle: "Presentes para mulher", terms: ["mulher", "feminino"] },
  { key: "namorado", label: "Presente para namorado", resultTitle: "Presentes para namorado", profileName: "Namorado", terms: ["namorado"] },
  { key: "namorada", label: "Presente para namorada", resultTitle: "Presentes para namorada", profileName: "Namorada", terms: ["namorada"] },
  { key: "amiga", label: "Presente para amiga", resultTitle: "Presentes para amiga", profileName: "Amiga", terms: ["amiga"] },
  { key: "esposo", label: "Presente para o esposo", resultTitle: "Presentes para o esposo", profileName: "Esposo", terms: ["esposo"] },
];

export function getQuickSuggestion(key: string): QuickSuggestion | null {
  return QUICK_SUGGESTIONS.find((item) => item.key === key) ?? null;
}

export type QuickSuggestionKey =
  | "namorados"
  | "maes"
  | "pais"
  | "aniversario"
  | "homem"
  | "mulher"
  | "amigo"
  | "amiga"
  | "casal"
  | "crianca";

export interface QuickSuggestion {
  key: QuickSuggestionKey;
  label: string;
  resultTitle: string;
  terms: string[];
  occasionName?: string;
  profileName?: string;
}

export const QUICK_SUGGESTIONS: QuickSuggestion[] = [
  { key: "namorados", label: "Presente para o Dia dos Namorados", resultTitle: "Presentes para o Dia dos Namorados", occasionName: "Dia dos Namorados", terms: ["romântico", "casal"] },
  { key: "maes", label: "Presente para o Dia das Mães", resultTitle: "Presentes para o Dia das Mães", occasionName: "Dia das Mães", terms: ["mãe"] },
  { key: "pais", label: "Presente para o Dia dos Pais", resultTitle: "Presentes para o Dia dos Pais", occasionName: "Dia dos Pais", terms: ["pai"] },
  { key: "aniversario", label: "Presente de Aniversário", resultTitle: "Presentes de Aniversário", occasionName: "Aniversário", terms: ["aniversário"] },
  { key: "homem", label: "Presente para Homem", resultTitle: "Presentes para Homem", terms: ["homem", "masculino"] },
  { key: "mulher", label: "Presente para Mulher", resultTitle: "Presentes para Mulher", terms: ["mulher", "feminino"] },
  { key: "amigo", label: "Presente para Amigo", resultTitle: "Presentes para Amigo", profileName: "Amigo", terms: ["amigo"] },
  { key: "amiga", label: "Presente para Amiga", resultTitle: "Presentes para Amiga", profileName: "Amiga", terms: ["amiga"] },
  { key: "casal", label: "Presente para Casal", resultTitle: "Presentes para Casal", profileName: "Casal", terms: ["casal", "romântico"] },
  { key: "crianca", label: "Presente para Criança", resultTitle: "Presentes para Criança", terms: ["criança", "infantil"] },
];

export function getQuickSuggestion(key: string): QuickSuggestion | null {
  return QUICK_SUGGESTIONS.find((item) => item.key === key) ?? null;
}

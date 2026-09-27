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

export type QuickSuggestionType = "profile" | "occasion" | "generic";

export interface QuickSuggestion {
  key: QuickSuggestionKey;
  label: string;
  resultTitle: string;
  type: QuickSuggestionType;
  explanation: string;
  profileName?: string;
  occasionName?: string;
  gender?: "male" | "female";
}

export const QUICK_SUGGESTIONS: QuickSuggestion[] = [
  { key: "mae", label: "Presente para mãe", resultTitle: "Presentes para mãe", type: "profile", profileName: "Mãe", explanation: "Uma opção pensada para presentear sua mãe." },
  { key: "pai", label: "Presente para o pai", resultTitle: "Presentes para o pai", type: "profile", profileName: "Pai", explanation: "Uma ideia para presentear seu pai." },
  { key: "casamento", label: "Presente de casamento", resultTitle: "Presentes de casamento", type: "occasion", occasionName: "Casamento", explanation: "Uma opção que combina com uma ocasião especial como o casamento." },
  { key: "criancas", label: "Presente Dia das Crianças", resultTitle: "Presentes para o Dia das Crianças", type: "occasion", occasionName: "Dia da Criança", explanation: "Uma ideia pensada para uma ocasião especial como o Dia das Crianças." },
  { key: "homem", label: "Presente para homem", resultTitle: "Presentes para homem", type: "generic", gender: "male", explanation: "Uma opção para presentear um homem." },
  { key: "mulher", label: "Presente para mulher", resultTitle: "Presentes para mulher", type: "generic", gender: "female", explanation: "Uma opção para presentear uma mulher." },
  { key: "namorado", label: "Presente para namorado", resultTitle: "Presentes para namorado", type: "profile", profileName: "Namorado", explanation: "Uma ideia para surpreender seu namorado." },
  { key: "namorada", label: "Presente para namorada", resultTitle: "Presentes para namorada", type: "profile", profileName: "Namorada", explanation: "Uma ideia para surpreender sua namorada." },
  { key: "amiga", label: "Presente para amiga", resultTitle: "Presentes para amiga", type: "profile", profileName: "Amiga", explanation: "Uma opção para presentear sua amiga." },
  { key: "esposo", label: "Presente para o esposo", resultTitle: "Presentes para o esposo", type: "profile", profileName: "Esposo", explanation: "Uma ideia para presentear seu esposo." },
];

export function getQuickSuggestion(key: string): QuickSuggestion | null {
  return QUICK_SUGGESTIONS.find((item) => item.key === key) ?? null;
}

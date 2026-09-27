export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  store: string;
  image: string;
  url: string;
  productUrl?: string;
  affiliateUrl?: string;
  category: string;
  categories: string[];
  tags: string[];
  occasions: string[];
  profiles: string[];
  active: boolean;
}

export interface Recommendation {
  product: Product;
  reasons: string[];
  explanation: string;
  /** Uso interno para ranking — nunca exibir ao usuário. */
  score: number;
}

export interface StructuredGiftProfile {
  interests: string[];
  traits: string[];
  lifestyle: string[];
  giftPreferences: string[];
  avoid: string[];
}

export type Refinement =
  | ""
  | "Mais barato"
  | "Mais criativo"
  | "Mais útil"
  | "Mais pessoal"
  | "Quero outras opções";

export interface GiftProfile {
  recipient: string;
  occasion: string;
  budget: string;
  description: string;
  avoid: string;
  refinement: Refinement;
  feedback: string[];
  structuredProfile?: StructuredGiftProfile | null;
}

export const emptyProfile: GiftProfile = {
  recipient: "",
  occasion: "",
  budget: "",
  description: "",
  avoid: "",
  refinement: "",
  feedback: [],
  structuredProfile: null,
};

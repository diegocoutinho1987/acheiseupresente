export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  store: string;
  image: string;
  url: string;
  category: string;
  tags: string[];
}

export interface Recommendation {
  product: Product;
  reason: string;
  /** Uso interno para ranking — nunca exibir ao usuário. */
  matchScore?: number;
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
}

export const emptyProfile: GiftProfile = {
  recipient: "",
  occasion: "",
  budget: "",
  description: "",
  avoid: "",
  refinement: "",
  feedback: [],
};

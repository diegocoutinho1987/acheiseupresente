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
  categories?: string[];
  categoryIds?: string[];
  tags: string[];
  occasions: string[];
  occasionIds?: string[];
  profiles: string[];
  profileIds?: string[];
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
  recipientText: string;
  recipientId: string | null;
  occasion: string;
  occasionText: string;
  occasionId: string | null;
  budget: string;
  description: string;
  avoid: string;
  refinement: Refinement;
  feedback: string[];
  structuredProfile?: StructuredGiftProfile | null;
  taxonomyOptions?: { profiles: { id: string; name: string }[]; occasions: { id: string; name: string }[] };
}

export const emptyProfile: GiftProfile = {
  recipient: "",
  recipientText: "",
  recipientId: null,
  occasion: "",
  occasionText: "",
  occasionId: null,
  budget: "",
  description: "",
  avoid: "",
  refinement: "",
  feedback: [],
  structuredProfile: null,
};

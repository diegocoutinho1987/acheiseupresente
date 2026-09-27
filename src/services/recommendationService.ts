import type { GiftProfile, Recommendation } from "@/types";
import { getCatalog } from "@/services/catalogService";
import { rankProducts } from "@/services/recommendationEngine";
import { interpretGiftProfile, personalizeRecommendationExplanations, resolveGiftTaxonomies } from "@/services/giftAi.functions";

function fallbackExplanation(profile: GiftProfile, product: Recommendation["product"]): string {
  const category = product.category?.trim();
  if (category) return `Pode ser uma boa escolha para quem gosta de ${category.toLowerCase()}.`;
  if (profile.occasion?.trim()) return `Pode ser uma boa opção para essa ocasião.`;
  return "Pode ser uma boa opção para presentear.";
}

const FORBIDDEN_EXPLANATION_PATTERNS = [
  "orçamento", "foi associado", "foi associada", "foi associado(a)",
  "sem ligação direta com os interesses informados", "perfil", "com base no perfil",
  "de acordo com o perfil", "seu perfil", "interesses informados", "correspondência",
  "corresponde", "algoritmo", "analisamos", "identificamos",
];

function validExplanation(value: string): boolean {
  const text = value.trim();
  const lower = text.toLocaleLowerCase("pt-BR");
  return text.length > 0 && text.length <= 130 && !FORBIDDEN_EXPLANATION_PATTERNS.some((term) => lower.includes(term));
}

export interface RecommendationResult {
  recommendations: Recommendation[];
  profile: GiftProfile;
}

export async function getRecommendations(input: GiftProfile, previousIds: string[] = [], limit = 3, options: RecommendationOptions = {}): Promise<RecommendationResult> {
  let profile = input;
  if (input.taxonomyOptions) {
    try {
      const resolved = await resolveGiftTaxonomies({ data: { recipient: input.recipientText || input.recipient, occasion: input.occasionText || input.occasion, profiles: input.taxonomyOptions.profiles, occasions: input.taxonomyOptions.occasions } });
      const fallbackProfile = input.taxonomyOptions.profiles.find((item) => item.name === "Outra pessoa");
      const fallbackOccasion = input.taxonomyOptions.occasions.find((item) => /sem ocasião específica/i.test(item.name));
      const profileOption = input.taxonomyOptions.profiles.find((item) => item.id === resolved.profileId) ?? fallbackProfile;
      const occasionOption = input.taxonomyOptions.occasions.find((item) => item.id === resolved.occasionId) ?? fallbackOccasion;
      profile = { ...profile, recipient: profileOption?.name ?? input.recipient, recipientId: profileOption?.id ?? null, occasion: occasionOption?.name ?? input.occasion, occasionId: occasionOption?.id ?? null };
    } catch { profile = { ...input, recipientId: null, occasionId: null }; }
  }
  if (!input.structuredProfile) {
    try {
      const structuredProfile = await interpretGiftProfile({ data: {
        recipient: profile.recipient,
        description: profile.description,
        avoid: profile.avoid,
      } });
      profile = { ...profile, structuredProfile };
    } catch {
      profile = { ...input, structuredProfile: null };
    }
  }
  const catalog = await getCatalog();
  const recommendations = rankProducts(catalog, profile, previousIds, limit);
  try {
    const explanations = await withTimeout(\n      personalizeRecommendationExplanations({ data: { profile, recommendations } }),\n      options.explanationTimeoutMs,\n    );
    return {
      profile,
      recommendations: recommendations.map((item) => ({
        ...item,
        explanation: validExplanation(explanations[item.product.id] ?? "") ? explanations[item.product.id].trim() : fallbackExplanation(profile, item.product),
      })),
    };
  } catch {
    return { profile, recommendations: recommendations.map((item) => ({ ...item, explanation: validExplanation(item.explanation) ? item.explanation : fallbackExplanation(profile, item.product) })) };
  }
}

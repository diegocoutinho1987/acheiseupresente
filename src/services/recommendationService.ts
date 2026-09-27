import type { GiftProfile, Recommendation } from "@/types";
import { getCatalog } from "@/services/catalogService";
import { rankProducts } from "@/services/recommendationEngine";
import { interpretGiftProfile, personalizeRecommendationExplanations, resolveGiftTaxonomies } from "@/services/giftAi.functions";

export interface RecommendationResult {
  recommendations: Recommendation[];
  profile: GiftProfile;
}

export async function getRecommendations(input: GiftProfile, previousIds: string[] = []): Promise<RecommendationResult> {
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
  const recommendations = rankProducts(catalog, profile, previousIds);
  try {
    const explanations = await personalizeRecommendationExplanations({ data: { profile, recommendations } });
    return {
      profile,
      recommendations: recommendations.map((item) => ({
        ...item,
        explanation: explanations[item.product.id] ?? item.explanation,
      })),
    };
  } catch {
    return { profile, recommendations };
  }
}

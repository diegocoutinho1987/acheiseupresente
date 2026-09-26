import type { GiftProfile, Recommendation } from "@/types";
import { getCatalog } from "@/services/catalogService";
import { rankProducts } from "@/services/recommendationEngine";
import { interpretGiftProfile, personalizeRecommendationExplanations } from "@/services/giftAi.functions";

export interface RecommendationResult {
  recommendations: Recommendation[];
  profile: GiftProfile;
}

export async function getRecommendations(input: GiftProfile, previousIds: string[] = []): Promise<RecommendationResult> {
  let profile = input;
  if (!input.structuredProfile) {
    try {
      const structuredProfile = await interpretGiftProfile({ data: {
        recipient: input.recipient,
        description: input.description,
        avoid: input.avoid,
      } });
      profile = { ...input, structuredProfile };
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

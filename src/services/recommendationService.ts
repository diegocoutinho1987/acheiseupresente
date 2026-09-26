import type { GiftProfile, Recommendation } from "@/types";
import { getCatalog } from "@/services/catalogService";
import { rankProducts } from "@/services/recommendationEngine";

export async function getRecommendations(input: GiftProfile, previousIds: string[] = []): Promise<Recommendation[]> {
  const catalog = await getCatalog();
  return rankProducts(catalog, input, previousIds);
}

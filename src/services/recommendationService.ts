import type { GiftProfile, Recommendation } from "@/types";
import { getCatalog } from "@/services/catalogService";
import { rankProducts } from "@/services/recommendationEngine";
import { interpretGiftProfile, personalizeRecommendationExplanations, resolveGiftTaxonomies } from "@/services/giftAi.functions";

function fallbackExplanation(profile: GiftProfile, product: Recommendation["product"]): string {
  const description = product.description?.trim().split(/[.!?]/)[0]?.trim();
  const occasion = profile.occasion?.trim();
  const recipient = profile.recipient?.trim();
  const noun = product.category?.trim().toLowerCase() || product.name.trim();

  if (occasion && description) {
    return shortenFallback(`Eu consideraria este ${noun} para ${occasion.toLowerCase()} porque ${description.toLowerCase()}.`);
  }
  if (recipient && description) {
    return shortenFallback(`Eu consideraria este ${noun} para ${recipient.toLowerCase()} porque ${description.toLowerCase()}.`);
  }
  if (description) {
    return shortenFallback(`Eu consideraria este presente porque ${description.toLowerCase()}.`);
  }
  return `Eu consideraria este presente pelo que ele oferece no contexto desta busca.`;
}

function shortenFallback(value: string): string {
  const text = value.trim();
  if (text.length <= 130) return text;
  const words = text.slice(0, 127).trimEnd().split(/\s+/);
  words.pop();
  return `${words.join(" ")}...`;
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

export interface RecommendationOptions {
  explanationTimeoutMs?: number;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs?: number): Promise<T> {
  if (!timeoutMs || timeoutMs <= 0) return promise;

  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Recommendation explanation timeout")), timeoutMs),
    ),
  ]);
}

export async function getRecommendations(
  input: GiftProfile,
  previousIds: string[] = [],
  limit = 3,
  options: RecommendationOptions = {},
): Promise<RecommendationResult> {
  let profile = input;

  if (input.taxonomyOptions) {
    try {
      const resolved = await resolveGiftTaxonomies({
        data: {
          recipient: input.recipientText || input.recipient,
          occasion: input.occasionText || input.occasion,
          profiles: input.taxonomyOptions.profiles,
          occasions: input.taxonomyOptions.occasions,
        },
      });

      const fallbackProfile = input.taxonomyOptions.profiles.find((item) => item.name === "Outra pessoa");
      const fallbackOccasion = input.taxonomyOptions.occasions.find((item) => /sem ocasião específica/i.test(item.name));
      const profileOption = input.taxonomyOptions.profiles.find((item) => item.id === resolved.profileId) ?? fallbackProfile;
      const occasionOption = input.taxonomyOptions.occasions.find((item) => item.id === resolved.occasionId) ?? fallbackOccasion;

      profile = {
        ...profile,
        recipient: profileOption?.name ?? input.recipient,
        recipientId: profileOption?.id ?? null,
        occasion: occasionOption?.name ?? input.occasion,
        occasionId: occasionOption?.id ?? null,
      };
    } catch {
      profile = { ...input, recipientId: null, occasionId: null };
    }
  }

  if (!input.structuredProfile) {
    try {
      const structuredProfile = await interpretGiftProfile({
        data: {
          recipient: profile.recipient,
          description: profile.description,
          avoid: profile.avoid,
        },
      });
      profile = { ...profile, structuredProfile };
    } catch {
      profile = { ...input, structuredProfile: null };
    }
  }

  const catalog = await getCatalog();
  const recommendations = rankProducts(catalog, profile, previousIds, limit);

  try {
    const explanations = await withTimeout(
      personalizeRecommendationExplanations({ data: { profile, recommendations } }),
      options.explanationTimeoutMs,
    );

    return {
      profile,
      recommendations: recommendations.map((item) => ({
        ...item,
        explanation: validExplanation(explanations[item.product.id] ?? "")
          ? explanations[item.product.id].trim()
          : fallbackExplanation(profile, item.product),
      })),
    };
  } catch {
    return {
      profile,
      recommendations: recommendations.map((item) => ({
        ...item,
        explanation: validExplanation(item.explanation)
          ? item.explanation
          : fallbackExplanation(profile, item.product),
      })),
    };
  }
}

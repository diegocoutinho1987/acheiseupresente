import type { GiftProfile, Product, Recommendation } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { personalizeRecommendationExplanations } from "@/services/giftAi.functions";
import type { QuickSuggestion } from "@/data/quickSuggestions";
import { rankProducts } from "@/services/recommendationEngine";
import { getRecommendationSessionId } from "@/services/analytics";

const QUICK_TIMEOUT_MS = 10_000;
const QUICK_LIMIT = 6;

export type QuickSuggestionContext =
  | {
      key: string;
      label: string;
      explanation: string;
      type: "profile";
      profileName: string;
      excludeIds?: string[];
    }
  | {
      key: string;
      label: string;
      explanation: string;
      type: "occasion";
      occasionName: string;
      excludeIds?: string[];
    }
  | {
      key: string;
      label: string;
      explanation: string;
      type: "generic";
      gender: "male" | "female";
      excludeIds?: string[];
    };

export class QuickSuggestionUserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuickSuggestionUserError";
  }
}

function logStart(stage: string) {
  if (import.meta.env.DEV) console.info(`[QUICK] START ${stage}`);
}

function logSuccess(stage: string) {
  if (import.meta.env.DEV) console.info(`[QUICK] SUCCESS ${stage}`);
}

function logError(stage: string, error: unknown) {
  if (import.meta.env.DEV) console.error(`[QUICK] ERROR ${stage}`, error);
}

async function withTimeout<T>(
  promise: PromiseLike<T> | Promise<T>,
  stage: string,
  timeoutMs = QUICK_TIMEOUT_MS,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
          reject(new QuickSuggestionUserError(`Timeout na consulta de ${stage}`));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function toProduct(row: {
  id: string;
  name: string;
  description: string;
  price: number;
  store: string;
  image_url: string | null;
  product_url: string;
  affiliate_url: string;
  category: string;
  tags: string[];
  occasions: string[];
  profiles: string[];
  active: boolean;
}): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    store: row.store,
    image: row.image_url ?? "",
    url: row.affiliate_url || row.product_url,
    productUrl: row.product_url,
    affiliateUrl: row.affiliate_url,
    category: row.category,
    categories: row.category ? [row.category] : [],
    tags: row.tags ?? [],
    occasions: row.occasions ?? [],
    profiles: row.profiles ?? [],
    active: row.active,
  };
}

export function createQuickSuggestionContext(
  suggestion: QuickSuggestion,
): QuickSuggestionContext {
  if (suggestion.type === "generic") {
    if (!suggestion.gender) {
      throw new QuickSuggestionUserError("Essa sugestão rápida não possui um contexto válido.");
    }

    return {
      key: suggestion.key,
      label: suggestion.label,
      explanation: suggestion.explanation,
      type: "generic",
      gender: suggestion.gender,
    };
  }

  if (suggestion.type === "profile") {
    if (!suggestion.profileName) {
      throw new QuickSuggestionUserError("Essa sugestão rápida não possui um perfil válido.");
    }

    return {
      key: suggestion.key,
      label: suggestion.label,
      explanation: suggestion.explanation,
      type: "profile",
      profileName: suggestion.profileName,
    };
  }

  if (!suggestion.occasionName) {
    throw new QuickSuggestionUserError("Essa sugestão rápida não possui uma ocasião válida.");
  }

  return {
    key: suggestion.key,
    label: suggestion.label,
    explanation: suggestion.explanation,
    type: "occasion",
    occasionName: suggestion.occasionName,
  };
}

async function resolveProfile(profileName: string): Promise<{ id: string; name: string }> {
  const stage = "resolve_profile";
  logStart(stage);

  try {
    const { data, error } = await withTimeout(
      supabase
        .from("profiles")
        .select("id,name")
        .eq("name", profileName)
        .eq("active", true)
        .maybeSingle(),
      stage,
    );

    if (error) throw error;
    if (!data) {
      throw new QuickSuggestionUserError(`Não encontramos o perfil ${profileName} no catálogo.`);
    }

    logSuccess(stage);
    return data;
  } catch (error) {
    logError(stage, error);
    throw error;
  }
}

async function resolveOccasion(occasionName: string): Promise<{ id: string; name: string }> {
  const stage = "resolve_occasion";
  logStart(stage);

  try {
    const { data, error } = await withTimeout(
      supabase
        .from("occasions")
        .select("id,name")
        .eq("name", occasionName)
        .eq("active", true)
        .maybeSingle(),
      stage,
    );

    if (error) throw error;
    if (!data) {
      throw new QuickSuggestionUserError(`Não encontramos a ocasião ${occasionName} no catálogo.`);
    }

    logSuccess(stage);
    return data;
  } catch (error) {
    logError(stage, error);
    throw error;
  }
}

async function getRelations(
  type: "profile" | "occasion",
  taxonomyId: string,
): Promise<string[]> {
  const stage = "get_product_relations";
  logStart(stage);

  try {
    const query =
      type === "profile"
        ? supabase.from("product_profiles").select("product_id").eq("profile_id", taxonomyId)
        : supabase.from("product_occasions").select("product_id").eq("occasion_id", taxonomyId);

    const { data, error } = await withTimeout(query, stage);

    if (error) throw error;

    const productIds = [...new Set((data ?? []).map((item) => item.product_id))];

    logSuccess(stage);
    return productIds;
  } catch (error) {
    logError(stage, error);
    throw error;
  }
}

async function getProducts(productIds?: string[]): Promise<Product[]> {
  const stage = "get_products";
  logStart(stage);

  try {
    const query = supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false });

    const scopedQuery = productIds
      ? productIds.length
        ? query.in("id", productIds)
        : null
      : query;

    if (!scopedQuery) {
      logSuccess(stage);
      return [];
    }

    const { data, error } = await withTimeout(scopedQuery, stage);

    if (error) throw error;

    const products = (data ?? []).map(toProduct);
    logSuccess(stage);
    return products;
  } catch (error) {
    logError(stage, error);
    throw error;
  }
}

function buildQuickProfile(
  context: QuickSuggestionContext,
  taxonomy: { profileId: string | null; occasionId: string | null },
): GiftProfile {
  const terms =
    context.type === "profile"
      ? [context.profileName]
      : context.type === "occasion"
        ? [context.occasionName]
        : [context.gender === "male" ? "homem" : "mulher"];

  return {
    recipient:
      context.type === "profile"
        ? context.profileName
        : context.type === "generic"
          ? context.label
          : "",
    recipientText: "",
    recipientId: taxonomy.profileId,
    occasion: context.type === "occasion" ? context.occasionName : "",
    occasionText: "",
    occasionId: taxonomy.occasionId,
    budget: "Qualquer valor",
    description: context.label,
    avoid: "",
    refinement: "",
    feedback: [],
    structuredProfile: {
      interests: [],
      traits: [],
      lifestyle: [],
      giftPreferences: [],
      avoid: [],
    },
    quickContext: {
      key: context.key,
      label: context.label,
      terms,
    },
  };
}

export async function getQuickSuggestions(
  context: QuickSuggestionContext,
): Promise<Recommendation[]> {
  if (!context || !context.type) {
    throw new QuickSuggestionUserError("Contexto da sugestão rápida inválido.");
  }

  let products: Product[];
  let profileId: string | null = null;
  let occasionId: string | null = null;

  if (context.type === "profile") {
    const profile = await resolveProfile(context.profileName);
    profileId = profile.id;
    const productIds = await getRelations("profile", profile.id);
    products = await getProducts(productIds);
  } else if (context.type === "occasion") {
    const occasion = await resolveOccasion(context.occasionName);
    occasionId = occasion.id;
    const productIds = await getRelations("occasion", occasion.id);
    products = await getProducts(productIds);
  } else {
    products = await getProducts();
  }

  const sessionId = getRecommendationSessionId();
  const profileContext = buildQuickProfile(context, { profileId, occasionId });

  logStart("select_results");
  try {
    const recommendations = rankProducts(
      products,
      profileContext,
      context.excludeIds ?? [],
      QUICK_LIMIT,
      sessionId,
    );

    if (import.meta.env.DEV) {
      console.info("[QUICK] pool/selection", {
        eligibleProducts: products.length,
        selectedProducts: recommendations.map((item) => item.product.id),
        scores: recommendations.map((item) => ({ id: item.product.id, score: item.score })),
        categories: recommendations.map((item) => item.product.category),
        sessionId,
      });
    }

    logSuccess("select_results");

    try {
      const explanations = await withTimeout(
        personalizeRecommendationExplanations({
          data: { profile: profileContext, recommendations },
        }),
        "gerar_explicacoes",
      );

      return recommendations.map((item) => ({
        ...item,
        explanation: explanations[item.product.id]?.trim() || item.explanation,
      }));
    } catch (error) {
      logError("gerar_explicacoes", error);
      return recommendations;
    }
  } catch (error) {
    logError("select_results", error);
    throw error;
  }
}

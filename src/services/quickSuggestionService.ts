import type { Product, Recommendation } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { personalizeRecommendationExplanations } from "@/services/giftAi.functions";
import type { QuickSuggestion } from "@/data/quickSuggestions";

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
  console.info(`[QUICK] START ${stage}`);
}

function logSuccess(stage: string) {
  console.info(`[QUICK] SUCCESS ${stage}`);
}

function logError(stage: string, error: unknown) {
  console.error(`[QUICK] ERROR ${stage}`, error);
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

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

const GENDER_TERMS = {
  male: ["homem", "masculino", "pai", "namorado", "esposo", "marido"],
  female: ["mulher", "feminino", "mae", "namorada", "esposa", "amiga"],
} as const;

function matchesGender(product: Product, gender: "male" | "female"): boolean {
  const text = normalize([
    product.name,
    product.description,
    product.category,
    ...product.tags,
    ...product.profiles,
    ...product.occasions,
  ].join(" "));

  return GENDER_TERMS[gender].some((term) => text.split(/\\s+/).includes(term));
}

function selectResults(products: Product[], excludeIds: Set<string>): Product[] {
  const unique = products.filter(
    (product, index, all) =>
      !excludeIds.has(product.id) &&
      all.findIndex((candidate) => candidate.id === product.id) === index,
  );

  const selected: Product[] = [];
  const usedCategories = new Set<string>();

  for (const product of unique) {
    if (selected.length >= QUICK_LIMIT) break;

    const category = normalize(product.category);
    if (category && !usedCategories.has(category)) {
      selected.push(product);
      usedCategories.add(category);
    }
  }

  for (const product of unique) {
    if (selected.length >= QUICK_LIMIT) break;
    if (!selected.some((item) => item.id === product.id)) selected.push(product);
  }

  return selected;
}

function toRecommendation(product: Product, explanation: string): Recommendation {
  return {
    product,
    reasons: [],
    explanation,
    score: 0,
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

async function getProducts(productIds: string[]): Promise<Product[]> {
  const stage = "get_products";
  logStart(stage);

  try {
    if (productIds.length === 0) {
      logSuccess(stage);
      return [];
    }

    const { data, error } = await withTimeout(
      supabase
        .from("products")
        .select("*")
        .in("id", productIds)
        .eq("active", true)
        .order("created_at", { ascending: false }),
      stage,
    );

    if (error) throw error;

    const products = (data ?? []).map(toProduct);
    logSuccess(stage);
    return products;
  } catch (error) {
    logError(stage, error);
    throw error;
  }
}

function selectResultsWithLog(products: Product[], excludeIds: string[] = []): Product[] {
  const stage = "select_results";
  logStart(stage);

  try {
    const selected = selectResults(products, new Set(excludeIds));
    logSuccess(stage);
    return selected;
  } catch (error) {
    logError(stage, error);
    throw error;
  }
}

export async function getQuickSuggestions(
  context: QuickSuggestionContext,
): Promise<Recommendation[]> {
  if (!context || !context.type) {
    throw new QuickSuggestionUserError("Contexto da sugestão rápida inválido.");
  }

  let products: Product[];

  if (context.type === "profile") {
    const profile = await resolveProfile(context.profileName);
    const productIds = await getRelations("profile", profile.id);
    products = await getProducts(productIds);
  } else if (context.type === "occasion") {
    const occasion = await resolveOccasion(context.occasionName);
    const productIds = await getRelations("occasion", occasion.id);
    products = await getProducts(productIds);
  } else {
    const stage = "get_products";
    logStart(stage);

    try {
      const { data, error } = await withTimeout(
        supabase.from("products").select("*").eq("active", true).order("created_at", { ascending: false }),
        stage,
      );

      if (error) throw error;

      const mappedProducts = (data ?? []).map(toProduct);
      const genderProducts = mappedProducts.filter((product) => matchesGender(product, context.gender));
      products = genderProducts.length ? [...genderProducts, ...mappedProducts] : mappedProducts;
      logSuccess(stage);
    } catch (error) {
      logError(stage, error);
      throw error;
    }
  }

  const selected = selectResultsWithLog(products, context.excludeIds);
  const recommendations = selected.map((product) => toRecommendation(product, context.explanation));

  try {
    const profileContext = {
      recipient: context.type === "profile" ? context.profileName : context.type === "generic" ? context.label : "",
      recipientText: "",
      recipientId: null,
      occasion: context.type === "occasion" ? context.occasionName : "",
      occasionText: "",
      occasionId: null,
      budget: "Qualquer valor",
      description: context.label,
      avoid: "",
      refinement: "",
      feedback: [],
      structuredProfile: { interests: [], traits: [], lifestyle: [], giftPreferences: [], avoid: [] },
      quickContext: { key: context.key, label: context.label, terms: [] },
    } as const;

    try {
      const explanations = await withTimeout(
        personalizeRecommendationExplanations({ data: { profile: profileContext, recommendations } }),
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
    logError("gerar_explicacoes", error);
    return recommendations;
  }
}

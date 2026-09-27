import type { Product, Recommendation } from "@/types";
import { getActiveProducts, getActiveProductsByOccasion, getActiveProductsByProfile, type AdminProduct } from "@/services/productService";
import { getActiveTaxonomyOptions } from "@/services/taxonomyService";
import type { QuickSuggestion } from "@/data/quickSuggestions";

export type QuickSuggestionContext =
  | { key: string; label: string; explanation: string; type: "profile"; profileId: string; profileName: string; excludeIds?: string[] }
  | { key: string; label: string; explanation: string; type: "occasion"; occasionId: string; occasionName: string; excludeIds?: string[] }
  | { key: string; label: string; explanation: string; type: "generic"; gender: "male" | "female"; excludeIds?: string[] };

export type QuickSuggestionDiagnosticStage =
  | "received_context"
  | "resolve_profile_or_occasion"
  | "query_relationship"
  | "query_products"
  | "filter_active_products"
  | "select_products"
  | "prepare_results"
  | "render_results";

export interface QuickSuggestionDiagnostic {
  stage: QuickSuggestionDiagnosticStage;
  context: QuickSuggestionContext["type"] | "unknown";
  id?: string;
  table?: string;
  query?: string;
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

export class QuickSuggestionDiagnosticError extends Error {
  diagnostic: QuickSuggestionDiagnostic;

  constructor(diagnostic: QuickSuggestionDiagnostic) {
    super(diagnostic.message);
    this.name = "QuickSuggestionDiagnosticError";
    this.diagnostic = diagnostic;
  }
}

function errorField(error: unknown, field: "message" | "code" | "details" | "hint"): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const value = (error as Record<string, unknown>)[field];
  return value == null || value === "" ? undefined : String(value);
}

function toDiagnosticError(
  error: unknown,
  details: Omit<QuickSuggestionDiagnostic, "message" | "code" | "details" | "hint">,
): QuickSuggestionDiagnosticError {
  return new QuickSuggestionDiagnosticError({
    ...details,
    message: errorField(error, "message") ?? (error instanceof Error ? error.message : String(error)),
    code: errorField(error, "code"),
    details: errorField(error, "details"),
    hint: errorField(error, "hint"),
  });
}

function normalize(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\(a\)/g, "").replace(/\s+/g, " ").trim();
}

function matchesTaxonomyName(left: string, right: string): boolean {
  const words = (value: string) => normalize(value).split(" ").filter((word) => !["da", "das", "do", "dos", "de"].includes(word)).map((word) => (word.length > 5 && word.endsWith("s") ? word.slice(0, -1) : word));
  const a = words(left);
  const b = words(right);
  return a.length === b.length && a.every((word, index) => word === b[index]);
}

function toProduct(product: AdminProduct): Product {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    store: product.store,
    image: product.image_url ?? "",
    url: product.affiliate_url || product.product_url,
    productUrl: product.product_url,
    affiliateUrl: product.affiliate_url,
    category: product.categoryNames[0] ?? product.category,
    categories: product.categoryNames.length ? product.categoryNames : [product.category],
    categoryIds: product.categoryIds,
    tags: product.tags ?? [],
    occasions: product.occasionNames,
    occasionIds: product.occasionIds,
    profiles: product.profileNames,
    profileIds: product.profileIds,
    active: product.active,
  };
}

function productSearchText(product: Product): string {
  return normalize([product.name, product.description, product.category, ...(product.categories ?? []), ...product.tags, ...product.profiles, ...product.occasions].join(" "));
}

const GENDER_TERMS = {
  male: ["homem", "masculino", "pai", "namorado", "esposo", "marido"] as const,
  female: ["mulher", "feminino", "mae", "namorada", "esposa", "amiga"] as const,
};

function matchesGender(product: Product, gender: "male" | "female"): boolean {
  const text = productSearchText(product);
  return GENDER_TERMS[gender].some((term) => new RegExp(`\\b${term}\\b`).test(text));
}

function diversify(products: Product[], limit: number, excludeIds: Set<string>): Product[] {
  const unique = products.filter((product, index, all) => !excludeIds.has(product.id) && all.findIndex((candidate) => candidate.id === product.id) === index);
  const selected: Product[] = [];
  const usedCategories = new Set<string>();

  for (const product of unique) {
    if (selected.length >= limit) break;
    const categories = (product.categories ?? [product.category]).map(normalize).filter(Boolean);
    if (categories.some((category) => !usedCategories.has(category))) {
      selected.push(product);
      categories.forEach((category) => usedCategories.add(category));
    }
  }

  for (const product of unique) {
    if (selected.length >= limit) break;
    if (!selected.some((item) => item.id === product.id)) selected.push(product);
  }

  return selected;
}

function toRecommendation(product: Product, explanation: string): Recommendation {
  return { product, reasons: [], explanation, score: 0 };
}

export async function resolveQuickSuggestionContext(suggestion: QuickSuggestion): Promise<QuickSuggestionContext> {
  if (suggestion.type === "generic") {
    if (!suggestion.gender) throw new Error(`Sugestão rápida genérica sem gênero: ${suggestion.key}`);
    return { key: suggestion.key, label: suggestion.label, explanation: suggestion.explanation, type: "generic", gender: suggestion.gender };
  }

  if (suggestion.type === "profile") {
    if (!suggestion.profileName) throw new Error(`Sugestão rápida sem perfil: ${suggestion.key}`);
    try {
      const profiles = await getActiveTaxonomyOptions("profiles");
      const profile = profiles.find((item) => matchesTaxonomyName(item.name, suggestion.profileName));
      if (!profile) throw new Error(`Perfil não encontrado: ${suggestion.profileName}`);
      return { key: suggestion.key, label: suggestion.label, explanation: suggestion.explanation, type: "profile", profileId: profile.id, profileName: profile.name };
    } catch (error) {
      if (error instanceof QuickSuggestionDiagnosticError) throw error;
      throw toDiagnosticError(error, {
        stage: "resolve_profile_or_occasion",
        context: "profile",
        table: "profiles",
        query: `select id,name from profiles where active = true and questionnaire_visible = true; localizar "${suggestion.profileName}"`,
      });
    }
  }

  if (!suggestion.occasionName) throw new Error(`Sugestão rápida sem ocasião: ${suggestion.key}`);
  try {
    const occasions = await getActiveTaxonomyOptions("occasions");
    const occasion = occasions.find((item) => matchesTaxonomyName(item.name, suggestion.occasionName));
    if (!occasion) throw new Error(`Ocasião não encontrada: ${suggestion.occasionName}`);
    return { key: suggestion.key, label: suggestion.label, explanation: suggestion.explanation, type: "occasion", occasionId: occasion.id, occasionName: occasion.name };
  } catch (error) {
    if (error instanceof QuickSuggestionDiagnosticError) throw error;
    throw toDiagnosticError(error, {
      stage: "resolve_profile_or_occasion",
      context: "occasion",
      table: "occasions",
      query: `select id,name from occasions where active = true and questionnaire_visible = true; localizar "${suggestion.occasionName}"`,
    });
  }
}

export async function getQuickSuggestions(context: QuickSuggestionContext): Promise<Recommendation[]> {
  if (!context || !context.type) {
    throw toDiagnosticError(new Error("Contexto de sugestão rápida inválido"), {
      stage: "received_context",
      context: "unknown",
    });
  }

  let products: Product[];

  if (context.type === "profile") {
    let activeProducts: AdminProduct[];
    try {
      activeProducts = await getActiveProductsByProfile(context.profileId);
    } catch (error) {
      if (error instanceof QuickSuggestionDiagnosticError) throw error;
      throw toDiagnosticError(error, {
        stage: "query_relationship",
        context: "profile",
        id: context.profileId,
        table: "product_profiles",
        query: `products -> product_profiles!inner -> profiles; product_profiles.profile_id = "${context.profileId}"; products.active = true`,
      });
    }

    try {
      products = activeProducts.map(toProduct);
    } catch (error) {
      throw toDiagnosticError(error, {
        stage: "filter_active_products",
        context: "profile",
        id: context.profileId,
        table: "products",
        query: "adaptar registros de produtos ativos retornados pela consulta",
      });
    }
  } else if (context.type === "occasion") {
    let activeProducts: AdminProduct[];
    try {
      activeProducts = await getActiveProductsByOccasion(context.occasionId);
    } catch (error) {
      if (error instanceof QuickSuggestionDiagnosticError) throw error;
      throw toDiagnosticError(error, {
        stage: "query_relationship",
        context: "occasion",
        id: context.occasionId,
        table: "product_occasions",
        query: `products -> product_occasions!inner -> occasions; product_occasions.occasion_id = "${context.occasionId}"; products.active = true`,
      });
    }

    try {
      products = activeProducts.map(toProduct);
    } catch (error) {
      throw toDiagnosticError(error, {
        stage: "filter_active_products",
        context: "occasion",
        id: context.occasionId,
        table: "products",
        query: "adaptar registros de produtos ativos retornados pela consulta",
      });
    }
  } else {
    let allProducts: AdminProduct[];
    try {
      allProducts = await getActiveProducts();
    } catch (error) {
      throw toDiagnosticError(error, {
        stage: "query_products",
        context: "generic",
        table: "products",
        query: "select products where active = true",
      });
    }

    try {
      const mappedProducts = allProducts.map(toProduct);
      const genderProducts = mappedProducts.filter((product) => matchesGender(product, context.gender));
      products = genderProducts.length ? [...genderProducts, ...mappedProducts] : mappedProducts;
    } catch (error) {
      throw toDiagnosticError(error, {
        stage: "filter_active_products",
        context: "generic",
        table: "products",
        query: "filtrar produtos ativos por termos de gênero",
      });
    }
  }

  let selected: Product[];
  try {
    selected = diversify(products, 6, new Set(context.excludeIds ?? []));
  } catch (error) {
    throw toDiagnosticError(error, {
      stage: "select_products",
      context: context.type,
      id: context.type === "profile" ? context.profileId : context.type === "occasion" ? context.occasionId : undefined,
      table: "products",
      query: "diversificar e selecionar até 6 produtos",
    });
  }

  try {
    return selected.map((product) => toRecommendation(product, context.explanation));
  } catch (error) {
    throw toDiagnosticError(error, {
      stage: "prepare_results",
      context: context.type,
      id: context.type === "profile" ? context.profileId : context.type === "occasion" ? context.occasionId : undefined,
      table: "products",
      query: "preparar recomendações para renderização",
    });
  }
}

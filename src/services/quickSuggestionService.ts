import type { Product, Recommendation } from "@/types";
import { getActiveProducts, getActiveProductsByOccasion, getActiveProductsByProfile, type AdminProduct } from "@/services/productService";
import { getActiveTaxonomyOptions } from "@/services/taxonomyService";
import type { QuickSuggestion } from "@/data/quickSuggestions";

export type QuickSuggestionContext =
  | { key: string; label: string; explanation: string; type: "profile"; profileId: string; profileName: string; excludeIds?: string[] }
  | { key: string; label: string; explanation: string; type: "occasion"; occasionId: string; occasionName: string; excludeIds?: string[] }
  | { key: string; label: string; explanation: string; type: "generic"; gender: "male" | "female"; excludeIds?: string[] };

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
    const profiles = await getActiveTaxonomyOptions("profiles");
    const profile = profiles.find((item) => matchesTaxonomyName(item.name, suggestion.profileName));
    if (!profile) throw new Error(`Perfil não encontrado: ${suggestion.profileName}`);
    return { key: suggestion.key, label: suggestion.label, explanation: suggestion.explanation, type: "profile", profileId: profile.id, profileName: profile.name };
  }

  if (!suggestion.occasionName) throw new Error(`Sugestão rápida sem ocasião: ${suggestion.key}`);
  const occasions = await getActiveTaxonomyOptions("occasions");
  const occasion = occasions.find((item) => matchesTaxonomyName(item.name, suggestion.occasionName));
  if (!occasion) throw new Error(`Ocasião não encontrada: ${suggestion.occasionName}`);
  return { key: suggestion.key, label: suggestion.label, explanation: suggestion.explanation, type: "occasion", occasionId: occasion.id, occasionName: occasion.name };
}

export async function getQuickSuggestions(context: QuickSuggestionContext): Promise<Recommendation[]> {
  if (!context || !context.type) throw new Error("Contexto de sugestão rápida inválido");

  let products: Product[];
  if (context.type === "profile") {
    products = (await getActiveProductsByProfile(context.profileId)).map(toProduct);
  } else if (context.type === "occasion") {
    products = (await getActiveProductsByOccasion(context.occasionId)).map(toProduct);
  } else {
    const allProducts = (await getActiveProducts()).map(toProduct);
    const genderProducts = allProducts.filter((product) => matchesGender(product, context.gender));
    products = genderProducts.length ? [...genderProducts, ...allProducts] : allProducts;
  }

  return diversify(products, 6, new Set(context.excludeIds ?? [])).map((product) => toRecommendation(product, context.explanation));
}

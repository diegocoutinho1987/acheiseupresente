import type { Product } from "@/types";
import { getActiveProducts } from "@/services/productService";

/** Carrega o catálogo ativo persistido e o adapta para o motor de recomendações. */
export async function getCatalog(): Promise<Product[]> {
  const products = await getActiveProducts();
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    category: p.categoryNames[0] ?? p.category,
    categories: p.categoryNames.length ? p.categoryNames : [p.category],
    categoryIds: p.categoryIds,
    store: p.store,
    url: p.affiliate_url || p.product_url,
    productUrl: p.product_url,
    affiliateUrl: p.affiliate_url,
    image: p.image_url ?? "",
    tags: p.tags ?? [],
    occasions: p.occasionNames,
    occasionIds: p.occasionIds,
    profiles: p.profileNames,
    profileIds: p.profileIds,
    active: p.active,
  }));
}

export const isDemoUrl = (url: string) => /example\.com/.test(url);

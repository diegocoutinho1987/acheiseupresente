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
    category: p.category,
    store: p.store,
    url: p.affiliate_url,
    image: p.image_url ?? "",
    tags: p.tags ?? [],
    occasions: p.occasions ?? [],
    profiles: p.profiles ?? [],
  }));
}

export const isDemoUrl = (url: string) => /example\.com/.test(url);

import type { Product } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCTS } from "@/data/products";

/** Carrega o catálogo ativo cadastrado na área administrativa. Usa os dados de demonstração se falhar. */
export async function getCatalog(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id,name,description,price,category,store,affiliate_url,image_url,tags")
    .eq("active", true);
  if (error || !data || data.length === 0) return PRODUCTS;
  return data.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    category: p.category,
    store: p.store,
    url: p.affiliate_url,
    image: p.image_url ?? "",
    tags: p.tags ?? [],
  }));
}

export const isDemoUrl = (url: string) => /example\.com/.test(url);

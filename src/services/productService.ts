import { supabase } from "@/integrations/supabase/client";
import type { Database, Json, Tables, TablesUpdate } from "@/integrations/supabase/types";

type LinkedTaxonomy = { id: string; name: string; active: boolean };
type ProductWithLinks = Tables<"products"> & { product_categories?: { categories?: LinkedTaxonomy | null }[]; product_occasions?: { occasions?: LinkedTaxonomy | null }[]; product_profiles?: { profiles?: LinkedTaxonomy | null }[] };
export type AdminProduct = Tables<"products"> & { categoryIds: string[]; occasionIds: string[]; profileIds: string[]; categoryNames: string[]; occasionNames: string[]; profileNames: string[] };
export type ProductPayload = { name: string; description: string; price: number; store: string; product_url: string; affiliate_url: string; image_url: string | null; tags: string[]; active: boolean; categoryIds: string[]; occasionIds: string[]; profileIds: string[] };

const productSelect = "*, product_categories(categories(id,name,active)), product_occasions(occasions(id,name,active)), product_profiles(profiles(id,name,active))";

function adaptProduct(row: ProductWithLinks): AdminProduct {
  const categories = (row.product_categories ?? []).map((link) => link.categories).filter((item): item is LinkedTaxonomy => Boolean(item));
  const occasions = (row.product_occasions ?? []).map((link) => link.occasions).filter((item): item is LinkedTaxonomy => Boolean(item));
  const profiles = (row.product_profiles ?? []).map((link) => link.profiles).filter((item): item is LinkedTaxonomy => Boolean(item));
  return { ...row, categoryIds: categories.map((item) => item.id), occasionIds: occasions.map((item) => item.id), profileIds: profiles.map((item) => item.id), categoryNames: categories.map((item) => item.name), occasionNames: occasions.map((item) => item.name), profileNames: profiles.map((item) => item.name) };
}

export async function getProducts(): Promise<AdminProduct[]> {
  const { data, error } = await supabase.from("products").select(productSelect).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => adaptProduct(row as unknown as ProductWithLinks));
}

export async function getActiveProducts(): Promise<AdminProduct[]> {
  const { data, error } = await supabase.from("products").select(productSelect).eq("active", true).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => adaptProduct(row as unknown as ProductWithLinks));
}

export async function getProduct(id: string): Promise<AdminProduct | null> {
  const { data, error } = await supabase.from("products").select(productSelect).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? adaptProduct(data as unknown as ProductWithLinks) : null;
}

export async function createProduct(product: ProductPayload): Promise<AdminProduct> {
  return saveProduct(null, product);
}

export async function updateProduct(id: string, product: ProductPayload): Promise<AdminProduct> {
  return saveProduct(id, product);
}

async function saveProduct(id: string | null, product: ProductPayload): Promise<AdminProduct> {
  const args: Database["public"]["Functions"]["admin_save_product"]["Args"] = {
    _product_id: id as unknown as string,
    _product: { name: product.name, description: product.description, price: product.price, store: product.store, product_url: product.product_url, affiliate_url: product.affiliate_url, image_url: product.image_url, tags: product.tags, active: product.active } as Json,
    _category_ids: product.categoryIds, _occasion_ids: product.occasionIds, _profile_ids: product.profileIds,
  };
  const { data, error } = await supabase.rpc("admin_save_product", args);
  if (error) throw error;
  const saved = await getProduct(data);
  if (!saved) throw new Error("Produto salvo, mas não encontrado.");
  return saved;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

export async function toggleProductStatus(product: AdminProduct): Promise<AdminProduct> {
  const { data, error } = await supabase.from("products").update({ active: !product.active } satisfies TablesUpdate<"products">).eq("id", product.id).select().single();
  if (error) throw error;
  return { ...product, ...data };
}
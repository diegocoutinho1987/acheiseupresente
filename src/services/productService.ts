import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type AdminProduct = Tables<"products">;
export type ProductPayload = Omit<TablesInsert<"products">, "id" | "created_at" | "updated_at">;

export async function getProducts(): Promise<AdminProduct[]> {
  const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getProduct(id: string): Promise<AdminProduct | null> {
  const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createProduct(product: ProductPayload): Promise<AdminProduct> {
  const { data, error } = await supabase.from("products").insert(product).select().single();
  if (error) throw error;
  return data;
}

export async function updateProduct(id: string, product: TablesUpdate<"products">): Promise<AdminProduct> {
  const { data, error } = await supabase.from("products").update(product).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

export async function toggleProductStatus(product: AdminProduct): Promise<AdminProduct> {
  return updateProduct(product.id, { active: !product.active });
}
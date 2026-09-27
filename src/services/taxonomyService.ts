import { supabase } from "@/integrations/supabase/client";

export type TaxonomyKind = "categories" | "occasions" | "profiles";

export type TaxonomyItem = {
  id: string;
  name: string;
  active: boolean;
  productCount: number;
};

const relationConfig = {
  categories: { table: "product_categories", foreignKey: "category_id" },
  occasions: { table: "product_occasions", foreignKey: "occasion_id" },
  profiles: { table: "product_profiles", foreignKey: "profile_id" },
} as const;

export class TaxonomyInUseError extends Error {
  constructor(public readonly count: number) {
    super(`Taxonomy item is used by ${count} products`);
  }
}

export async function getTaxonomyItems(kind: TaxonomyKind): Promise<TaxonomyItem[]> {
  const config = relationConfig[kind];
  const [{ data: items, error: itemsError }, { data: links, error: linksError }] = await Promise.all([
    supabase.from(kind).select("id,name,active").order("name"),
    supabase.from(config.table).select(config.foreignKey),
  ]);
  if (itemsError) throw itemsError;
  if (linksError) throw linksError;
  const counts = new Map<string, number>();
  for (const link of links ?? []) {
    const id = String((link as unknown as Record<string, string>)[config.foreignKey]);
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return (items ?? []).map((item) => ({ ...item, productCount: counts.get(item.id) ?? 0 }));
}

export async function getAllTaxonomies() {
  const [categories, occasions, profiles] = await Promise.all([
    getTaxonomyItems("categories"),
    getTaxonomyItems("occasions"),
    getTaxonomyItems("profiles"),
  ]);
  return { categories, occasions, profiles };
}

export async function getActiveTaxonomyNames(kind: TaxonomyKind): Promise<string[]> {
  let query = supabase.from(kind).select("name").eq("active", true);
  if (kind !== "categories") query = query.eq("questionnaire_visible", true);
  const { data, error } = await query.order("name");
  if (error) throw error;
  return (data ?? []).map((item) => item.name);
}

export async function createTaxonomyItem(kind: TaxonomyKind, name: string): Promise<void> {
  const { error } = await supabase.from(kind).insert({ name: name.trim() });
  if (error) throw error;
}

export async function renameTaxonomyItem(kind: TaxonomyKind, id: string, name: string): Promise<void> {
  const { error } = await supabase.from(kind).update({ name: name.trim() }).eq("id", id);
  if (error) throw error;
}

export async function setTaxonomyStatus(kind: TaxonomyKind, id: string, active: boolean): Promise<void> {
  const { error } = await supabase.from(kind).update({ active }).eq("id", id);
  if (error) throw error;
}

export async function deleteTaxonomyItem(kind: TaxonomyKind, item: TaxonomyItem): Promise<void> {
  if (item.productCount > 0) throw new TaxonomyInUseError(item.productCount);
  const { error } = await supabase.from(kind).delete().eq("id", item.id);
  if (error) throw error;
}
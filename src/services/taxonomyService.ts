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

export type TaxonomyBulkDeleteResult = { deleted: TaxonomyItem[]; blocked: TaxonomyItem[] };

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
  if (kind === "categories") {
    const { data, error } = await supabase.from("categories").select("name").eq("active", true).order("name");
    if (error) throw error;
    return (data ?? []).map((item) => item.name);
  }
  const { data, error } = kind === "occasions"
    ? await supabase.from("occasions").select("name").eq("active", true).eq("questionnaire_visible", true).order("name")
    : await supabase.from("profiles").select("name").eq("active", true).eq("questionnaire_visible", true).order("name");
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

export async function deleteTaxonomyItems(kind: TaxonomyKind, ids: string[]): Promise<TaxonomyBulkDeleteResult> {
  if (!ids.length) return { deleted: [], blocked: [] };
  const config = relationConfig[kind];
  const { data: links, error: linksError } = await supabase.from(config.table).select(`${config.foreignKey},product_id`).in(config.foreignKey, ids);
  if (linksError) throw linksError;
  const uniqueProducts = new Map<string, Set<string>>();
  for (const link of links ?? []) {
    const row = link as unknown as Record<string, string>;
    const id = String(row[config.foreignKey]);
    const productId = String(row.product_id);
    if (!uniqueProducts.has(id)) uniqueProducts.set(id, new Set());
    uniqueProducts.get(id)?.add(productId);
  }
  const selectedItems = (await getTaxonomyItems(kind)).filter((item) => ids.includes(item.id));
  const blocked = selectedItems.filter((item) => (uniqueProducts.get(item.id)?.size ?? 0) > 0).map((item) => ({ ...item, productCount: uniqueProducts.get(item.id)?.size ?? item.productCount }));
  const blockedIds = new Set(blocked.map((item) => item.id));
  const deletable = selectedItems.filter((item) => !blockedIds.has(item.id));
  if (deletable.length) {
    const { error: deleteError } = await supabase.from(kind).delete().in("id", deletable.map((item) => item.id));
    if (deleteError) throw deleteError;
  }
  return { deleted: deletable, blocked };
}

export async function getActiveTaxonomyOptions(kind: TaxonomyKind): Promise<{ id: string; name: string }[]> {
  if (kind === "categories") {
    const { data, error } = await supabase.from("categories").select("id,name").eq("active", true).order("name");
    if (error) throw error;
    return data ?? [];
  }
  const table = kind === "occasions" ? "occasions" : "profiles";
  const { data, error } = await supabase.from(table).select("id,name").eq("active", true).eq("questionnaire_visible", true).order("name");
  if (error) throw error;
  return data ?? [];
}

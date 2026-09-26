import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type Product = Tables<"products">;

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administração do catálogo de presentes" },
      { name: "description", content: "Cadastre produtos e atualize links de afiliado." },
      { property: "og:title", content: "Administração do catálogo de presentes" },
      { property: "og:description", content: "Cadastre produtos e atualize links de afiliado." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

const empty = {
  name: "", description: "", price: "", category: "", store: "",
  affiliate_url: "", image_url: "", tags: "", occasions: "", active: true,
};
type Form = typeof empty;

function toForm(p: Product): Form {
  return {
    name: p.name, description: p.description, price: String(p.price), category: p.category,
    store: p.store, affiliate_url: p.affiliate_url, image_url: p.image_url ?? "",
    tags: p.tags.join(", "), occasions: p.occasions.join(", "), active: p.active,
  };
}
const list = (s: string) => s.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean);

function AdminPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const role = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data } = await supabase.rpc("has_role", { _user_id: u.user!.id, _role: "admin" });
      return !!data;
    },
  });
  const products = useQuery({
    queryKey: ["admin-products"],
    enabled: role.data === true,
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
  });

  async function logout() {
    await supabase.auth.signOut();
    qc.clear();
    navigate({ to: "/auth" });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const price = Number(form.price.replace(",", "."));
    if (!form.name || !form.category || !form.store || !form.affiliate_url || !(price > 0)) {
      setErr("Preencha nome, preço, categoria, loja e link de afiliado.");
      return;
    }
    try { new URL(form.affiliate_url); } catch { setErr("Link de afiliado inválido."); return; }
    const row = {
      name: form.name.trim(), description: form.description.trim(), price,
      category: form.category.trim().toLowerCase(), store: form.store.trim(),
      affiliate_url: form.affiliate_url.trim(), image_url: form.image_url.trim() || null,
      tags: list(form.tags), occasions: list(form.occasions), active: form.active,
    };
    setSaving(true);
    const { error } = editing === "new"
      ? await supabase.from("products").insert(row)
      : await supabase.from("products").update(row).eq("id", editing!);
    setSaving(false);
    if (error) { setErr(error.message); return; }
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  }

  async function remove(id: string) {
    if (!confirm("Excluir este produto?")) return;
    await supabase.from("products").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  }

  if (role.isLoading) return <p className="p-6 text-muted-foreground">Carregando…</p>;
  if (!role.data)
    return (
      <main className="p-6 space-y-3">
        <p className="text-foreground">Sua conta não tem acesso de administrador.</p>
        <Button variant="outline" onClick={logout}>Sair</Button>
      </main>
    );

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <main className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-3xl text-foreground">Catálogo de produtos</h1>
          <div className="flex gap-2">
            <Button onClick={() => { setForm(empty); setEditing("new"); setErr(null); }}>Novo produto</Button>
            <Button variant="outline" onClick={logout}>Sair</Button>
          </div>
        </header>

        {editing && (
          <form onSubmit={save} className="surface-card p-5 grid gap-3 sm:grid-cols-2">
            <h2 className="sm:col-span-2 font-display text-xl text-foreground">
              {editing === "new" ? "Novo produto" : "Editar produto"}
            </h2>
            <Field label="Nome"><Input value={form.name} onChange={set("name")} /></Field>
            <Field label="Preço (R$)"><Input value={form.price} onChange={set("price")} inputMode="decimal" /></Field>
            <Field label="Categoria"><Input value={form.category} onChange={set("category")} placeholder="coffee, tech, reading…" /></Field>
            <Field label="Loja"><Input value={form.store} onChange={set("store")} /></Field>
            <Field label="Link de afiliado" wide><Input value={form.affiliate_url} onChange={set("affiliate_url")} placeholder="https://" /></Field>
            <Field label="URL da imagem" wide><Input value={form.image_url} onChange={set("image_url")} placeholder="https://" /></Field>
            <Field label="Descrição" wide><Textarea value={form.description} onChange={set("description")} /></Field>
            <Field label="Tags (separadas por vírgula)"><Input value={form.tags} onChange={set("tags")} /></Field>
            <Field label="Ocasiões (separadas por vírgula)"><Input value={form.occasions} onChange={set("occasions")} /></Field>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} /> Ativo
            </label>
            {err && <p className="sm:col-span-2 text-sm text-destructive">{err}</p>}
            <div className="sm:col-span-2 flex gap-2">
              <Button type="submit" disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            </div>
          </form>
        )}

        <ul className="space-y-3">
          {products.data?.map((p) => {
            const placeholder = p.affiliate_url.includes("example.com");
            return (
              <li key={p.id} className="surface-card p-4 flex gap-4 items-center">
                {p.image_url && <img src={p.image_url} alt={p.name} className="h-16 w-16 rounded-md object-cover" />}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{p.name} {!p.active && <span className="text-xs text-muted-foreground">(inativo)</span>}</p>
                  <p className="text-sm text-muted-foreground">R$ {Number(p.price).toFixed(2).replace(".", ",")} · {p.store} · {p.category}</p>
                  <p className={`text-xs truncate ${placeholder ? "text-destructive" : "text-muted-foreground"}`}>
                    {placeholder ? "Link de exemplo — substitua" : p.affiliate_url}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setForm(toForm(p)); setEditing(p.id); setErr(null); window.scrollTo({ top: 0 }); }}>Editar</Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(p.id)}>Excluir</Button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={`space-y-1 ${wide ? "sm:col-span-2" : ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

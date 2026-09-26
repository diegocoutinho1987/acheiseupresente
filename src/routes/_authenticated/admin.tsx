import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { SiteHeader } from "@/components/gift/SiteHeader";
import { formatPrice } from "@/utils/format";
import { isDemoUrl } from "@/services/catalogService";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Produtos — Achei Seu Presente!" },
      { name: "description", content: "Gerencie produtos e links de afiliado." },
      { property: "og:title", content: "Produtos — Achei Seu Presente!" },
      { property: "og:description", content: "Gerencie produtos e links de afiliado." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Row = { id: string; name: string; description: string; price: number; category: string; store: string; affiliate_url: string; image_url: string | null; active: boolean; tags: string[] };
type Form = { id?: string; name: string; description: string; price: string; category: string; store: string; affiliate_url: string; image_url: string; active: boolean; tags: string };
const empty: Form = { name: "", description: "", price: "", category: "", store: "", affiliate_url: "", image_url: "", active: true, tags: "" };

function AdminPage() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [form, setForm] = useState<Form | null>(null);
  const [filter, setFilter] = useState<"all" | "demo">("all");

  async function load() {
    const { data, error } = await supabase.from("products").select("*").order("name");
    if (error) { toast.error("Erro ao carregar produtos."); return; }
    setRows(data as Row[]);
  }

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        setIsAdmin(false);
        return;
      }
      const { data } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
      setIsAdmin(!!data);
      if (data) load();
    })();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const price = Number(form.price.replace(",", "."));
    if (!form.name.trim() || !(price > 0) || !/^https?:\/\//.test(form.affiliate_url)) { toast.error("Preencha nome, preço válido e um link começando com https://"); return; }
    const payload = {
      name: form.name.trim(), description: form.description.trim(), price, category: form.category.trim() || "outros",
      store: form.store.trim(), affiliate_url: form.affiliate_url.trim(), image_url: form.image_url.trim() || null, active: form.active,
      tags: form.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean),
    };
    const { error } = form.id ? await supabase.from("products").update(payload).eq("id", form.id) : await supabase.from("products").insert(payload);
    if (error) { toast.error("Não foi possível salvar."); return; }
    toast.success("Produto salvo.");
    setForm(null);
    load();
  }

  async function remove(r: Row) {
    if (!confirm(`Excluir "${r.name}"?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", r.id);
    if (error) { toast.error("Não foi possível excluir."); return; }
    load();
  }

  async function toggle(r: Row) {
    await supabase.from("products").update({ active: !r.active }).eq("id", r.id);
    load();
  }

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const edit = (r: Row) => setForm({ id: r.id, name: r.name, description: r.description, price: String(r.price), category: r.category, store: r.store, affiliate_url: r.affiliate_url, image_url: r.image_url ?? "", active: r.active, tags: r.tags.join(", ") });
  const demoCount = rows.filter((r) => isDemoUrl(r.affiliate_url)).length;
  const shown = filter === "demo" ? rows.filter((r) => isDemoUrl(r.affiliate_url)) : rows;

  if (isAdmin === null) return <div className="p-10 text-center text-muted-foreground">Carregando…</div>;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 pb-16">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-3xl font-semibold text-foreground">Produtos</h1>
          <div className="flex gap-2">
            {isAdmin && <Button className="rounded-full" onClick={() => setForm({ ...empty })}><Plus className="h-4 w-4" /> Novo produto</Button>}
            <Button variant="outline" className="rounded-full" onClick={logout}><LogOut className="h-4 w-4" /> Sair</Button>
          </div>
        </div>

        {!isAdmin ? (
          <p className="mt-8 rounded-xl bg-secondary p-5 text-secondary-foreground">Sua conta não tem permissão de administração.</p>
        ) : (
          <>
            <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
              <Button size="sm" variant={filter === "all" ? "default" : "outline"} className="rounded-full" onClick={() => setFilter("all")}>Todos ({rows.length})</Button>
              <Button size="sm" variant={filter === "demo" ? "default" : "outline"} className="rounded-full" onClick={() => setFilter("demo")}>Com link de exemplo ({demoCount})</Button>
            </div>

            {form && (
              <form onSubmit={save} className="mt-6 grid gap-4 rounded-2xl border bg-card p-5 sm:grid-cols-2">
                <h2 className="font-display text-xl font-semibold sm:col-span-2">{form.id ? "Editar produto" : "Novo produto"}</h2>
                <F id="product-name" label="Nome"><Input id="product-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></F>
                <F id="product-price" label="Preço (R$)"><Input id="product-price" inputMode="decimal" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></F>
                <F id="affiliate-url" label="Link de afiliado" wide><Input id="affiliate-url" type="url" value={form.affiliate_url} onChange={(e) => setForm({ ...form, affiliate_url: e.target.value })} placeholder="https://..." required /></F>
                <F id="product-store" label="Loja"><Input id="product-store" value={form.store} onChange={(e) => setForm({ ...form, store: e.target.value })} /></F>
                <F id="product-category" label="Categoria"><Input id="product-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></F>
                <F id="image-url" label="Link da imagem" wide><Input id="image-url" type="url" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." /></F>
                <F id="product-description" label="Descrição" wide><Textarea id="product-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></F>
                <F id="product-tags" label="Interesses (separados por vírgula — ex.: café, leitura, viagem)" wide><Input id="product-tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></F>
                <label className="flex items-center gap-2 text-sm"><Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} /> Aparece nas sugestões</label>
                <div className="flex justify-end gap-2 sm:col-span-2">
                  <Button type="button" variant="ghost" onClick={() => setForm(null)}>Cancelar</Button>
                  <Button type="submit" className="rounded-full">Salvar</Button>
                </div>
              </form>
            )}

            <ul className="mt-6 divide-y rounded-2xl border bg-card">
              {shown.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-4 p-4">
                  {r.image_url ? <img src={r.image_url} alt="" className="h-14 w-14 rounded-lg object-cover" /> : <div className="h-14 w-14 rounded-lg bg-muted" />}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{r.name} {!r.active && <span className="text-xs text-muted-foreground">(oculto)</span>}</p>
                    <p className="text-sm text-muted-foreground">{formatPrice(Number(r.price))} · {r.store}</p>
                    <p className={`truncate text-xs ${isDemoUrl(r.affiliate_url) ? "font-medium text-destructive" : "text-muted-foreground"}`}>
                      {isDemoUrl(r.affiliate_url) ? "Link de exemplo — substitua" : r.affiliate_url}
                    </p>
                  </div>
                  <Switch checked={r.active} onCheckedChange={() => toggle(r)} aria-label="Ativo" />
                  <Button size="icon" variant="ghost" onClick={() => edit(r)} aria-label="Editar"><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(r)} aria-label="Excluir"><Trash2 className="h-4 w-4" /></Button>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}

function F({ id, label, wide, children }: { id: string; label: string; wide?: boolean; children: React.ReactNode }) {
  return <div className={`space-y-1.5 ${wide ? "sm:col-span-2" : ""}`}><Label htmlFor={id}>{label}</Label>{children}</div>;
}

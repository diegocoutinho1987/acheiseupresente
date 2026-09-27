import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createTaxonomyItem, deleteTaxonomyItem, getTaxonomyItems, renameTaxonomyItem, setTaxonomyStatus, TaxonomyInUseError, type TaxonomyItem, type TaxonomyKind } from "@/services/taxonomyService";

export const Route = createFileRoute("/_authenticated/admin/taxonomies")({
  head: () => ({ meta: [
    { title: "Cadastros — Achei Seu Presente!" }, { name: "description", content: "Gerencie categorias, ocasiões e perfis do catálogo." },
    { property: "og:title", content: "Cadastros — Achei Seu Presente!" }, { property: "og:description", content: "Gerencie categorias, ocasiões e perfis do catálogo." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: TaxonomiesPage,
});

const labels: Record<TaxonomyKind, { plural: string; singular: string }> = {
  categories: { plural: "Categorias", singular: "categoria" },
  occasions: { plural: "Ocasiões", singular: "ocasião" },
  profiles: { plural: "Perfis", singular: "perfil" },
};

function TaxonomiesPage() {
  const kinds = Object.keys(labels) as TaxonomyKind[];
  return <div><div className="mb-8"><p className="text-sm font-medium text-primary">Catálogo</p><h1 className="mt-1 text-3xl font-semibold">Cadastros</h1><p className="mt-2 text-muted-foreground">Gerencie as opções usadas nos produtos e no questionário.</p></div><Tabs defaultValue="categories"><TabsList className="grid h-auto w-full grid-cols-3 sm:w-auto">{kinds.map((kind) => <TabsTrigger key={kind} value={kind}>{labels[kind].plural}</TabsTrigger>)}</TabsList>{kinds.map((kind) => <TabsContent key={kind} value={kind} className="mt-6"><TaxonomyPanel kind={kind} /></TabsContent>)}</Tabs></div>;
}

function TaxonomyPanel({ kind }: { kind: TaxonomyKind }) {
  const [items, setItems] = useState<TaxonomyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<TaxonomyItem | "new" | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TaxonomyItem | null>(null);
  const [name, setName] = useState("");

  const load = async () => { setLoading(true); try { setItems(await getTaxonomyItems(kind)); } catch { toast.error(`Não foi possível carregar ${labels[kind].plural.toLowerCase()}.`); } finally { setLoading(false); } };
  useEffect(() => { void load(); }, [kind]);
  const filtered = useMemo(() => items.filter((item) => item.name.toLowerCase().includes(query.trim().toLowerCase())), [items, query]);
  const openEditor = (item: TaxonomyItem | "new") => { setEditing(item); setName(item === "new" ? "" : item.name); };
  const save = async () => { if (!name.trim()) return; try { if (editing === "new") await createTaxonomyItem(kind, name); else if (editing) await renameTaxonomyItem(kind, editing.id, name); toast.success(editing === "new" ? "Item adicionado." : "Item atualizado."); setEditing(null); await load(); } catch { toast.error("Não foi possível salvar. Verifique se o nome já existe."); } };
  const toggle = async (item: TaxonomyItem) => { try { await setTaxonomyStatus(kind, item.id, !item.active); setItems((current) => current.map((value) => value.id === item.id ? { ...value, active: !value.active } : value)); } catch { toast.error("Não foi possível alterar o status."); } };
  const remove = async () => { if (!pendingDelete) return; try { await deleteTaxonomyItem(kind, pendingDelete); setPendingDelete(null); await load(); toast.success("Item excluído."); } catch (error) { setPendingDelete(null); if (error instanceof TaxonomyInUseError) toast.error(`Este item está sendo usado por ${error.count} produtos. Desative-o em vez de excluí-lo.`); else toast.error("Não foi possível excluir o item."); } };

  return <section className="rounded-md border bg-card p-4 sm:p-6"><div className="flex flex-wrap gap-3"><div className="relative min-w-52 flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder={`Buscar ${labels[kind].plural.toLowerCase()}`} value={query} onChange={(event) => setQuery(event.target.value)} /></div><Button onClick={() => openEditor("new")}><Plus className="h-4 w-4" /> Adicionar</Button></div>{loading ? <p className="py-12 text-center text-sm text-muted-foreground">Carregando…</p> : <div className="mt-5 divide-y">{filtered.map((item) => <div key={item.id} className="flex flex-wrap items-center gap-3 py-3"><div className="min-w-40 flex-1"><p className="font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{item.productCount} {item.productCount === 1 ? "produto" : "produtos"}</p></div><div className="flex items-center gap-2"><Switch checked={item.active} onCheckedChange={() => toggle(item)} aria-label={`${item.active ? "Desativar" : "Ativar"} ${item.name}`} /><span className="w-12 text-xs">{item.active ? "Ativo" : "Inativo"}</span><Button size="icon" variant="ghost" onClick={() => openEditor(item)} aria-label={`Editar ${item.name}`}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" className="text-destructive" onClick={() => item.productCount ? toast.error(`Este item está sendo usado por ${item.productCount} produtos. Desative-o em vez de excluí-lo.`) : setPendingDelete(item)} aria-label={`Excluir ${item.name}`}><Trash2 className="h-4 w-4" /></Button></div></div>)}{!filtered.length && <p className="py-12 text-center text-sm text-muted-foreground">Nenhum item encontrado.</p>}</div>}
    <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}><DialogContent><DialogHeader><DialogTitle>{editing === "new" ? "Adicionar" : "Editar"} {labels[kind].singular}</DialogTitle><DialogDescription>O nome ficará disponível para associação aos produtos.</DialogDescription></DialogHeader><Input value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && void save()} autoFocus /><DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button><Button onClick={save} disabled={!name.trim()}>Salvar</Button></DialogFooter></DialogContent></Dialog>
    <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir este item?</AlertDialogTitle><AlertDialogDescription>O item será removido definitivamente do cadastro.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={remove}>Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </section>;
}
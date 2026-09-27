import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpDown, ImageIcon, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ProductImageFrame } from "@/components/gift/ProductImageFrame";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteProduct, getProducts, toggleProductStatus, type AdminProduct } from "@/services/productService";
import { formatPrice } from "@/utils/format";
import { getClickMetrics } from "@/services/analytics";

export const Route = createFileRoute("/_authenticated/admin/products/")({
  head: () => ({ meta: [
    { title: "Produtos do catálogo — Achei Seu Presente!" }, { name: "description", content: "Pesquise, filtre e gerencie produtos do catálogo." },
    { property: "og:title", content: "Produtos do catálogo — Achei Seu Presente!" }, { property: "og:description", content: "Pesquise, filtre e gerencie produtos do catálogo." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }), component: ProductsPage,
});

type Sort = "recent" | "name" | "price-low" | "price-high";

function ProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [store, setStore] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [pendingDelete, setPendingDelete] = useState<AdminProduct | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [clickCounts, setClickCounts] = useState<Record<string, number>>({});

  async function load() { try { const [items, metrics] = await Promise.all([getProducts(), getClickMetrics()]); setProducts(items); setClickCounts(metrics.byProduct); } catch { toast.error("Não foi possível carregar os produtos."); } finally { setLoading(false); } }
  useEffect(() => { load(); }, []);

  const categories = useMemo(() => [...new Set(products.flatMap((product) => product.categoryNames))].sort(), [products]);
  const stores = useMemo(() => [...new Set(products.map((product) => product.store))].sort(), [products]);
  const filtered = useMemo(() => {
    const result = products.filter((product) => product.name.toLowerCase().includes(query.toLowerCase().trim()) && (category === "all" || product.categoryNames.includes(category)) && (store === "all" || product.store === store) && (status === "all" || (status === "active" ? product.active : !product.active)));
    return result.sort((a, b) => sort === "name" ? a.name.localeCompare(b.name, "pt-BR") : sort === "price-low" ? Number(a.price) - Number(b.price) : sort === "price-high" ? Number(b.price) - Number(a.price) : new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [products, query, category, store, status, sort]);
  const visibleIds = filtered.map((product) => product.id);
  const visibleSelectedCount = visibleIds.filter((id) => selectedIds.has(id)).length;
  const allVisibleSelected = visibleIds.length > 0 && visibleSelectedCount === visibleIds.length;
  const someVisibleSelected = visibleSelectedCount > 0 && !allVisibleSelected;

  async function toggle(product: AdminProduct) { try { const updated = await toggleProductStatus(product); setProducts((current) => current.map((item) => item.id === updated.id ? updated : item)); toast.success(updated.active ? "Produto ativado." : "Produto desativado."); } catch { toast.error("Não foi possível alterar o status."); } }
  async function remove() { if (!pendingDelete) return; try { await deleteProduct(pendingDelete.id); setProducts((current) => current.filter((product) => product.id !== pendingDelete.id)); setPendingDelete(null); toast.success("Produto excluído com sucesso."); } catch { toast.error("Não foi possível excluir o produto."); } }
  function selectProduct(id: string, checked: boolean) { setSelectedIds((current) => { const next = new Set(current); if (checked) next.add(id); else next.delete(id); return next; }); }
  function selectVisible(checked: boolean) { setSelectedIds((current) => { const next = new Set(current); visibleIds.forEach((id) => checked ? next.add(id) : next.delete(id)); return next; }); }
  async function removeSelected() {
    const ids = [...selectedIds];
    if (!ids.length) return;
    setDeleting(true);
    const results = await Promise.allSettled(ids.map((id) => deleteProduct(id)));
    const deletedIds = new Set(ids.filter((_, index) => results[index]?.status === "fulfilled"));
    const failedCount = ids.length - deletedIds.size;
    setProducts((current) => current.filter((product) => !deletedIds.has(product.id)));
    setSelectedIds((current) => new Set([...current].filter((id) => !deletedIds.has(id))));
    setDeleting(false);
    setBulkDeleteOpen(false);
    if (deletedIds.size) toast.success(`${deletedIds.size} ${deletedIds.size === 1 ? "produto excluído" : "produtos excluídos"} com sucesso.`);
    if (failedCount) toast.error(`Não foi possível excluir ${failedCount} ${failedCount === 1 ? "produto" : "produtos"}.`);
  }

  return <div>
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-primary">Catálogo</p><h1 className="mt-1 text-3xl font-semibold">Produtos</h1><p className="mt-2 text-muted-foreground">{products.length} produtos cadastrados</p></div><Button asChild><Link to="/admin/products/new"><Plus className="h-4 w-4" /> Adicionar produto</Link></Button></div>

    <section className="mt-8 rounded-md border bg-card p-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(220px,1.5fr)_repeat(4,minmax(130px,1fr))]">
        <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Buscar por nome" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Buscar produtos por nome" /></div>
        <Filter value={category} onChange={setCategory} placeholder="Categoria" options={categories} />
        <Filter value={store} onChange={setStore} placeholder="Loja" options={stores} />
        <Select value={status} onValueChange={setStatus}><SelectTrigger aria-label="Filtrar por status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todos os status</SelectItem><SelectItem value="active">Ativos</SelectItem><SelectItem value="inactive">Inativos</SelectItem></SelectContent></Select>
        <Select value={sort} onValueChange={(value) => setSort(value as Sort)}><SelectTrigger aria-label="Ordenar produtos"><ArrowUpDown className="mr-2 h-4 w-4" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="recent">Mais recentes</SelectItem><SelectItem value="name">Nome</SelectItem><SelectItem value="price-low">Menor preço</SelectItem><SelectItem value="price-high">Maior preço</SelectItem></SelectContent></Select>
      </div>
      <div className="mt-4 flex min-h-9 flex-wrap items-center justify-between gap-3 border-t pt-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm"><Checkbox checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false} onCheckedChange={(checked) => selectVisible(checked === true)} aria-label="Selecionar todos os produtos visíveis" /><span>Selecionar todos os visíveis</span></label>
        {selectedIds.size > 0 && <div className="flex items-center gap-3"><span className="text-sm text-muted-foreground">{selectedIds.size} {selectedIds.size === 1 ? "selecionado" : "selecionados"}</span><Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}><Trash2 className="h-4 w-4" /> Excluir selecionados</Button></div>}
      </div>
    </section>

    {loading ? <div className="py-16 text-center text-sm text-muted-foreground">Carregando produtos…</div> : filtered.length === 0 ? <div className="mt-6 rounded-md border border-dashed bg-card py-16 text-center"><PackageEmpty /><h2 className="mt-3 font-semibold">Nenhum produto encontrado</h2><p className="mt-1 text-sm text-muted-foreground">Ajuste a busca ou os filtros para ver outros resultados.</p></div> : <>
      <div className="mt-6 hidden overflow-hidden rounded-md border bg-card lg:block"><Table><TableHeader><TableRow><TableHead className="w-10"><Checkbox checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false} onCheckedChange={(checked) => selectVisible(checked === true)} aria-label="Selecionar todos os produtos visíveis" /></TableHead><TableHead>Produto</TableHead><TableHead>Categorias</TableHead><TableHead>Preço</TableHead><TableHead>Loja</TableHead><TableHead>Cliques</TableHead><TableHead>Status</TableHead><TableHead>Cadastrado em</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader><TableBody>{filtered.map((product) => <TableRow key={product.id} data-state={selectedIds.has(product.id) ? "selected" : undefined}><TableCell><Checkbox checked={selectedIds.has(product.id)} onCheckedChange={(checked) => selectProduct(product.id, checked === true)} aria-label={`Selecionar ${product.name}`} /></TableCell><TableCell><div className="flex items-center gap-3"><ProductImage product={product} /><span className="max-w-52 truncate font-medium">{product.name}</span></div></TableCell><TableCell>{product.categoryNames.join(", ")}</TableCell><TableCell>{formatPrice(Number(product.price))}</TableCell><TableCell>{product.store}</TableCell><TableCell>{clickCounts[product.id] ?? 0}</TableCell><TableCell><div className="flex items-center gap-2"><Switch checked={product.active} onCheckedChange={() => toggle(product)} aria-label={`${product.active ? "Desativar" : "Ativar"} ${product.name}`} /><span className="text-xs">{product.active ? "Ativo" : "Inativo"}</span></div></TableCell><TableCell>{formatDate(product.created_at)}</TableCell><TableCell><div className="flex justify-end gap-1"><Button size="icon" variant="ghost" asChild><Link to="/admin/products/$id/edit" params={{ id: product.id }} aria-label={`Editar ${product.name}`}><Pencil className="h-4 w-4" /></Link></Button><Button size="icon" variant="ghost" className="text-destructive" onClick={() => setPendingDelete(product)} aria-label={`Excluir ${product.name}`}><Trash2 className="h-4 w-4" /></Button></div></TableCell></TableRow>)}</TableBody></Table></div>
      <div className="mt-6 grid gap-3 lg:hidden">{filtered.map((product) => <article key={product.id} className="rounded-md border bg-card p-4" data-state={selectedIds.has(product.id) ? "selected" : undefined}><div className="flex gap-3"><Checkbox className="mt-3" checked={selectedIds.has(product.id)} onCheckedChange={(checked) => selectProduct(product.id, checked === true)} aria-label={`Selecionar ${product.name}`} /><ProductImage product={product} /><div className="min-w-0 flex-1"><h2 className="truncate font-medium">{product.name}</h2><p className="mt-1 text-sm text-muted-foreground">{product.categoryNames.join(", ")} · {product.store}</p><p className="mt-1 font-semibold">{formatPrice(Number(product.price))}</p><p className="mt-1 text-xs text-muted-foreground">{clickCounts[product.id] ?? 0} cliques</p></div></div><div className="mt-4 flex items-center justify-between border-t pt-3"><div className="flex items-center gap-2"><Switch checked={product.active} onCheckedChange={() => toggle(product)} aria-label={`${product.active ? "Desativar" : "Ativar"} ${product.name}`} /><span className="text-sm">{product.active ? "Ativo" : "Inativo"}</span></div><div className="flex gap-1"><Button size="icon" variant="ghost" asChild><Link to="/admin/products/$id/edit" params={{ id: product.id }} aria-label={`Editar ${product.name}`}><Pencil className="h-4 w-4" /></Link></Button><Button size="icon" variant="ghost" className="text-destructive" onClick={() => setPendingDelete(product)} aria-label={`Excluir ${product.name}`}><Trash2 className="h-4 w-4" /></Button></div></div></article>)}</div>
    </>}

    <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir este produto?</AlertDialogTitle><AlertDialogDescription>Esta ação removerá o produto do catálogo.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={remove}>Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    <AlertDialog open={bulkDeleteOpen} onOpenChange={(open) => !deleting && setBulkDeleteOpen(open)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir {selectedIds.size} {selectedIds.size === 1 ? "produto" : "produtos"}?</AlertDialogTitle><AlertDialogDescription>Esta ação removerá permanentemente todos os produtos selecionados do catálogo.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleting} onClick={(event) => { event.preventDefault(); removeSelected(); }}>{deleting ? "Excluindo…" : "Excluir produtos"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}

function Filter({ value, onChange, placeholder, options }: { value: string; onChange: (value: string) => void; placeholder: string; options: string[] }) { return <Select value={value} onValueChange={onChange}><SelectTrigger aria-label={`Filtrar por ${placeholder.toLowerCase()}`}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas as {placeholder.toLowerCase()}s</SelectItem>{options.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select>; }
function ProductImage({ product }: { product: AdminProduct }) { return <ProductImageFrame src={product.image_url} alt={product.name} className="h-11 w-11 shrink-0 rounded-md p-1.5" />; }
function PackageEmpty() { return <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-muted"><ImageIcon className="h-5 w-5 text-muted-foreground" /></div>; }
function formatDate(value: string) { return new Intl.DateTimeFormat("pt-BR").format(new Date(value)); }
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MousePointerClick, Package, PackageCheck, Timer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ProductImageFrame } from "@/components/gift/ProductImageFrame";
import { getProducts, type AdminProduct } from "@/services/productService";
import { formatPrice } from "@/utils/format";
import { getClickMetrics, type ClickMetrics } from "@/services/analytics";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [
    { title: "Dashboard do catálogo — Achei Seu Presente!" },
    { name: "description", content: "Resumo administrativo do catálogo de presentes." },
    { property: "og:title", content: "Dashboard do catálogo — Achei Seu Presente!" },
    { property: "og:description", content: "Resumo administrativo do catálogo de presentes." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }),
  component: DashboardPage,
});

function DashboardPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [clicks, setClicks] = useState<ClickMetrics>({ total: 0, last7Days: 0, byProduct: {} });
  useEffect(() => { Promise.all([getProducts(), getClickMetrics()]).then(([items, metrics]) => { setProducts(items); setClicks(metrics); }).catch(() => toast.error("Não foi possível carregar os indicadores.")).finally(() => setLoading(false)); }, []);
  const active = products.filter((product) => product.active).length;
  const mostClicked = useMemo(() => products.map((product) => ({ product, clicks: clicks.byProduct[product.id] ?? 0 })).filter((item) => item.clicks > 0).sort((a, b) => b.clicks - a.clicks).slice(0, 5), [products, clicks]);
  const cards = [
    { label: "Total de produtos", value: products.length, icon: Package },
    { label: "Produtos ativos", value: active, icon: PackageCheck },
    { label: "Cliques nos produtos", value: clicks.total, icon: MousePointerClick },
    { label: "Cliques nos últimos 7 dias", value: clicks.last7Days, icon: Timer },
  ];
  return <div>
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-primary">Visão geral</p><h1 className="mt-1 text-3xl font-semibold">Dashboard</h1><p className="mt-2 text-muted-foreground">Acompanhe a saúde do seu catálogo.</p></div><Button asChild><Link to="/admin/products/new">Adicionar produto</Link></Button></div>
    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-md border bg-card p-5"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{label}</p><Icon className="h-5 w-5 text-primary" /></div><p className="mt-4 text-3xl font-semibold">{loading ? "—" : value}</p></div>)}</div>
    <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
      <section className="rounded-md border bg-card p-5"><h2 className="text-lg font-semibold">Produtos mais clicados</h2><div className="mt-5 divide-y">{mostClicked.length ? mostClicked.map(({ product, clicks: count }) => <div key={product.id} className="flex items-center justify-between gap-4 py-3 text-sm"><div className="min-w-0"><p className="truncate font-medium">{product.name}</p><p className="text-xs text-muted-foreground">{product.store}</p></div><span className="font-semibold">{count}</span></div>) : <p className="text-sm text-muted-foreground">Nenhum clique registrado.</p>}</div></section>
      <section className="rounded-md border bg-card"><div className="flex items-center justify-between border-b p-5"><h2 className="text-lg font-semibold">Cadastrados recentemente</h2><Button variant="ghost" size="sm" asChild><Link to="/admin/products">Ver todos <ArrowRight className="h-4 w-4" /></Link></Button></div><div className="divide-y">{products.slice(0, 5).map((product) => <div key={product.id} className="flex items-center gap-4 p-4"><ProductImageFrame src={product.image_url} alt={product.name} className="h-12 w-12 shrink-0 rounded-md p-1.5" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{product.name}</p><p className="text-xs text-muted-foreground">{product.category} · {formatPrice(Number(product.price))}</p></div><span className={`rounded-full px-2 py-1 text-xs font-medium ${product.active ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"}`}>{product.active ? "Ativo" : "Inativo"}</span></div>)}</div></section>
    </div>
  </div>;
}
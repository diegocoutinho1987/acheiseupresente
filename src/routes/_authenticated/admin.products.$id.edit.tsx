import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ProductForm } from "@/components/admin/ProductForm";
import { Button } from "@/components/ui/button";
import { getProduct, updateProduct, type AdminProduct, type ProductPayload } from "@/services/productService";

export const Route = createFileRoute("/_authenticated/admin/products/$id/edit")({
  head: () => ({ meta: [
    { title: "Editar produto — Achei Seu Presente!" }, { name: "description", content: "Atualize um produto do catálogo." },
    { property: "og:title", content: "Editar produto — Achei Seu Presente!" }, { property: "og:description", content: "Atualize um produto do catálogo." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }), component: EditProductPage,
});

function EditProductPage() {
  const { id } = Route.useParams(); const navigate = useNavigate(); const [product, setProduct] = useState<AdminProduct | null>(); const [submitting, setSubmitting] = useState(false);
  useEffect(() => { getProduct(id).then(setProduct).catch(() => setProduct(null)); }, [id]);
  async function save(payload: ProductPayload) { setSubmitting(true); try { await updateProduct(id, payload); toast.success("Produto atualizado com sucesso."); navigate({ to: "/admin/products" }); } catch { toast.error("Não foi possível atualizar o produto."); } finally { setSubmitting(false); } }
  if (product === undefined) return <p className="text-sm text-muted-foreground">Carregando produto…</p>;
  if (product === null) return <div><h1 className="text-2xl font-semibold">Produto não encontrado</h1><ButtonBack onClick={() => navigate({ to: "/admin/products" })} /></div>;
  return <div className="mx-auto max-w-4xl"><div className="mb-8"><p className="text-sm font-medium text-primary">Catálogo</p><h1 className="mt-1 text-3xl font-semibold">Editar produto</h1><p className="mt-2 text-muted-foreground">Atualize os dados de {product.name}.</p></div><ProductForm product={product} submitting={submitting} onSubmit={save} onCancel={() => navigate({ to: "/admin/products" })} /></div>;
}
function ButtonBack({ onClick }: { onClick: () => void }) { return <Button className="mt-4" variant="link" onClick={onClick}>Voltar para produtos</Button>; }
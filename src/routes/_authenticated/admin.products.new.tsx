import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ProductForm } from "@/components/admin/ProductForm";
import { createProduct, type ProductPayload } from "@/services/productService";

export const Route = createFileRoute("/_authenticated/admin/products/new")({
  head: () => ({ meta: [
    { title: "Adicionar produto — Achei Seu Presente!" }, { name: "description", content: "Cadastre um novo produto no catálogo." },
    { property: "og:title", content: "Adicionar produto — Achei Seu Presente!" }, { property: "og:description", content: "Cadastre um novo produto no catálogo." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }), component: NewProductPage,
});

function NewProductPage() {
  const navigate = useNavigate(); const [submitting, setSubmitting] = useState(false);
  async function save(payload: ProductPayload) { setSubmitting(true); try { await createProduct(payload); toast.success("Produto cadastrado com sucesso."); navigate({ to: "/admin/products" }); } catch { toast.error("Não foi possível cadastrar o produto."); } finally { setSubmitting(false); } }
  return <div className="mx-auto max-w-4xl"><div className="mb-8"><p className="text-sm font-medium text-primary">Catálogo</p><h1 className="mt-1 text-3xl font-semibold">Adicionar produto</h1><p className="mt-2 text-muted-foreground">Preencha os dados que serão usados nas recomendações.</p></div><ProductForm submitting={submitting} onSubmit={save} onCancel={() => navigate({ to: "/admin/products" })} /></div>;
}
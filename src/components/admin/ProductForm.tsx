import { useEffect, useState } from "react";
import { ImageIcon, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { AdminProduct, ProductPayload } from "@/services/productService";

type ProductFormProps = {
  product?: AdminProduct;
  submitting: boolean;
  onSubmit: (payload: ProductPayload) => Promise<void>;
  onCancel: () => void;
};

type FormState = {
  name: string; description: string; price: string; store: string; affiliateUrl: string;
  imageUrl: string; category: string; tags: string; occasions: string; profiles: string; active: boolean;
};

const emptyForm: FormState = { name: "", description: "", price: "", store: "", affiliateUrl: "", imageUrl: "", category: "", tags: "", occasions: "", profiles: "", active: true };

function list(value: string) {
  return [...new Set(value.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean))];
}

function isValidUrl(value: string, optional = false) {
  if (optional && !value) return true;
  try { const url = new URL(value); return url.protocol === "http:" || url.protocol === "https:"; } catch { return false; }
}

export function ProductForm({ product, submitting, onSubmit, onCancel }: ProductFormProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    if (!product) return;
    setForm({ name: product.name, description: product.description, price: String(product.price), store: product.store, affiliateUrl: product.affiliate_url, imageUrl: product.image_url ?? "", category: product.category, tags: product.tags.join(", "), occasions: product.occasions.join(", "), profiles: product.profiles.join(", "), active: product.active });
  }, [product]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    if (key === "imageUrl") setImageFailed(false);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const price = Number(form.price.replace(",", "."));
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) nextErrors.name = "Informe o nome do produto.";
    if (!(price > 0)) nextErrors.price = "Informe um preço maior que zero.";
    if (!form.store.trim()) nextErrors.store = "Informe a loja.";
    if (!form.category.trim()) nextErrors.category = "Informe a categoria.";
    if (!form.affiliateUrl.trim()) nextErrors.affiliateUrl = "Informe o link do produto.";
    else if (!isValidUrl(form.affiliateUrl.trim())) nextErrors.affiliateUrl = "Use um endereço válido começando com http:// ou https://.";
    if (!isValidUrl(form.imageUrl.trim(), true)) nextErrors.imageUrl = "Use um endereço de imagem válido.";
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; }

    await onSubmit({
      name: form.name.trim(), description: form.description.trim(), price, store: form.store.trim(),
      affiliate_url: form.affiliateUrl.trim(), image_url: form.imageUrl.trim() || null, category: form.category.trim(),
      tags: list(form.tags), occasions: list(form.occasions), profiles: list(form.profiles), active: form.active,
    });
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <section className="rounded-md border bg-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Informações principais</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field id="name" label="Nome do produto" required error={errors.name}><Input id="name" value={form.name} onChange={(event) => set("name", event.target.value)} aria-invalid={!!errors.name} /></Field>
          <Field id="price" label="Preço" required error={errors.price}><div className="relative"><span className="absolute left-3 top-2 text-sm text-muted-foreground">R$</span><Input id="price" className="pl-10" inputMode="decimal" value={form.price} onChange={(event) => set("price", event.target.value)} aria-invalid={!!errors.price} /></div></Field>
          <Field id="store" label="Loja" required error={errors.store}><Input id="store" value={form.store} onChange={(event) => set("store", event.target.value)} aria-invalid={!!errors.store} /></Field>
          <Field id="category" label="Categoria" required error={errors.category}><Input id="category" value={form.category} onChange={(event) => set("category", event.target.value)} aria-invalid={!!errors.category} /></Field>
          <Field id="description" label="Descrição" className="sm:col-span-2"><Textarea id="description" rows={4} value={form.description} onChange={(event) => set("description", event.target.value)} /></Field>
        </div>
      </section>

      <section className="rounded-md border bg-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Links e imagem</h2>
        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_220px]">
          <div className="space-y-5">
            <Field id="affiliateUrl" label="URL do produto / afiliado" required error={errors.affiliateUrl}><Input id="affiliateUrl" type="url" placeholder="https://loja.com/produto" value={form.affiliateUrl} onChange={(event) => set("affiliateUrl", event.target.value)} aria-invalid={!!errors.affiliateUrl} /></Field>
            <Field id="imageUrl" label="URL da imagem" error={errors.imageUrl}><Input id="imageUrl" type="url" placeholder="https://loja.com/imagem.jpg" value={form.imageUrl} onChange={(event) => set("imageUrl", event.target.value)} aria-invalid={!!errors.imageUrl} /></Field>
          </div>
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-md border bg-muted">
            {form.imageUrl && !imageFailed ? <img src={form.imageUrl} alt="Prévia do produto" className="h-full w-full object-cover" onError={() => setImageFailed(true)} /> : <div className="text-center text-muted-foreground"><ImageIcon className="mx-auto h-8 w-8" /><span className="mt-2 block text-xs">Prévia da imagem</span></div>}
          </div>
        </div>
      </section>

      <section className="rounded-md border bg-card p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Classificação para recomendações</h2>
        <p className="mt-1 text-sm text-muted-foreground">Separe os termos por vírgula. Você pode criar novos termos livremente.</p>
        <div className="mt-5 space-y-5">
          <Field id="tags" label="Tags" hint="Ex.: tecnologia, café, prático"><Input id="tags" value={form.tags} onChange={(event) => set("tags", event.target.value)} /></Field>
          <Field id="occasions" label="Ocasiões" hint="Ex.: aniversário, natal, casamento"><Input id="occasions" value={form.occasions} onChange={(event) => set("occasions", event.target.value)} /></Field>
          <Field id="profiles" label="Perfis" hint="Ex.: mãe, amigo, colega"><Input id="profiles" value={form.profiles} onChange={(event) => set("profiles", event.target.value)} /></Field>
        </div>
      </section>

      <section className="flex items-center justify-between gap-4 rounded-md border bg-card p-5 sm:p-6">
        <div><Label htmlFor="active">Produto ativo</Label><p className="mt-1 text-sm text-muted-foreground">Produtos inativos não aparecem nas recomendações.</p></div>
        <Switch id="active" checked={form.active} onCheckedChange={(value) => set("active", value)} />
      </section>

      <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={submitting}><Save className="h-4 w-4" />{submitting ? "Salvando…" : "Salvar produto"}</Button>
      </div>
    </form>
  );
}

function Field({ id, label, required, error, hint, className = "", children }: { id: string; label: string; required?: boolean; error?: string | undefined; hint?: string | undefined; className?: string; children: React.ReactNode }) {
  return <div className={className}><Label htmlFor={id}>{label}{required && <span className="text-destructive"> *</span>}</Label><div className="mt-2">{children}</div>{error ? <p className="mt-1.5 text-sm text-destructive">{error}</p> : hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}</div>;
}
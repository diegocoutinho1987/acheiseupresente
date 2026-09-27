import { ExternalLink, Gift, Sparkles } from "lucide-react";
import type { Recommendation } from "@/types";
import { Button } from "@/components/ui/button";
import { ProductImageFrame } from "@/components/gift/ProductImageFrame";
import { isDemoUrl } from "@/services/catalogService";

function shortenText(value: string, max = 130): string {
  const text = value.trim();
  return text.length <= max ? text : `${text.slice(0, max - 3).trimEnd()}...`;
}

function priceBand(price: number): string {
  if (price <= 50) return "Até 50 Reais";
  if (price <= 100) return "Até 100 Reais";
  if (price <= 200) return "Até 200 Reais";
  if (price <= 500) return "Até 500 Reais";
  if (price <= 1000) return "Até 1.000 Reais";
  return "Acima de 1.000 Reais";
}

export function ProductCard({ rec, index, onClick }: { rec: Recommendation; index: number; onClick: () => void }) {
  const { product } = rec;
  return (
    <article className="fade-up flex flex-col overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-lift)]" style={{ animationDelay: `${index * 70}ms` }}>
      <ProductImageFrame src={product.image} alt={product.name} className="relative aspect-[4/3] w-full shrink-0 bg-white p-3" fallback={<Gift className="h-10 w-10 text-muted-foreground" />}>
        <span className="absolute left-3 top-3 rounded-full bg-card/90 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur">{product.category}</span>
      </ProductImageFrame>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="mt-1 text-lg leading-snug text-foreground">{product.name}</h3>
        <p className="mt-1 text-sm font-medium text-muted-foreground">{priceBand(product.price)}</p>
        <p className="mt-2 text-sm text-muted-foreground">{shortenText(product.description)}</p>
        <div className="mt-4 rounded-xl bg-secondary p-3.5">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary"><Sparkles className="h-3.5 w-3.5" /> Por que escolhemos</p>
          <p className="mt-1.5 text-sm leading-relaxed text-secondary-foreground">{shortenText(rec.explanation)}</p>
        </div>
        <div className="mt-auto pt-5">
          <Button asChild className="w-full rounded-full" onClick={onClick}>
            <a href={product.url} target="_blank" rel="noopener noreferrer">Ver produto <ExternalLink className="h-4 w-4" /></a>
          </Button>
          {isDemoUrl(product.url) && <p className="mt-2 text-center text-[11px] text-muted-foreground">Produto de demonstração</p>}
        </div>
      </div>
    </article>
  );
}

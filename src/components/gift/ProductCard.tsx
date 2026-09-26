import { ExternalLink, Gift, Sparkles } from "lucide-react";
import type { Recommendation } from "@/types";
import { Button } from "@/components/ui/button";
import { ProductImageFrame } from "@/components/gift/ProductImageFrame";
import { formatPrice } from "@/utils/format";
import { isDemoUrl } from "@/services/catalogService";

export function ProductCard({ rec, index, onClick }: { rec: Recommendation; index: number; onClick: () => void }) {
  const { product } = rec;
  return (
    <article className="fade-up flex flex-col overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-lift)]" style={{ animationDelay: `${index * 70}ms` }}>
      <ProductImageFrame src={product.image} alt={product.name} className="relative aspect-[4/3] w-full shrink-0 p-3" fallback={<Gift className="h-10 w-10 text-muted-foreground" />}>
        <span className="absolute left-3 top-3 rounded-full bg-card/90 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur">{product.category}</span>
      </ProductImageFrame>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{product.store}</p>
        <h3 className="mt-1 text-lg leading-snug text-foreground">{product.name}</h3>
        <p className="mt-1 text-xl font-semibold text-foreground">{formatPrice(product.price)}</p>
        <p className="mt-2 text-sm text-muted-foreground">{product.description}</p>
        <div className="mt-4 rounded-xl bg-secondary p-3.5">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary"><Sparkles className="h-3.5 w-3.5" /> Por que escolhemos</p>
          <p className="mt-1.5 text-sm leading-relaxed text-secondary-foreground">{rec.explanation}</p>
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

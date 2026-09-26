import type { Recommendation } from "@/types";
import { ProductCard } from "./ProductCard";

export function RecommendationList({ items, onProductClick }: { items: Recommendation[]; onProductClick: (r: Recommendation) => void }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((r, i) => (
        <ProductCard key={r.product.id} rec={r} index={i} onClick={() => onProductClick(r)} />
      ))}
    </div>
  );
}

import type { GiftProfile, Recommendation } from "@/types";
import { ProductCard } from "./ProductCard";

export function RecommendationList({ items, profile, onProductClick }: { items: Recommendation[]; profile: GiftProfile; onProductClick: (r: Recommendation) => void }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((r, i) => (
        <ProductCard key={r.product.id} rec={r} profile={profile} index={i} onClick={() => onProductClick(r)} />
      ))}
    </div>
  );
}

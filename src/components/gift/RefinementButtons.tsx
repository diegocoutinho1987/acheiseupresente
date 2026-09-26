import { REFINEMENTS } from "@/data/options";
import type { Refinement } from "@/types";
import { cn } from "@/lib/utils";

export function RefinementButtons({ active, onSelect }: { active: Refinement; onSelect: (r: Refinement) => void }) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {REFINEMENTS.map((r) => (
        <button
          key={r}
          onClick={() => onSelect(r)}
          className={cn(
            "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
            active === r ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-secondary",
          )}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

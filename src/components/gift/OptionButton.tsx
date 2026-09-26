import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function OptionButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-xl border bg-card px-4 py-3.5 text-left text-[15px] font-medium transition-all",
        "hover:border-primary/50 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "border-primary bg-secondary text-secondary-foreground ring-1 ring-primary" : "border-border text-foreground",
      )}
    >
      {label}
      <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors", selected ? "border-primary bg-primary text-primary-foreground" : "border-input")}>
        {selected && <Check className="h-3 w-3" />}
      </span>
    </button>
  );
}

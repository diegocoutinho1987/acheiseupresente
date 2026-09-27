import { useState } from "react";
import { FEEDBACK_OPTIONS } from "@/data/options";
import { cn } from "@/lib/utils";

export function FeedbackOptions({ onSubmit, isLoading = false }: { onSubmit: (items: string[]) => void | Promise<void>; isLoading?: boolean }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async () => {
    if (submitting || isLoading || selected.length === 0) return;
    setSubmitting(true);
    try {
      await onSubmit(selected);
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  };
  const toggle = (o: string) => setSelected((s) => (s.includes(o) ? s.filter((x) => x !== o) : [...s, o]));

  if (sent) return <p className="text-center text-sm text-muted-foreground">Obrigado! Vamos usar isso para preparar outras sugestões.</p>;

  return (
    <div className="text-center">
      <p className="text-sm font-medium text-muted-foreground">O que não combinou?</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {FEEDBACK_OPTIONS.map((o) => (
          <button
            key={o}
            disabled={isLoading || submitting}
            onClick={() => toggle(o)}
            aria-pressed={selected.includes(o)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs transition-colors",
              selected.includes(o) ? "border-foreground/40 bg-muted text-foreground" : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {o}
          </button>
        ))}
      </div>
      {selected.length > 0 && (
        <button disabled={isLoading || submitting}
          onClick={() => { void handleSubmit(); }} className="mt-3 text-sm font-medium text-primary underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-60">
          Enviar feedback
        </button>
      )}
    </div>
  );
}

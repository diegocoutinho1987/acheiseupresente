import { useState } from "react";
import { FEEDBACK_OPTIONS } from "@/data/options";
import { cn } from "@/lib/utils";

export function FeedbackOptions({ onSubmit, isLoading = false }: { onSubmit: (items: string[]) => void | Promise<void>; isLoading?: boolean }) {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (option: string) => {
    if (submitting || isLoading) return;
    setSubmitting(true);
    try {
      await onSubmit([option]);
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) return <p className="text-center text-sm text-muted-foreground">Obrigado! Vamos usar isso para preparar outras sugestões.</p>;

  return (
    <div className="text-center">
      <p className="text-sm font-medium text-muted-foreground">O que não combinou?</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {FEEDBACK_OPTIONS.map((option) => (
          <button
            key={option}
            disabled={isLoading || submitting}
            onClick={() => { void handleSubmit(option); }}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs transition-colors",
              "border-border text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            {option}
          </button>
        ))}
      </div>
      {(isLoading || submitting) && <p className="mt-3 text-sm text-primary">Buscando outras opções...</p>}
    </div>
  );
}

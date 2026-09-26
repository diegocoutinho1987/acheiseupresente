import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  title: string;
  hint?: string;
  children: ReactNode;
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  canNext: boolean;
}

export function QuestionCard({ title, hint, children, onBack, onNext, nextLabel = "Continuar", canNext }: Props) {
  return (
    <section className="fade-up">
      <h1 className="text-2xl sm:text-3xl text-foreground">{title}</h1>
      {hint && <p className="mt-2 text-muted-foreground">{hint}</p>}
      <div className="mt-6">{children}</div>
      <div className="mt-8 flex items-center justify-between gap-3">
        {onBack ? (
          <Button variant="ghost" onClick={onBack} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        ) : <span />}
        <Button size="lg" onClick={onNext} disabled={!canNext} className="min-w-40 rounded-full">
          {nextLabel}
        </Button>
      </div>
    </section>
  );
}

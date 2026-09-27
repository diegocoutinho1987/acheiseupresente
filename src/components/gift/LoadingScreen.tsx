import { useEffect, useState } from "react";
import { Gift } from "lucide-react";
import { LOADING_MESSAGES } from "@/data/options";

export function LoadingScreen({ message }: { message?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => Math.min(x + 1, LOADING_MESSAGES.length - 1)), 900);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center" role="status" aria-live="polite">
      <div className="relative flex h-20 w-20 items-center justify-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-primary/10" />
        <span className="absolute inset-2 rounded-full bg-secondary" />
        <Gift className="relative h-8 w-8 animate-pulse text-primary" />
      </div>
      <p key={message ?? i} className="fade-up mt-8 text-lg font-medium text-foreground">{message ?? LOADING_MESSAGES[i]}</p>
      <div className="mt-4 flex gap-1.5">
        {LOADING_MESSAGES.map((_, k) => (
          <span key={k} className={`h-1.5 w-6 rounded-full transition-colors duration-500 ${k <= i ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>
    </div>
  );
}

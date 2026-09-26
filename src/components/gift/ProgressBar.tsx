export function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="w-full">
      <div className="mb-2 flex justify-between text-xs font-medium text-muted-foreground">
        <span>Etapa {step} de {total}</span>
        <span>{Math.round((step / total) * 100)}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={total}>
        <div className="h-full rounded-full bg-primary transition-all duration-500 ease-out" style={{ width: `${(step / total) * 100}%` }} />
      </div>
    </div>
  );
}

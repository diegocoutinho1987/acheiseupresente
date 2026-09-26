import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  helper?: string;
  disabled?: boolean;
  label: string;
}

export function TextArea({ value, onChange, placeholder, helper, disabled, label }: Props) {
  return (
    <div>
      <label className="sr-only">{label}</label>
      <textarea
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={5}
        className={cn(
          "w-full resize-none rounded-xl border border-input bg-card px-4 py-3.5 text-[15px] leading-relaxed text-foreground shadow-sm transition",
          "placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:opacity-50",
        )}
      />
      {helper && <p className="mt-2 text-sm text-muted-foreground">{helper}</p>}
    </div>
  );
}

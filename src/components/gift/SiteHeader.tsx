import { Link } from "@tanstack/react-router";
import { Gift } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
      <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Gift className="h-4 w-4" /></span>
        Presenteia
      </Link>
    </header>
  );
}

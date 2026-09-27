import { Link } from "@tanstack/react-router";

const LINKS = [
  { to: "/privacidade", label: "Políticas de privacidade" },
  { to: "/termos", label: "Termos de uso" },
  { to: "/sobre", label: "Sobre" },
  { to: "/contato", label: "Contato" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-7 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground">Achei Seu Presente!</p>
        <nav aria-label="Links institucionais" className="flex flex-wrap gap-x-5 gap-y-2 sm:justify-end">
          {LINKS.map((link) => (
            <Link key={link.to} to={link.to} className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}

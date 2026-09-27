import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/gift/SiteHeader";
import { SiteFooter } from "@/components/gift/SiteFooter";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de uso — Achei Seu Presente!" },
      { name: "description", content: "Termos gerais para utilização do Achei Seu Presente." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto min-h-[60vh] w-full max-w-3xl px-5 py-12 sm:py-16">
        <Link to="/" className="text-sm font-medium text-primary underline-offset-4 hover:underline">Voltar para o início</Link>
        <h1 className="mt-6 text-3xl text-foreground sm:text-4xl">Termos de uso</h1>
        <p className="mt-4 text-muted-foreground">O Achei Seu Presente oferece sugestões de presentes com base nas informações fornecidas pelo usuário e no catálogo disponível. As sugestões são apenas referências para apoiar a escolha. Os produtos e seus preços pertencem às respectivas lojas e podem mudar.</p>
        <p className="mt-4 text-muted-foreground">Se precisar de ajuda sobre uma sugestão ou produto, volte para a página de sugestões e consulte as opções disponíveis.</p>
      </main>
      <SiteFooter />
    </div>
  );
}

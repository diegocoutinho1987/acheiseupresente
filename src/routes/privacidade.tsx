import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/gift/SiteHeader";
import { SiteFooter } from "@/components/gift/SiteFooter";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Políticas de privacidade — Achei Seu Presente!" },
      { name: "description", content: "Esta página apresenta as informações sobre privacidade e uso de dados do Achei Seu Presente." },
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
        <h1 className="mt-6 text-3xl text-foreground sm:text-4xl">Políticas de privacidade</h1>
        <p className="mt-4 text-muted-foreground">Não pedimos cadastro para usar o questionário. Os eventos técnicos e de uso necessários ao funcionamento e à melhoria do serviço são registrados de acordo com a configuração da aplicação.</p>
        <p className="mt-4 text-muted-foreground">Se precisar de ajuda sobre uma sugestão ou produto, volte para a página de sugestões e consulte as opções disponíveis.</p>
      </main>
      <SiteFooter />
    </div>
  );
}

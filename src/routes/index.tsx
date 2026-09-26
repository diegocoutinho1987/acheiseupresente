import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Sparkles, Wallet, Store, Sparkle } from "lucide-react";
import { SiteHeader } from "@/components/gift/SiteHeader";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types";
import { getCatalog } from "@/services/catalogService";
import { formatPrice } from "@/utils/format";
import { track } from "@/services/analytics";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Achei Seu Presente! — descubra o presente certo para cada pessoa" },
      { name: "description", content: "Conte um pouco sobre a pessoa e descubra presentes que combinam com ela. 5 ideias personalizadas, dentro do seu orçamento." },
      { property: "og:title", content: "Achei Seu Presente! — descubra o presente certo para cada pessoa" },
      { property: "og:description", content: "Conte um pouco sobre a pessoa e descubra presentes que combinam com ela." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const BENEFITS = [
  { icon: Sparkles, title: "Personalizado", text: "Ideias pensadas a partir do jeito da pessoa." },
  { icon: Wallet, title: "De acordo com seu orçamento", text: "Só sugerimos o que cabe no valor escolhido." },
  { icon: Store, title: "Compre onde quiser", text: "Você decide onde e quando comprar." },
];

const STEPS = ["Conte para quem é o presente", "Fale sobre a pessoa", "Receba ideias personalizadas"];

const EXAMPLES = [
  { name: "Caneca térmica com controle de temperatura", who: "Irmão, 28 anos", reason: "Ama café e tecnologia — une os dois num objeto do dia a dia." },
  { name: "Kit de jardinagem para apartamento", who: "Mãe caseira", reason: "Gosta de cozinhar e de plantas: uma horta de temperos na janela." },
  { name: "Experiência: aula de cerâmica", who: "Namorada criativa", reason: "Curte arte e experiências novas — uma tarde fazendo cerâmica juntos." },
];

function Home() {
  const [catalog, setCatalog] = useState<Product[]>([]);
  useEffect(() => {
    track("home_view");
    getCatalog().then(setCatalog).catch(() => setCatalog([]));
  }, []);
  const examples = EXAMPLES.flatMap((example) => {
    const product = catalog.find((item) => item.name === example.name);
    return product ? [{ ...example, product }] : [];
  });

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <section className="mx-auto max-w-3xl px-5 pb-16 pt-10 text-center sm:pt-20">
          <span className="fade-up inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkle className="h-3.5 w-3.5 text-accent" /> Você conta para quem é. Nós encontramos ideias que fazem sentido.
          </span>
          <h1 className="fade-up mt-6 text-4xl leading-[1.05] text-foreground sm:text-6xl">Não sabe o que dar de presente?</h1>
          <p className="fade-up mx-auto mt-5 max-w-xl text-lg text-muted-foreground">Conte um pouco sobre a pessoa e descubra presentes que combinam com ela.</p>
          <div className="fade-up mt-8">
            <Button asChild size="lg" className="h-12 rounded-full px-7 text-base">
              <Link to="/encontrar">Encontrar meu presente <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">Sem cadastro · leva menos de 2 minutos</p>
          </div>
          <div className="mt-14 grid gap-4 text-left sm:grid-cols-3">
            {BENEFITS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border bg-card p-5">
                <Icon className="h-5 w-5 text-primary" />
                <p className="mt-3 font-semibold text-foreground">{title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y bg-muted/50">
          <div className="mx-auto max-w-5xl px-5 py-16">
            <h2 className="text-center text-2xl text-foreground sm:text-3xl">Como funciona</h2>
            <ol className="mt-10 grid gap-6 sm:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s} className="flex items-start gap-4 sm:flex-col sm:items-center sm:text-center">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-display text-lg text-primary-foreground">{i + 1}</span>
                  <p className="pt-2 font-medium text-foreground sm:pt-0">{s}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 py-16">
          <h2 className="text-center text-2xl text-foreground sm:text-3xl">Exemplos de recomendações</h2>
          <p className="mt-2 text-center text-muted-foreground">Cada sugestão vem com o motivo da escolha.</p>
          <div className="mt-10 grid gap-5 sm:grid-cols-3" aria-busy={catalog.length === 0}>
            {examples.map(({ product, who, reason }) => (
              <div key={product.id} className="overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-soft)]">
                <img src={product.image} alt={product.name} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                <div className="p-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Para: {who}</p>
                  <p className="mt-1 font-semibold text-foreground">{product.name}</p>
                  <p className="text-sm text-muted-foreground">{formatPrice(product.price)}</p>
                  <p className="mt-3 rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">{reason}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button asChild size="lg" className="rounded-full px-7">
              <Link to="/encontrar">Começar agora <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </section>
      </main>
      <footer className="border-t py-8 text-center text-xs text-muted-foreground">Achei Seu Presente! · versão de demonstração com produtos fictícios</footer>
    </div>
  );
}

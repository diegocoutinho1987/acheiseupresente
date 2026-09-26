import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { Gift, ArrowLeft, Sparkles, ExternalLink, RefreshCw } from "lucide-react";
import { processRecommendation } from "@/lib/recommendation.functions";
import { trackEvent } from "@/lib/tracking";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Achei! Presentes — recomendações de presente com IA" },
      {
        name: "description",
        content:
          "Descreva a pessoa e receba 5 sugestões de presente personalizadas, com justificativa para cada uma.",
      },
      { property: "og:title", content: "Achei! Presentes — recomendações de presente com IA" },
      {
        property: "og:description",
        content:
          "Descreva a pessoa e receba 5 sugestões de presente personalizadas, com justificativa para cada uma.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const RECIPIENTS = ["Mãe", "Pai", "Esposo(a)", "Namorado(a)", "Filho(a)", "Irmão(ã)", "Amigo(a)", "Colega", "Outra"];
const OCCASIONS = [
  "Aniversário",
  "Natal",
  "Dia dos Namorados",
  "Casamento",
  "Formatura",
  "Dia das Mães",
  "Dia dos Pais",
  "Outra",
  "Sem ocasião específica",
];
const BUDGETS = ["Até R$50", "R$50–100", "R$100–200", "R$200–500", "Mais de R$500"];

const STATUS_MESSAGES = [
  "Lendo o que você contou...",
  "Entendendo o perfil da pessoa...",
  "Vasculhando o catálogo...",
  "Escolhendo as 5 melhores ideias...",
  "Escrevendo as justificativas...",
];

type Product = {
  id: string;
  name: string;
  price: number;
  store: string;
  image_url: string | null;
  affiliate_url: string;
  justification: string;
};

type Step = "home" | "recipient" | "occasion" | "budget" | "about" | "avoid" | "processing" | "result";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

function OptionButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all",
        selected
          ? "border-primary bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
          : "border-border bg-card text-foreground hover:border-primary/50 hover:-translate-y-0.5",
      )}
    >
      {label}
    </button>
  );
}

function StepShell({
  title,
  subtitle,
  onBack,
  progress,
  children,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  progress: number;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-xl px-5 py-10">
      <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
      )}
      <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">{title}</h2>
      {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}

function Index() {
  const [step, setStep] = useState<Step>("home");
  const [recipient, setRecipient] = useState("");
  const [occasion, setOccasion] = useState("");
  const [budget, setBudget] = useState("");
  const [about, setAbout] = useState("");
  const [avoid, setAvoid] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [statusIndex, setStatusIndex] = useState(0);

  const run = useServerFn(processRecommendation);

  useEffect(() => {
    trackEvent("home_view");
  }, []);

  useEffect(() => {
    if (step !== "processing") return;
    setStatusIndex(0);
    const timer = setInterval(() => {
      setStatusIndex((i) => Math.min(i + 1, STATUS_MESSAGES.length - 1));
    }, 2200);
    return () => clearInterval(timer);
  }, [step]);

  const progress = useMemo(() => {
    const order: Step[] = ["recipient", "occasion", "budget", "about", "avoid"];
    const idx = order.indexOf(step);
    return idx === -1 ? 100 : ((idx + 1) / order.length) * 100;
  }, [step]);

  async function submit(refinement?: string) {
    setError(null);
    setStep("processing");
    trackEvent("profile_submitted", { recipient, occasion, budget });
    try {
      const result = await run({
        data: {
          recipient,
          occasion,
          budget_range: budget,
          profile_text: about,
          avoid_text: avoid,
          ...(refinement ? { refinement_preference: refinement } : {}),
        },
      });
      setProducts(result.products as Product[]);
      trackEvent("recommendation_generated", { count: result.products.length });
      setStep("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não conseguimos gerar as sugestões agora.");
      setStep("avoid");
    }
  }

  if (step === "home") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-accent" /> Sugestões com IA
        </span>
        <h1 className="max-w-2xl text-4xl leading-tight text-foreground sm:text-6xl">
          Não sabe o que dar de presente?
        </h1>
        <p className="mt-5 max-w-md text-base text-muted-foreground">
          Conte um pouco sobre a pessoa e receba 5 ideias de presente escolhidas para ela — com o porquê de
          cada uma.
        </p>
        <button
          type="button"
          onClick={() => {
            trackEvent("generator_started");
            setStep("recipient");
          }}
          className="btn-hero mt-9 inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold hover:btn-hero-hover"
        >
          <Gift className="h-5 w-5" /> Encontrar meu presente
        </button>
        <p className="mt-4 text-xs text-muted-foreground">Leva menos de 2 minutos</p>
      </main>
    );
  }

  if (step === "recipient") {
    return (
      <StepShell title="Para quem é o presente?" progress={progress} onBack={() => setStep("home")}>
        <div className="grid grid-cols-2 gap-3">
          {RECIPIENTS.map((r) => (
            <OptionButton
              key={r}
              label={r}
              selected={recipient === r}
              onClick={() => {
                setRecipient(r);
                setStep("occasion");
              }}
            />
          ))}
        </div>
      </StepShell>
    );
  }

  if (step === "occasion") {
    return (
      <StepShell title="Qual é a ocasião?" progress={progress} onBack={() => setStep("recipient")}>
        <div className="grid grid-cols-2 gap-3">
          {OCCASIONS.map((o) => (
            <OptionButton
              key={o}
              label={o}
              selected={occasion === o}
              onClick={() => {
                setOccasion(o);
                setStep("budget");
              }}
            />
          ))}
        </div>
      </StepShell>
    );
  }

  if (step === "budget") {
    return (
      <StepShell title="Quanto você quer gastar?" progress={progress} onBack={() => setStep("occasion")}>
        <div className="grid gap-3">
          {BUDGETS.map((b) => (
            <OptionButton
              key={b}
              label={b}
              selected={budget === b}
              onClick={() => {
                setBudget(b);
                setStep("about");
              }}
            />
          ))}
        </div>
      </StepShell>
    );
  }

  if (step === "about") {
    return (
      <StepShell
        title="Fale sobre essa pessoa"
        subtitle="Gostos, hobbies, jeito de ser, algo que ela comentou recentemente. Quanto mais detalhes, melhores as sugestões."
        progress={progress}
        onBack={() => setStep("budget")}
      >
        <textarea
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          rows={6}
          placeholder="Ex.: Ela adora café, lê todo fim de semana e está sempre reformando algum cantinho da casa..."
          className="w-full rounded-xl border border-input bg-card p-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/30"
        />
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>Mínimo de 20 caracteres</span>
          <span>{about.trim().length}</span>
        </div>
        <button
          type="button"
          disabled={about.trim().length < 20}
          onClick={() => setStep("avoid")}
          className="btn-hero mt-6 w-full rounded-full px-6 py-3.5 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-40"
        >
          Continuar
        </button>
      </StepShell>
    );
  }

  if (step === "avoid") {
    return (
      <StepShell
        title="Tem algo para evitar?"
        subtitle="Opcional — coisas que ela não gosta ou já tem."
        progress={progress}
        onBack={() => setStep("about")}
      >
        <textarea
          value={avoid}
          onChange={(e) => setAvoid(e.target.value)}
          rows={4}
          placeholder="Ex.: nada de perfume, já tem fone de ouvido..."
          className="w-full rounded-xl border border-input bg-card p-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/30"
        />
        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        <button
          type="button"
          onClick={() => submit()}
          className="btn-hero mt-6 w-full rounded-full px-6 py-3.5 text-base font-semibold"
        >
          Ver minhas sugestões
        </button>
      </StepShell>
    );
  }

  if (step === "processing") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="relative mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-card shadow-[var(--shadow-soft)]">
          <Gift className="h-9 w-9 animate-bounce text-primary" />
        </div>
        <h2 className="text-2xl text-foreground">{STATUS_MESSAGES[statusIndex]}</h2>
        <p className="mt-3 text-sm text-muted-foreground">Isso costuma levar alguns segundos.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-12">
      <h2 className="text-3xl text-foreground sm:text-4xl">Achei estas 5 ideias</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Escolhidas a partir do que você contou sobre {recipient.toLowerCase()} — {occasion.toLowerCase()},{" "}
        {budget.toLowerCase()}.
      </p>

      {products.length === 0 && (
        <p className="mt-8 rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
          Nenhum produto do catálogo se encaixou nessa faixa de preço. Tente outro orçamento.
        </p>
      )}

      <div className="mt-8 grid gap-5">
        {products.map((p) => (
          <article key={p.id} className="surface-card overflow-hidden sm:flex">
            {p.image_url && (
              <img
                src={p.image_url}
                alt={p.name}
                className="h-48 w-full object-cover sm:h-auto sm:w-44"
                loading="lazy"
              />
            )}
            <div className="flex flex-1 flex-col p-5">
              <h3 className="text-lg text-foreground">{p.name}</h3>
              <div className="mt-1 flex items-center gap-2 text-sm">
                <span className="font-semibold text-primary">{brl(p.price)}</span>
                <span className="text-muted-foreground">· {p.store}</span>
              </div>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{p.justification}</p>
              <a
                href={p.affiliate_url}
                target="_blank"
                rel="noreferrer noopener"
                onClick={() => trackEvent("product_clicked", { product_id: p.id, name: p.name })}
                className="btn-hero mt-4 inline-flex w-fit items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
              >
                Ver produto <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            trackEvent("refinement_clicked", { preference: "mais criativas" });
            submit("Quero opções mais criativas e menos óbvias");
          }}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition hover:border-primary/50"
        >
          <RefreshCw className="h-4 w-4" /> Quero opções mais criativas
        </button>
        <button
          type="button"
          onClick={() => setStep("recipient")}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition hover:border-primary/50"
        >
          Começar de novo
        </button>
      </div>
    </main>
  );
}

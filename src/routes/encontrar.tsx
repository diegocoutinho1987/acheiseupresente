import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { SearchX, RefreshCw, Pencil } from "lucide-react";
import { SiteHeader } from "@/components/gift/SiteHeader";
import { ProgressBar } from "@/components/gift/ProgressBar";
import { QuestionCard } from "@/components/gift/QuestionCard";
import { OptionButton } from "@/components/gift/OptionButton";
import { TextArea } from "@/components/gift/TextArea";
import { LoadingScreen } from "@/components/gift/LoadingScreen";
import { RecommendationList } from "@/components/gift/RecommendationList";
import { RefinementButtons } from "@/components/gift/RefinementButtons";
import { FeedbackOptions } from "@/components/gift/FeedbackOptions";
import { Button } from "@/components/ui/button";
import { RECIPIENTS, OCCASIONS, BUDGETS } from "@/data/options";
import { useGiftFlow, TOTAL_STEPS } from "@/hooks/useGiftFlow";
import { track, type AnalyticsEvent } from "@/services/analytics";

export const Route = createFileRoute("/encontrar")({
  head: () => ({
    meta: [
      { title: "Encontrar presente — Presenteia" },
      { name: "description", content: "Responda 5 perguntas rápidas e receba 5 ideias de presente com a explicação de cada escolha." },
      { property: "og:title", content: "Encontrar presente — Presenteia" },
      { property: "og:description", content: "Responda 5 perguntas rápidas e receba 5 ideias de presente com a explicação de cada escolha." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FinderPage,
});

function FinderPage() {
  const flow = useGiftFlow();
  const { profile, update, step, setStep, phase } = flow;

  useEffect(() => { track("generator_started"); }, []);

  const choose = (key: "recipient" | "occasion" | "budget", value: string, event: AnalyticsEvent) => {
    update({ [key]: value });
    track(event, { value });
  };
  const next = () => { setStep(step + 1); window.scrollTo({ top: 0 }); };
  const back = () => setStep(step - 1);
  const noAvoid = profile.avoid === "__none__";

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className={`mx-auto px-5 pb-20 ${phase === "results" ? "max-w-6xl" : "max-w-xl"}`}>
        {phase === "questions" && (
          <>
            <div className="mb-8 mt-2"><ProgressBar step={step} total={TOTAL_STEPS} /></div>
            <div key={step}>
              {step === 1 && (
                <QuestionCard title="Para quem é o presente?" onNext={next} canNext={!!profile.recipient}>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {RECIPIENTS.map((r) => <OptionButton key={r} label={r} selected={profile.recipient === r} onClick={() => choose("recipient", r, "recipient_selected")} />)}
                  </div>
                </QuestionCard>
              )}
              {step === 2 && (
                <QuestionCard title="Qual é a ocasião?" onBack={back} onNext={next} canNext={!!profile.occasion}>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {OCCASIONS.map((o) => <OptionButton key={o} label={o} selected={profile.occasion === o} onClick={() => choose("occasion", o, "occasion_selected")} />)}
                  </div>
                </QuestionCard>
              )}
              {step === 3 && (
                <QuestionCard title="Quanto você pretende gastar?" onBack={back} onNext={next} canNext={!!profile.budget}>
                  <div className="grid gap-2.5">
                    {BUDGETS.map((b) => <OptionButton key={b.label} label={b.label} selected={profile.budget === b.label} onClick={() => choose("budget", b.label, "budget_selected")} />)}
                  </div>
                </QuestionCard>
              )}
              {step === 4 && (
                <QuestionCard title="Conte um pouco sobre essa pessoa." hint="Idade, profissão, hobbies, jeito de ser — tudo ajuda." onBack={back} onNext={next} canNext={profile.description.trim().length >= 15}>
                  <TextArea
                    label="Descrição da pessoa"
                    value={profile.description}
                    onChange={(v) => update({ description: v })}
                    placeholder="Meu irmão tem 28 anos, trabalha com programação, gosta de videogame, café e tecnologia. É bastante caseiro e gosta de coisas práticas."
                    helper="Quanto mais você contar, mais personalizadas serão as sugestões."
                  />
                </QuestionCard>
              )}
              {step === 5 && (
                <QuestionCard title="Tem alguma coisa que você quer evitar?" hint="Opcional." onBack={back} onNext={flow.submit} nextLabel="Encontrar presentes" canNext>
                  <TextArea
                    label="O que evitar"
                    value={noAvoid ? "" : profile.avoid}
                    disabled={noAvoid}
                    onChange={(v) => update({ avoid: v })}
                    placeholder="Ele já tem muitos acessórios para computador e não quero dar roupas."
                  />
                  <label className="mt-3 flex cursor-pointer items-center gap-2.5 text-sm text-foreground">
                    <input type="checkbox" className="h-4 w-4 accent-[var(--primary)]" checked={noAvoid} onChange={(e) => update({ avoid: e.target.checked ? "__none__" : "" })} />
                    Não tenho nada para evitar
                  </label>
                </QuestionCard>
              )}
            </div>
          </>
        )}

        {phase === "loading" && <LoadingScreen />}

        {phase === "error" && (
          <div className="fade-up flex min-h-[60vh] flex-col items-center justify-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted"><SearchX className="h-6 w-6 text-muted-foreground" /></span>
            <h1 className="mt-6 text-2xl text-foreground">Não conseguimos encontrar boas opções dessa vez.</h1>
            <p className="mt-2 max-w-sm text-muted-foreground">Tente alterar alguma informação sobre a pessoa, o orçamento ou suas preferências.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button className="rounded-full" onClick={flow.retry}><RefreshCw className="h-4 w-4" /> Tentar novamente</Button>
              <Button variant="outline" className="rounded-full" onClick={flow.editAnswers}><Pencil className="h-4 w-4" /> Editar respostas</Button>
            </div>
          </div>
        )}

        {phase === "results" && (
          <div className="fade-up">
            <div className="mx-auto mb-10 mt-4 max-w-2xl text-center">
              <h1 className="text-3xl sm:text-4xl text-foreground">Encontramos algumas ideias para você.</h1>
              <p className="mt-3 text-muted-foreground">Selecionamos opções pensando no perfil que você descreveu.</p>
              <p className="mt-4 text-sm text-muted-foreground">
                {profile.recipient} · {profile.occasion} · {profile.budget}
                {profile.refinement && <> · <span className="font-medium text-primary">{profile.refinement}</span></>}
                {" · "}<button onClick={flow.editAnswers} className="font-medium text-foreground underline underline-offset-4">editar</button>
              </p>
            </div>
            <RecommendationList items={flow.results} onProductClick={(r) => track("product_clicked", { id: r.product.id })} />
            <section className="mx-auto mt-14 max-w-2xl rounded-2xl border bg-card p-6 text-center sm:p-8">
              <h2 className="text-xl text-foreground">Não encontrou exatamente o que queria?</h2>
              <div className="mt-5"><RefinementButtons active={profile.refinement} onSelect={flow.refine} /></div>
            </section>
            <div className="mt-10"><FeedbackOptions key={flow.results.map((r) => r.product.id).join()} onSubmit={flow.addFeedback} /></div>
          </div>
        )}
      </main>
    </div>
  );
}

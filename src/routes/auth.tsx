import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/gift/SiteHeader";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Achei Seu Presente!" },
      { name: "description", content: "Acesso à área administrativa do Achei Seu Presente!" },
      { property: "og:title", content: "Entrar — Achei Seu Presente!" },
      { property: "og:description", content: "Acesso à área administrativa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate({ to: "/admin" }); });
    const { data } = supabase.auth.onAuthStateChange((e, s) => { if (e === "SIGNED_IN" && s) navigate({ to: "/admin" }); });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin` } });
        if (error) throw error;
        if (!data.session) toast.success("Conta criada! Confirme pelo link enviado ao seu e-mail.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível entrar.");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/auth` });
    if (r && "error" in r && r.error) toast.error("Não foi possível entrar com Google.");
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-sm px-5 py-12">
        <h1 className="font-display text-3xl font-semibold text-foreground">Área administrativa</h1>
        <p className="mt-2 text-sm text-muted-foreground">{mode === "login" ? "Entre para gerenciar os produtos." : "Crie sua conta de administração."}</p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <div className="space-y-1.5"><Label htmlFor="email">E-mail</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="pw">Senha</Label><Input id="pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <Button type="submit" className="w-full rounded-full" disabled={busy}>{mode === "login" ? "Entrar" : "Criar conta"}</Button>
        </form>
        <Button variant="outline" className="mt-3 w-full rounded-full" onClick={google}>Continuar com Google</Button>
        <button className="mt-6 w-full text-center text-sm text-primary hover:underline" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
          {mode === "login" ? "Não tem conta? Criar conta" : "Já tem conta? Entrar"}
        </button>
      </main>
    </div>
  );
}

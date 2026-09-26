import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Área administrativa" },
      { name: "description", content: "Acesso à área administrativa do catálogo de presentes." },
      { property: "og:title", content: "Entrar — Área administrativa" },
      { property: "og:description", content: "Acesso à área administrativa do catálogo de presentes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) navigate({ to: "/admin" });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const res =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${window.location.origin}/admin` },
          });
    setLoading(false);
    if (res.error) setMsg(res.error.message);
    else if (mode === "signup" && !res.data.session)
      setMsg("Conta criada! Confirme pelo link enviado ao seu e-mail.");
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r?.error) setMsg(String(r.error.message ?? r.error));
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="surface-card w-full max-w-sm p-6 space-y-4">
        <h1 className="font-display text-2xl text-foreground">
          {mode === "login" ? "Entrar" : "Criar conta"}
        </h1>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="pw">Senha</Label>
            <Input id="pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {mode === "login" ? "Entrar" : "Criar conta"}
          </Button>
        </form>
        <Button variant="outline" className="w-full" onClick={google}>Entrar com Google</Button>
        {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
        <button className="text-sm text-primary underline" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
          {mode === "login" ? "Não tem conta? Criar" : "Já tem conta? Entrar"}
        </button>
      </div>
    </main>
  );
}

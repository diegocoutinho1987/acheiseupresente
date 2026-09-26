import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Produtos — Achei Seu Presente!" },
      { name: "description", content: "Gerencie produtos e links de afiliado." },
      { property: "og:title", content: "Produtos — Achei Seu Presente!" },
      { property: "og:description", content: "Gerencie produtos e links de afiliado." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});
function AdminLayout() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        setIsAdmin(false);
        return;
      }
      const { data } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
      setIsAdmin(!!data);
    })();
  }, []);
  if (isAdmin === null) return <div className="grid min-h-screen place-items-center bg-muted/40 text-sm text-muted-foreground">Verificando acesso…</div>;
  if (!isAdmin) return <div className="grid min-h-screen place-items-center bg-muted/40 p-6"><div className="max-w-md rounded-md border bg-card p-8 text-center"><h1 className="text-xl font-semibold">Acesso não autorizado</h1><p className="mt-2 text-sm text-muted-foreground">Sua conta não tem permissão para acessar o catálogo administrativo.</p></div></div>;
  return <AdminShell />;
}

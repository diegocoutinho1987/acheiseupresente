import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, Menu, Package, Plus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const navigation = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/products", label: "Produtos", icon: Package },
  { to: "/admin/products/new", label: "Adicionar produto", icon: Plus },
] as const;

export function AdminShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-muted/40 text-foreground">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-4 md:hidden">
        <Link to="/admin" className="font-display text-lg font-semibold">Achei Seu Presente!</Link>
        <Button size="icon" variant="ghost" onClick={() => setOpen((value) => !value)} aria-label={open ? "Fechar menu" : "Abrir menu"}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {open && <Button variant="ghost" className="fixed inset-0 z-30 h-auto w-auto rounded-none bg-foreground/20 p-0 hover:bg-foreground/20 md:hidden" onClick={() => setOpen(false)} aria-label="Fechar menu" />}

      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-sidebar transition-transform md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-20 items-center border-b px-6">
          <Link to="/admin" className="font-display text-lg font-semibold" onClick={() => setOpen(false)}>Achei Seu Presente!</Link>
        </div>
        <div className="px-4 pt-6">
          <p className="px-3 text-xs font-semibold uppercase text-muted-foreground">Administração</p>
          <nav className="mt-3 space-y-1">
            {navigation.map(({ to, label, icon: Icon }) => {
              const active = to === "/admin" ? location.pathname === to : location.pathname.startsWith(to);
              return (
                <Link key={to} to={to} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"}`}>
                  <Icon className="h-4 w-4" />{label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto border-t p-4">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={logout}><LogOut className="h-4 w-4" /> Sair</Button>
        </div>
      </aside>

      <main className="min-h-screen md:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10"><Outlet /></div>
      </main>
    </div>
  );
}
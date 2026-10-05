import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { Activity, BarChart3, ClipboardList, FolderTree, HandHelping, Home, LayoutDashboard, LogOut, Menu, Settings, Users, X } from "lucide-react";
import { useState } from "react";
import { RequireAdmin } from "@/components/auth/Guards";
import { Logo } from "@/components/layout/Logo";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — LostLink" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/reports", label: "Reports", icon: ClipboardList },
  { to: "/admin/claims", label: "Claims", icon: HandHelping },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/categories", label: "Categories", icon: FolderTree },
  { to: "/admin/activity", label: "Activity Logs", icon: Activity },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/settings", label: "Settings", icon: Settings },
] as const;

function AdminLayout() {
  const { profile, isSuperAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function logout() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  }

  const sidebar = (
    <nav className="flex h-full flex-col gap-1 p-4">
      <div className="mb-6 px-2"><Logo /></div>
      {nav.map(({ to, label, icon: Icon, ...rest }) => (
        <Link
          key={to}
          to={to}
          onClick={() => setOpen(false)}
          activeOptions={{ exact: "exact" in rest }}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          activeProps={{ className: "bg-primary-soft text-primary" }}
        >
          <Icon className="h-4 w-4" /> {label}
        </Link>
      ))}
      <div className="mt-auto space-y-1 border-t border-border pt-4">
        <Link to="/" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted"><Home className="h-4 w-4" /> Back to site</Link>
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted"><LogOut className="h-4 w-4" /> Logout</button>
      </div>
    </nav>
  );

  return (
    <RequireAdmin>
      <div className="flex min-h-screen bg-background">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-border bg-card lg:block">{sidebar}</aside>
        {open ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-foreground/30" onClick={() => setOpen(false)} />
            <aside className="relative h-full w-64 bg-card shadow-xl">{sidebar}</aside>
          </div>
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/90 px-4 backdrop-blur sm:px-6">
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}>{open ? <X /> : <Menu />}</Button>
            <p className="hidden text-sm text-muted-foreground lg:block">Admin Console</p>
            <div className="flex items-center gap-3">
              <NotificationBell />
              <div className="text-right text-sm">
                <p className="font-medium">{profile?.full_name}</p>
                <p className="text-xs text-muted-foreground">{isSuperAdmin ? "Super Admin" : "Admin"}</p>
              </div>
            </div>
          </header>
          <main className={cn("flex-1 p-4 sm:p-6 lg:p-8")}><Outlet /></main>
        </div>
      </div>
    </RequireAdmin>
  );
}

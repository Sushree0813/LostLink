import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldAlert } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

function FullLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

/** Client-side gate; real enforcement happens in database row-level security. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, profile } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!isLoading && !isAuthenticated) void navigate({ to: "/auth", search: { mode: "login" } as never });
  }, [isLoading, isAuthenticated, navigate]);
  if (isLoading || !isAuthenticated) return <FullLoader />;
  if (profile?.status === "inactive")
    return (
      <Denied
        title="Account deactivated"
        text="Your account has been deactivated by an administrator. Please contact the admin desk."
      />
    );
  return <>{children}</>;
}

export function RequireAdmin({ children, superOnly = false }: { children: ReactNode; superOnly?: boolean }) {
  const { isAdmin, isSuperAdmin, isLoading, isAuthenticated, roles } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!isLoading && !isAuthenticated) void navigate({ to: "/auth", search: { mode: "login" } as never });
  }, [isLoading, isAuthenticated, navigate]);
  if (isLoading || !isAuthenticated || roles.length === 0) return <FullLoader />;
  if (superOnly ? !isSuperAdmin : !isAdmin)
    return <Denied title="Access denied" text="You don't have permission to view this page." />;
  return <>{children}</>;
}

function Denied({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <ShieldAlert className="h-10 w-10 text-destructive" />
      <h1 className="font-display text-xl font-semibold">{title}</h1>
      <p className="max-w-sm text-sm text-muted-foreground">{text}</p>
      <Button asChild variant="outline">
        <Link to="/">Go home</Link>
      </Button>
    </div>
  );
}

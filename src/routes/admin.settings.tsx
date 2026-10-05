import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeading } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/services/activity";
import { listUsers, type ManagedUser } from "@/services/users";
import { formatDateTime } from "@/utils/format";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — LostLink Admin" }] }),
  component: Settings,
});

function Settings() {
  const { isSuperAdmin, user } = useAuth();
  const qc = useQueryClient();
  const { data: users = [] } = useQuery({ queryKey: ["admin-users"], queryFn: listUsers, enabled: isSuperAdmin });
  const { data: messages = [] } = useQuery({
    queryKey: ["contact-messages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function setAdmin(u: ManagedUser, grant: boolean) {
    const { error } = grant
      ? await supabase.from("user_roles").insert({ user_id: u.id, role: "admin" })
      : await supabase.from("user_roles").delete().eq("user_id", u.id).eq("role", "admin");
    if (error) return void toast.error(error.message);
    await logActivity(user!.id, grant ? "admin_granted" : "admin_revoked", `${grant ? "Granted" : "Revoked"} admin for ${u.email}`);
    toast.success(grant ? `${u.full_name} is now an admin` : `Admin access removed from ${u.full_name}`);
    void qc.invalidateQueries({ queryKey: ["admin-users"] });
  }
  async function deleteMessage(id: string) {
    const { error } = await supabase.from("contact_messages").delete().eq("id", id);
    if (error) return void toast.error(error.message);
    void qc.invalidateQueries({ queryKey: ["contact-messages"] });
  }

  return (
    <div className="space-y-8">
      <PageHeading title="Settings" description="Administrator management and contact messages." />
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-1 flex items-center gap-2 font-display font-semibold"><ShieldCheck className="h-4 w-4 text-primary" /> Manage administrators</h2>
        {!isSuperAdmin ? (
          <p className="text-sm text-muted-foreground">Only the Super Admin can grant or remove admin access.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {users.filter((u) => !u.roles.includes("super_admin")).map((u) => {
              const isAdm = u.roles.includes("admin");
              return (
                <li key={u.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div><p className="font-medium">{u.full_name}</p><p className="text-xs text-muted-foreground">{u.email}</p></div>
                  <Button size="sm" variant={isAdm ? "outline" : "default"} onClick={() => setAdmin(u, !isAdm)}>{isAdm ? "Remove admin" : "Make admin"}</Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 font-display font-semibold">Contact messages ({messages.length})</h2>
        {messages.length === 0 ? <p className="text-sm text-muted-foreground">No messages yet.</p> : (
          <ul className="space-y-3">
            {messages.map((m) => (
              <li key={m.id} className="rounded-lg border border-border p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div><p className="font-medium">{m.subject}</p><p className="text-xs text-muted-foreground">{m.name} · {m.email} · {formatDateTime(m.created_at)}</p></div>
                  <Button size="icon" variant="ghost" aria-label="Delete message" onClick={() => deleteMessage(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{m.message}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

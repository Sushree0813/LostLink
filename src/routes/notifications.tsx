import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, CheckCheck } from "lucide-react";
import { RequireAuth } from "@/components/auth/Guards";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeading, PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "@/services/notifications";
import { cn } from "@/lib/utils";
import { relativeTime } from "@/utils/format";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — LostLink" },
      { name: "description", content: "Updates on your reports and claims." },
      { property: "og:title", content: "Notifications — LostLink" },
      { property: "og:description", content: "Your LostLink notifications." },
    ],
  }),
  component: () => (
    <PageShell>
      <RequireAuth>
        <NotificationsPage />
      </RequireAuth>
    </PageShell>
  ),
});

function NotificationsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: notes, isLoading } = useQuery({ queryKey: ["notifications", user!.id], queryFn: () => listNotifications(user!.id) });
  const refresh = () => qc.invalidateQueries({ queryKey: ["notifications"] });
  const unread = notes?.filter((n) => !n.is_read).length ?? 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <PageHeading
        title="Notifications"
        description={`${unread} unread`}
        action={<Button variant="outline" disabled={!unread} onClick={async () => { await markAllNotificationsRead(user!.id); void refresh(); }}><CheckCheck className="h-4 w-4" /> Mark all as read</Button>}
      />
      {isLoading ? <Skeleton className="h-64 rounded-xl" /> : !notes?.length ? (
        <EmptyState icon={Bell} title="You're all caught up" description="Notifications about your reports and claims appear here." />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {notes.map((n) => (
            <li key={n.id} className={cn("flex gap-4 p-4", !n.is_read && "bg-primary/5")}>
              <span className={cn("mt-2 h-2 w-2 shrink-0 rounded-full", n.is_read ? "bg-transparent" : "bg-primary")} />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{n.title}</p>
                <p className="text-sm text-muted-foreground">{n.message}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{relativeTime(n.created_at)}</span>
                  {n.link ? <Link to={n.link as never} className="font-medium text-primary hover:underline">Open</Link> : null}
                  {!n.is_read ? <button className="font-medium hover:text-foreground" onClick={async () => { await markNotificationRead(n.id); void refresh(); }}>Mark as read</button> : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, CheckCircle2, ClipboardList, Clock, FileSearch, HandHelping, PackageOpen, PackageSearch, Search } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { RequireAuth } from "@/components/auth/Guards";
import { EmptyState } from "@/components/common/EmptyState";
import { StatCard } from "@/components/common/StatCard";
import { ItemStatusBadge, ItemTypeBadge } from "@/components/common/StatusBadge";
import { PageHeading, PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { listMyClaims } from "@/services/claims";
import { listMyItems } from "@/services/items";
import { listNotifications } from "@/services/notifications";
import { relativeTime } from "@/utils/format";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "My Dashboard — LostLink" },
      { name: "description", content: "Your LostLink reports, claims and notifications at a glance." },
      { property: "og:title", content: "My Dashboard — LostLink" },
      { property: "og:description", content: "Track your lost and found reports and claims." },
    ],
  }),
  component: () => (
    <PageShell>
      <RequireAuth>
        <Dashboard />
      </RequireAuth>
    </PageShell>
  ),
});

function Dashboard() {
  const { user, profile } = useAuth();
  const uid = user!.id;
  const { data: items = [] } = useQuery({ queryKey: ["my-items", uid], queryFn: () => listMyItems(uid) });
  const { data: claims = [] } = useQuery({ queryKey: ["my-claims", uid], queryFn: () => listMyClaims(uid) });
  const { data: notes = [] } = useQuery({ queryKey: ["notifications", uid], queryFn: () => listNotifications(uid) });

  const count = (s: string) => items.filter((i) => i.status === s).length;
  const chart = [
    { name: "Pending", value: count("pending") },
    { name: "Approved", value: count("approved") },
    { name: "Rejected", value: count("rejected") },
    { name: "Recovered", value: count("recovered") },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10">
      <PageHeading title={`Welcome back, ${profile?.full_name?.split(" ")[0] ?? "there"}`} description="Here's what's happening with your reports and claims." />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Reports" value={items.length} icon={ClipboardList} />
        <StatCard label="Lost Items" value={items.filter((i) => i.item_type === "lost").length} icon={PackageSearch} tone="lost" />
        <StatCard label="Found Items" value={items.filter((i) => i.item_type === "found").length} icon={PackageOpen} tone="found" />
        <StatCard label="Active Claims" value={claims.filter((c) => c.status === "pending" || c.status === "under_review").length} icon={HandHelping} tone="info" />
        <StatCard label="Recovered" value={count("recovered")} icon={CheckCircle2} tone="success" />
        <StatCard label="Pending Reports" value={count("pending")} icon={Clock} tone="warning" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Button asChild size="lg"><Link to="/report/lost"><PackageSearch className="h-4 w-4" /> Report Lost Item</Link></Button>
        <Button asChild size="lg" variant="secondary"><Link to="/report/found"><PackageOpen className="h-4 w-4" /> Report Found Item</Link></Button>
        <Button asChild size="lg" variant="outline"><Link to="/browse"><Search className="h-4 w-4" /> Browse Items</Link></Button>
        <Button asChild size="lg" variant="outline"><Link to="/my-claims"><FileSearch className="h-4 w-4" /> View My Claims</Link></Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <h2 className="mb-4 font-display font-semibold">Recent reports</h2>
          {items.length === 0 ? (
            <EmptyState title="No reports yet" description="Report a lost or found item to get started." />
          ) : (
            <ul className="divide-y divide-border">
              {items.slice(0, 6).map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <Link to="/items/$itemId" params={{ itemId: i.id }} className="truncate font-medium hover:text-primary">{i.item_name}</Link>
                    <p className="text-xs text-muted-foreground">{i.location} · {relativeTime(i.created_at)}</p>
                  </div>
                  <div className="flex shrink-0 gap-2"><ItemTypeBadge type={i.item_type} /><ItemStatusBadge status={i.status} /></div>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 flex items-center gap-2 font-display font-semibold"><Bell className="h-4 w-4" /> Notifications</h2>
          {notes.length === 0 ? <p className="text-sm text-muted-foreground">No notifications.</p> : (
            <ul className="space-y-3">
              {notes.slice(0, 5).map((n) => (
                <li key={n.id} className="text-sm">
                  <p className={n.is_read ? "font-medium" : "font-semibold text-primary"}>{n.title}</p>
                  <p className="line-clamp-2 text-muted-foreground">{n.message}</p>
                </li>
              ))}
            </ul>
          )}
          <Button asChild variant="link" className="mt-2 px-0"><Link to="/notifications">See all</Link></Button>
        </section>
      </div>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 font-display font-semibold">My reports by status</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Bar dataKey="value" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

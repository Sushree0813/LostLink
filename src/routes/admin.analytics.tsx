import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AdminCharts } from "@/components/admin/AdminCharts";
import { PageHeading } from "@/components/layout/PageShell";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdminStats } from "@/services/stats";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({ meta: [{ title: "Analytics — LostLink Admin" }] }),
  component: Analytics,
});

function Analytics() {
  const { data: s, isLoading } = useQuery({ queryKey: ["admin-stats"], queryFn: getAdminStats });
  if (isLoading || !s) return <Skeleton className="h-96 rounded-xl" />;
  const total = s.totalLost + s.totalFound;
  const rate = s.totalFound ? Math.round((s.recoveredItems / s.totalFound) * 100) : 0;
  const claimTotal = s.approvedClaims + s.rejectedClaims;
  return (
    <div className="space-y-6">
      <PageHeading title="Analytics" description="Detailed statistics across all reports and claims." />
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Total reports", total],
          ["Recovery rate (found items)", `${rate}%`],
          ["Claim approval rate", claimTotal ? `${Math.round((s.approvedClaims / claimTotal) * 100)}%` : "—"],
        ].map(([l, v]) => (
          <div key={l} className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">{l}</p>
            <p className="mt-1 font-display text-3xl font-semibold">{v}</p>
          </div>
        ))}
      </div>
      <AdminCharts stats={s} />
    </div>
  );
}

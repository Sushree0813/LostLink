import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ClipboardCheck, Clock, HandHelping, PackageCheck, PackageOpen, PackageSearch, Users, XCircle } from "lucide-react";
import { AdminCharts } from "@/components/admin/AdminCharts";
import { StatCard } from "@/components/common/StatCard";
import { PageHeading } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdminStats } from "@/services/stats";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin Dashboard — LostLink" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: s, isLoading } = useQuery({ queryKey: ["admin-stats"], queryFn: getAdminStats });
  if (isLoading || !s) return <Skeleton className="h-96 rounded-xl" />;
  return (
    <div className="space-y-8">
      <PageHeading title="Admin Dashboard" description="Overview of campus lost-and-found activity." action={<Button asChild><Link to="/admin/reports">Review pending reports ({s.pendingReports})</Link></Button>} />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Total Users" value={s.totalUsers} icon={Users} />
        <StatCard label="Lost Reports" value={s.totalLost} icon={PackageSearch} tone="lost" />
        <StatCard label="Found Reports" value={s.totalFound} icon={PackageOpen} tone="found" />
        <StatCard label="Pending Reports" value={s.pendingReports} icon={Clock} tone="warning" />
        <StatCard label="Approved Reports" value={s.approvedReports} icon={ClipboardCheck} tone="info" />
        <StatCard label="Pending Claims" value={s.pendingClaims} icon={HandHelping} tone="warning" />
        <StatCard label="Approved Claims" value={s.approvedClaims} icon={CheckCircle2} tone="success" />
        <StatCard label="Rejected Claims" value={s.rejectedClaims} icon={XCircle} tone="lost" />
        <StatCard label="Recovered Items" value={s.recoveredItems} icon={PackageCheck} tone="success" />
      </div>
      <AdminCharts stats={s} />
    </div>
  );
}

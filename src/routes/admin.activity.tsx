import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeading } from "@/components/layout/PageShell";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listActivityLogs } from "@/services/activity";
import { formatDateTime } from "@/utils/format";

export const Route = createFileRoute("/admin/activity")({
  head: () => ({ meta: [{ title: "Activity Logs — LostLink Admin" }] }),
  component: ActivityLogs,
});

function ActivityLogs() {
  const { data: logs, isLoading } = useQuery({ queryKey: ["activity-logs"], queryFn: () => listActivityLogs(300) });
  const [q, setQ] = useState("");
  const rows = (logs ?? []).filter((l) => `${l.action} ${l.description} ${l.user?.full_name}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-6">
      <PageHeading title="Activity Logs" description="Audit trail of reports, claims and admin actions." />
      <Input placeholder="Filter logs" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
      {isLoading ? <Skeleton className="h-96 rounded-xl" /> : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <Table>
            <TableHeader><TableRow><TableHead>Time</TableHead><TableHead>User</TableHead><TableHead>Action</TableHead><TableHead>Description</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.length === 0 ? <TableRow><TableCell colSpan={4} className="py-10 text-center text-muted-foreground">No activity yet.</TableCell></TableRow> : rows.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="whitespace-nowrap text-xs">{formatDateTime(l.created_at)}</TableCell>
                  <TableCell>{l.user?.full_name ?? "System"}</TableCell>
                  <TableCell><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{l.action}</code></TableCell>
                  <TableCell className="text-sm">{l.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

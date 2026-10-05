import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Eye } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ClaimStatusBadge, ItemStatusBadge } from "@/components/common/StatusBadge";
import { PageHeading } from "@/components/layout/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { listMyClaims } from "@/services/claims";
import { listMyItems } from "@/services/items";
import { listUsers, setUserStatus, type ManagedUser } from "@/services/users";
import { formatDate } from "@/utils/format";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Manage Users — LostLink Admin" }] }),
  component: AdminUsers,
});

const roleLabel = (r: ManagedUser["roles"]) => (r.includes("super_admin") ? "Super Admin" : r.includes("admin") ? "Admin" : "Student");

function AdminUsers() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: users, isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: listUsers });
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [role, setRole] = useState("all");
  const [viewing, setViewing] = useState<ManagedUser | null>(null);

  const rows = useMemo(
    () =>
      (users ?? []).filter(
        (u) =>
          (status === "all" || u.status === status) &&
          (role === "all" || roleLabel(u.roles) === role) &&
          `${u.full_name} ${u.email} ${u.student_id ?? ""} ${u.department ?? ""}`.toLowerCase().includes(q.toLowerCase()),
      ),
    [users, q, status, role],
  );

  async function toggle(u: ManagedUser) {
    const next = u.status === "active" ? "inactive" : "active";
    try {
      await setUserStatus(u.id, next, user!.id);
      toast.success(`${u.full_name} ${next === "active" ? "activated" : "deactivated"}`);
      void qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeading title="User Management" description="View, activate or deactivate campus accounts." />
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input placeholder="Search name, email, ID, department" value={q} onChange={(e) => setQ(e.target.value)} className="sm:max-w-xs" />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent>
        </Select>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>{["all", "Student", "Admin", "Super Admin"].map((r) => <SelectItem key={r} value={r}>{r === "all" ? "All roles" : r}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {isLoading ? <Skeleton className="h-96 rounded-xl" /> : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Student ID</TableHead><TableHead>Department</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Joined</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.length === 0 ? <TableRow><TableCell colSpan={8} className="py-10 text-center text-muted-foreground">No users found.</TableCell></TableRow> : rows.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name}{u.is_demo ? <Badge variant="outline" className="ml-2 text-[10px]">Demo</Badge> : null}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.student_id ?? "—"}</TableCell>
                  <TableCell>{u.department ?? "—"}</TableCell>
                  <TableCell>{roleLabel(u.roles)}</TableCell>
                  <TableCell><Badge variant={u.status === "active" ? "secondary" : "destructive"} className="capitalize">{u.status}</Badge></TableCell>
                  <TableCell>{formatDate(u.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" aria-label="View user" onClick={() => setViewing(u)}><Eye className="h-4 w-4" /></Button>
                      {u.id !== user!.id && !u.roles.includes("super_admin") ? (
                        <Button size="sm" variant={u.status === "active" ? "outline" : "default"} onClick={() => toggle(u)}>{u.status === "active" ? "Deactivate" : "Activate"}</Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {viewing ? <UserDialog u={viewing} onClose={() => setViewing(null)} /> : null}
    </div>
  );
}

function UserDialog({ u, onClose }: { u: ManagedUser; onClose: () => void }) {
  const { data: items = [] } = useQuery({ queryKey: ["user-items", u.id], queryFn: () => listMyItems(u.id) });
  const { data: claims = [] } = useQuery({ queryKey: ["user-claims", u.id], queryFn: () => listMyClaims(u.id) });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{u.full_name}</DialogTitle></DialogHeader>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <p><span className="text-muted-foreground">Email:</span> {u.email}</p>
          <p><span className="text-muted-foreground">Phone:</span> {u.phone ?? "—"}</p>
          <p><span className="text-muted-foreground">Student ID:</span> {u.student_id ?? "—"}</p>
          <p><span className="text-muted-foreground">Department:</span> {u.department ?? "—"}</p>
          <p><span className="text-muted-foreground">Role:</span> {roleLabel(u.roles)}</p>
          <p><span className="text-muted-foreground">Joined:</span> {formatDate(u.created_at)}</p>
        </div>
        <h3 className="mt-2 font-semibold">Reports ({items.length})</h3>
        <ul className="divide-y divide-border rounded-lg border border-border text-sm">
          {items.length ? items.map((i) => <li key={i.id} className="flex justify-between p-2"><span>{i.item_name} <span className="text-muted-foreground">({i.item_type})</span></span><ItemStatusBadge status={i.status} /></li>) : <li className="p-2 text-muted-foreground">None</li>}
        </ul>
        <h3 className="mt-2 font-semibold">Claims ({claims.length})</h3>
        <ul className="divide-y divide-border rounded-lg border border-border text-sm">
          {claims.length ? claims.map((c) => <li key={c.id} className="flex justify-between p-2"><span>{c.item?.item_name}</span><ClaimStatusBadge status={c.status} /></li>) : <li className="p-2 text-muted-foreground">None</li>}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

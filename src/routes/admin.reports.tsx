import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Eye, Pencil, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ItemStatusBadge, ItemTypeBadge } from "@/components/common/StatusBadge";
import { PageHeading } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/services/activity";
import { approveItem, deleteItem, listAllItems, rejectItem } from "@/services/items";
import type { ItemWithRelations } from "@/types";
import { formatDate, shortId } from "@/utils/format";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({ meta: [{ title: "Manage Reports — LostLink Admin" }] }),
  component: AdminReports,
});

function AdminReports() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: items, isLoading } = useQuery({ queryKey: ["admin-items"], queryFn: listAllItems });
  const [status, setStatus] = useState("pending");
  const [q, setQ] = useState("");
  const [rejecting, setRejecting] = useState<ItemWithRelations | null>(null);
  const [editing, setEditing] = useState<ItemWithRelations | null>(null);
  const [deleting, setDeleting] = useState<ItemWithRelations | null>(null);
  const [reason, setReason] = useState("");

  const rows = useMemo(
    () =>
      (items ?? []).filter(
        (i) => (status === "all" || i.status === status) && `${i.item_name} ${i.location} ${i.reporter?.full_name}`.toLowerCase().includes(q.toLowerCase()),
      ),
    [items, status, q],
  );
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin-items"] });
    void qc.invalidateQueries({ queryKey: ["admin-stats"] });
  };
  async function run(fn: () => Promise<void>, ok: string) {
    try {
      await fn();
      toast.success(ok);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeading title="Report Management" description="Verify, approve or reject submitted reports." />
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input placeholder="Search item, location, user" value={q} onChange={(e) => setQ(e.target.value)} className="sm:max-w-xs" />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["all", "pending", "approved", "rejected", "recovered", "closed"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s === "all" ? "All statuses" : s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {isLoading ? <Skeleton className="h-96 rounded-xl" /> : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead><TableHead>Item</TableHead><TableHead>Type</TableHead><TableHead>Category</TableHead><TableHead>User</TableHead><TableHead>Date</TableHead><TableHead>Location</TableHead><TableHead>Status</TableHead><TableHead>Submitted</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="py-10 text-center text-muted-foreground">No reports found.</TableCell></TableRow>
              ) : rows.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-mono text-xs">#{shortId(i.id)}</TableCell>
                  <TableCell className="font-medium">{i.item_name}</TableCell>
                  <TableCell><ItemTypeBadge type={i.item_type} /></TableCell>
                  <TableCell>{i.category?.name ?? "—"}</TableCell>
                  <TableCell>{i.reporter?.full_name ?? "—"}</TableCell>
                  <TableCell>{formatDate(i.item_date)}</TableCell>
                  <TableCell className="max-w-[160px] truncate">{i.location}</TableCell>
                  <TableCell><ItemStatusBadge status={i.status} /></TableCell>
                  <TableCell>{formatDate(i.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button asChild size="icon" variant="ghost" aria-label="View"><Link to="/items/$itemId" params={{ itemId: i.id }}><Eye className="h-4 w-4" /></Link></Button>
                      {i.verification_status !== "approved" ? (
                        <Button size="icon" variant="ghost" aria-label="Approve" onClick={() => run(() => approveItem(i, user!.id), "Report approved")}><Check className="h-4 w-4 text-success" /></Button>
                      ) : null}
                      {i.verification_status !== "rejected" && i.status !== "recovered" ? (
                        <Button size="icon" variant="ghost" aria-label="Reject" onClick={() => { setReason(""); setRejecting(i); }}><X className="h-4 w-4 text-destructive" /></Button>
                      ) : null}
                      <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => setEditing(i)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => setDeleting(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!rejecting} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject "{rejecting?.item_name}"</DialogTitle></DialogHeader>
          <Label htmlFor="reason">Rejection reason (sent to the reporter)</Label>
          <Textarea id="reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>Cancel</Button>
            <Button variant="destructive" disabled={reason.trim().length < 5} onClick={() => { const it = rejecting!; setRejecting(null); void run(() => rejectItem(it, user!.id, reason.trim()), "Report rejected"); }}>Reject report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete "{deleting?.item_name}"?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This permanently removes the report and any claims on it.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { const it = deleting!; setDeleting(null); void run(async () => { await supabase.from("claims").delete().eq("item_id", it.id); await deleteItem(it.id); await logActivity(user!.id, "report_deleted", `Deleted report: ${it.item_name}`); }, "Report deleted"); }}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {editing ? <EditDialog item={editing} onClose={() => setEditing(null)} onSaved={refresh} /> : null}
    </div>
  );
}

function EditDialog({ item, onClose, onSaved }: { item: ItemWithRelations; onClose: () => void; onSaved: () => void }) {
  const { user } = useAuth();
  const [v, setV] = useState({ item_name: item.item_name, description: item.description, location: item.location, status: item.status });
  async function save() {
    if (v.item_name.trim().length < 2 || v.location.trim().length < 2) return void toast.error("Name and location are required");
    const { error } = await supabase.from("items").update({ item_name: v.item_name.trim(), description: v.description.trim(), location: v.location.trim(), status: v.status }).eq("id", item.id);
    if (error) return void toast.error(error.message);
    await logActivity(user!.id, "report_edited", `Edited report: ${v.item_name}`);
    toast.success("Report updated");
    onSaved();
    onClose();
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit report</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1"><Label>Item name</Label><Input value={v.item_name} onChange={(e) => setV({ ...v, item_name: e.target.value })} /></div>
          <div className="space-y-1"><Label>Description</Label><Textarea rows={3} value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} /></div>
          <div className="space-y-1"><Label>Location</Label><Input value={v.location} onChange={(e) => setV({ ...v, location: e.target.value })} /></div>
          <div className="space-y-1"><Label>Status</Label>
            <Select value={v.status} onValueChange={(s) => setV({ ...v, status: s as typeof v.status })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["pending", "approved", "rejected", "recovered", "closed"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={save}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

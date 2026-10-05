import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Eye } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ItemImage } from "@/components/common/ItemImage";
import { ClaimStatusBadge } from "@/components/common/StatusBadge";
import { PageHeading } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { addClaimRemarks, approveClaim, listAllClaims, rejectClaim, setClaimStatus } from "@/services/claims";
import { CLAIM_STATUS_LABEL, type ClaimStatus, type ClaimWithRelations } from "@/types";
import { formatDate, formatDateTime, shortId } from "@/utils/format";

export const Route = createFileRoute("/admin/claims")({
  head: () => ({ meta: [{ title: "Manage Claims — LostLink Admin" }] }),
  component: AdminClaims,
});

function AdminClaims() {
  const { data: claims, isLoading } = useQuery({ queryKey: ["admin-claims"], queryFn: listAllClaims });
  const [status, setStatus] = useState("all");
  const [open, setOpen] = useState<ClaimWithRelations | null>(null);
  const rows = useMemo(() => (claims ?? []).filter((c) => status === "all" || c.status === status), [claims, status]);

  return (
    <div className="space-y-6">
      <PageHeading title="Claim Management" description="Review claimant answers and approve or reject claims." />
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {Object.entries(CLAIM_STATUS_LABEL).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
        </SelectContent>
      </Select>
      {isLoading ? <Skeleton className="h-96 rounded-xl" /> : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <Table>
            <TableHeader><TableRow><TableHead>Claim ID</TableHead><TableHead>Item</TableHead><TableHead>Claimant</TableHead><TableHead>Submitted</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.length === 0 ? <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No claims found.</TableCell></TableRow> : rows.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs">#{shortId(c.id)}</TableCell>
                  <TableCell className="font-medium">{c.item?.item_name ?? "—"}</TableCell>
                  <TableCell>{c.claimant?.full_name ?? "—"}<p className="text-xs text-muted-foreground">{c.claimant?.student_id}</p></TableCell>
                  <TableCell>{formatDate(c.created_at)}</TableCell>
                  <TableCell><ClaimStatusBadge status={c.status} /></TableCell>
                  <TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => setOpen(c)}><Eye className="h-4 w-4" /> Review</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {open ? <ReviewDialog claim={open} onClose={() => setOpen(null)} /> : null}
    </div>
  );
}

function ReviewDialog({ claim, onClose }: { claim: ClaimWithRelations; onClose: () => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [remarks, setRemarks] = useState(claim.admin_remarks ?? "");
  const [busy, setBusy] = useState(false);
  const closed = claim.status === "approved" || claim.status === "rejected" || claim.status === "completed";

  async function act(fn: () => Promise<void>, ok: string) {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
      void qc.invalidateQueries({ queryKey: ["admin-claims"] });
      void qc.invalidateQueries({ queryKey: ["admin-stats"] });
      void qc.invalidateQueries({ queryKey: ["admin-items"] });
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  const row = (l: string, v: string | null | undefined) => (
    <div><dt className="text-xs text-muted-foreground">{l}</dt><dd className="text-sm">{v || "—"}</dd></div>
  );

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>Claim #{shortId(claim.id)}</DialogTitle></DialogHeader>
        <div className="flex gap-4 rounded-lg border border-border p-3">
          <ItemImage reference={claim.item?.image_url ?? null} alt="" className="h-20 w-28 rounded-md" />
          <div>
            <p className="font-medium">{claim.item?.item_name}</p>
            <p className="text-sm text-muted-foreground">Claimant: {claim.claimant?.full_name} · {claim.claimant?.email}</p>
            <p className="text-xs text-muted-foreground">{claim.claimant?.department} · ID {claim.claimant?.student_id ?? "—"}</p>
            <div className="mt-1"><ClaimStatusBadge status={claim.status} /></div>
          </div>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">{row("Why they believe it's theirs", claim.reason)}</div>
          <div className="sm:col-span-2">{row("Unique identifying feature", claim.proof_description)}</div>
          {row("Approx. date lost", claim.lost_date ? formatDate(claim.lost_date) : null)}
          {row("Where lost", claim.lost_location)}
          <div className="sm:col-span-2">{row("Additional proof", claim.additional_proof)}</div>
          {row("Submitted", formatDateTime(claim.created_at))}
          {row("Reviewed", claim.reviewed_at ? formatDateTime(claim.reviewed_at) : null)}
        </dl>
        <div className="space-y-1.5">
          <Label htmlFor="remarks">Admin remarks / rejection reason</Label>
          <Textarea id="remarks" rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Select disabled={busy} value={claim.status} onValueChange={(s) => act(() => setClaimStatus(claim, user!.id, s as ClaimStatus), "Status updated")}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["pending", "under_review", "completed"] as const).map((s) => <SelectItem key={s} value={s}>{CLAIM_STATUS_LABEL[s]}</SelectItem>)}
                {claim.status === "approved" || claim.status === "rejected" ? <SelectItem value={claim.status}>{CLAIM_STATUS_LABEL[claim.status]}</SelectItem> : null}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" disabled={busy || !remarks.trim()} onClick={() => act(() => addClaimRemarks(claim.id, remarks.trim()), "Remarks saved")}>Save remarks</Button>
          </div>
          {!closed ? (
            <div className="flex gap-2">
              <Button variant="destructive" disabled={busy || remarks.trim().length < 5} onClick={() => act(() => rejectClaim(claim, user!.id, remarks.trim()), "Claim rejected")}>Reject</Button>
              <Button disabled={busy} onClick={() => act(() => approveClaim(claim, user!.id, remarks.trim()), "Claim approved — item marked Recovered")}>Approve claim</Button>
            </div>
          ) : null}
        </div>
        {!closed ? <p className="text-xs text-muted-foreground">You need a reason (at least 5 characters) in the remarks box to reject a claim.</p> : null}
      </DialogContent>
    </Dialog>
  );
}

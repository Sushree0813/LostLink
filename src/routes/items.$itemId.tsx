import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Calendar, Clock, HandHelping, Loader2, MapPin, Tag, User } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { EmptyState } from "@/components/common/EmptyState";
import { ItemImage } from "@/components/common/ItemImage";
import { ClaimStatusBadge, ItemStatusBadge, ItemTypeBadge } from "@/components/common/StatusBadge";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { createClaim, listMyClaims } from "@/services/claims";
import { getItemById } from "@/services/items";
import type { ItemWithRelations } from "@/types";
import { formatDate, formatDateTime, formatTime } from "@/utils/format";

export const Route = createFileRoute("/items/$itemId")({
  head: () => ({
    meta: [
      { title: "Item Details — LostLink" },
      { name: "description", content: "View details of a lost or found item and submit a verified claim." },
      { property: "og:title", content: "Item Details — LostLink" },
      { property: "og:description", content: "Lost or found item on campus." },
    ],
  }),
  component: ItemDetailsPage,
});

function ItemDetailsPage() {
  const { itemId } = Route.useParams();
  const { user, isAuthenticated } = useAuth();
  const [claimOpen, setClaimOpen] = useState(false);
  const { data: item, isLoading } = useQuery({ queryKey: ["item", itemId, user?.id], queryFn: () => getItemById(itemId) });
  const { data: myClaims = [] } = useQuery({
    queryKey: ["my-claims", user?.id],
    queryFn: () => listMyClaims(user!.id),
    enabled: Boolean(user),
  });
  const existingClaim = myClaims.find((c) => c.item_id === itemId);

  if (isLoading)
    return (
      <PageShell>
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-2">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </PageShell>
    );
  if (!item)
    return (
      <PageShell>
        <div className="mx-auto max-w-xl px-4 py-16">
          <EmptyState title="Item not found" description="This item doesn't exist or isn't publicly visible yet." action={<Button asChild><Link to="/browse">Browse items</Link></Button>} />
        </div>
      </PageShell>
    );

  const isOwner = user?.id === item.user_id;
  const canClaim = item.item_type === "found" && item.status === "approved" && !isOwner && !existingClaim;
  const details: [typeof Tag, string, string | null][] = [
    [Tag, "Category", item.category?.name ?? "—"],
    [Calendar, item.item_type === "lost" ? "Date lost" : "Date found", formatDate(item.item_date)],
    [Clock, "Approx. time", item.item_time ? formatTime(item.item_time) : "—"],
    [MapPin, "Location", item.location],
    [User, "Reported by", item.reporter?.full_name ? `${item.reporter.full_name}${item.reporter.department ? ` · ${item.reporter.department}` : ""}` : "Campus member"],
  ];

  return (
    <PageShell>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Link to="/browse" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to browse
        </Link>
        <div className="grid gap-8 md:grid-cols-2">
          <div className="overflow-hidden rounded-xl border border-border bg-muted">
            <ItemImage reference={item.image_url} alt={item.item_name} className="h-[420px] w-full" />
          </div>
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <ItemTypeBadge type={item.item_type} />
              <ItemStatusBadge status={item.status} />
            </div>
            <h1 className="font-display text-3xl font-semibold">{item.item_name}</h1>
            <p className="text-muted-foreground">{item.description}</p>
            <dl className="grid gap-3 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
              {details.map(([Icon, label, value]) => (
                <div key={label} className="flex gap-3">
                  <Icon className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="text-sm font-medium">{value}</dd>
                  </div>
                </div>
              ))}
              <Detail label="Brand" value={item.brand} />
              <Detail label="Color" value={item.color} />
              <Detail label="Identifying features" value={item.identifying_features} wide />
              <Detail label="Additional info" value={item.additional_info} wide />
              <Detail label="Reported on" value={formatDateTime(item.created_at)} />
            </dl>
            {item.status === "rejected" && item.rejection_reason ? (
              <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">Rejected: {item.rejection_reason}</p>
            ) : null}
            {existingClaim ? (
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4 text-sm">
                <span>You already submitted a claim for this item.</span>
                <ClaimStatusBadge status={existingClaim.status} />
              </div>
            ) : null}
            {canClaim ? (
              isAuthenticated ? (
                <Button size="lg" className="w-full" onClick={() => setClaimOpen(true)}>
                  <HandHelping className="h-4 w-4" /> I Want to Claim This Item
                </Button>
              ) : (
                <Button asChild size="lg" className="w-full">
                  <Link to="/auth" search={{ mode: "login" } as never}>Log in to claim this item</Link>
                </Button>
              )
            ) : null}
            {item.item_type === "lost" && item.status === "approved" && !isOwner ? (
              <p className="rounded-lg bg-info/10 p-3 text-sm text-info">
                Found this item? Hand it to the admin desk and <Link to="/report/found" className="font-semibold underline">report it as found</Link>.
              </p>
            ) : null}
          </div>
        </div>
      </div>
      {user && claimOpen ? <ClaimDialog item={item} onClose={() => setClaimOpen(false)} /> : null}
    </PageShell>
  );
}

function Detail({ label, value, wide }: { label: string; value: string | null; wide?: boolean }) {
  if (!value) return null;
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

const claimSchema = z.object({
  reason: z.string().trim().min(20, "Explain in at least 20 characters").max(1000),
  proof_description: z.string().trim().min(10, "Describe a unique identifying feature").max(1000),
  lost_date: z.string(),
  lost_location: z.string().trim().max(150),
  additional_proof: z.string().trim().max(1000),
});

function ClaimDialog({ item, onClose }: { item: ItemWithRelations; onClose: () => void }) {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [v, setV] = useState({ reason: "", proof_description: "", lost_date: "", lost_location: "", additional_proof: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = claimSchema.safeParse(v);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const i of parsed.error.issues) next[String(i.path[0])] ??= i.message;
      setErrors(next);
      return;
    }
    setBusy(true);
    try {
      const d = parsed.data;
      await createClaim(user!.id, profile?.full_name ?? "A student", item.item_name, item.user_id, {
        item_id: item.id,
        reason: d.reason,
        proof_description: d.proof_description,
        lost_date: d.lost_date || null,
        lost_location: d.lost_location || null,
        additional_proof: d.additional_proof || null,
      });
      toast.success("Claim submitted. An admin will review it.");
      await queryClient.invalidateQueries({ queryKey: ["my-claims"] });
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit claim");
    } finally {
      setBusy(false);
    }
  }

  const f = (k: keyof typeof v, label: string, node: React.ReactNode) => (
    <div className="space-y-1.5">
      <Label htmlFor={k}>{label}</Label>
      {node}
      {errors[k] ? <p className="text-xs text-destructive">{errors[k]}</p> : null}
    </div>
  );
  const bind = (k: keyof typeof v) => ({ id: k, value: v[k], onChange: (e: { target: { value: string } }) => setV((s) => ({ ...s, [k]: e.target.value })) });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Claim "{item.item_name}"</DialogTitle>
          <DialogDescription>Answer honestly — an admin verifies every claim before handover.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4" noValidate>
          {f("reason", "Why do you believe this item belongs to you? *", <Textarea rows={3} {...bind("reason")} />)}
          {f("proof_description", "Describe a unique identifying feature *", <Textarea rows={2} {...bind("proof_description")} placeholder="Something only the owner would know" />)}
          <div className="grid gap-4 sm:grid-cols-2">
            {f("lost_date", "Approx. date lost", <Input type="date" {...bind("lost_date")} />)}
            {f("lost_location", "Where did you lose it?", <Input {...bind("lost_location")} />)}
          </div>
          {f("additional_proof", "Additional proof / details", <Textarea rows={2} {...bind("additional_proof")} placeholder="Receipt, serial number, photos you can show at the desk…" />)}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Submit claim</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

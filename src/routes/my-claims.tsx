import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { HandHelping } from "lucide-react";
import { RequireAuth } from "@/components/auth/Guards";
import { EmptyState } from "@/components/common/EmptyState";
import { ItemImage } from "@/components/common/ItemImage";
import { ClaimStatusBadge } from "@/components/common/StatusBadge";
import { PageHeading, PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { listMyClaims } from "@/services/claims";
import { formatDateTime, shortId } from "@/utils/format";

export const Route = createFileRoute("/my-claims")({
  head: () => ({
    meta: [
      { title: "My Claims — LostLink" },
      { name: "description", content: "Track the status and history of your item claims." },
      { property: "og:title", content: "My Claims — LostLink" },
      { property: "og:description", content: "Your claim history on LostLink." },
    ],
  }),
  component: () => (
    <PageShell>
      <RequireAuth>
        <MyClaims />
      </RequireAuth>
    </PageShell>
  ),
});

function MyClaims() {
  const { user } = useAuth();
  const { data: claims, isLoading } = useQuery({ queryKey: ["my-claims", user!.id], queryFn: () => listMyClaims(user!.id) });
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <PageHeading title="My Claims" description="Claims you've submitted for found items." />
      {isLoading ? <Skeleton className="h-64 rounded-xl" /> : !claims?.length ? (
        <EmptyState icon={HandHelping} title="No claims yet" description="Find your item in Browse and submit a claim." action={<Button asChild><Link to="/browse">Browse items</Link></Button>} />
      ) : (
        <div className="space-y-3">
          {claims.map((c) => (
            <div key={c.id} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row">
              <ItemImage reference={c.item?.image_url ?? null} alt={c.item?.item_name ?? "Item"} className="h-20 w-28 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{c.item?.item_name ?? "Item"}</p>
                  <ClaimStatusBadge status={c.status} />
                </div>
                <p className="text-xs text-muted-foreground">Claim #{shortId(c.id)} · submitted {formatDateTime(c.created_at)}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{c.reason}</p>
                {c.admin_remarks ? <p className="rounded-md bg-muted p-2 text-xs"><strong>Admin remarks:</strong> {c.admin_remarks}</p> : null}
                {c.status === "approved" ? <p className="text-xs font-medium text-success">Approved — please collect your item from the admin desk with your student ID.</p> : null}
              </div>
              {c.item ? <Button asChild variant="outline" size="sm" className="self-start"><Link to="/items/$itemId" params={{ itemId: c.item.id }}>View item</Link></Button> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

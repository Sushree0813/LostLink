import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { RequireAuth } from "@/components/auth/Guards";
import { EmptyState } from "@/components/common/EmptyState";
import { ItemImage } from "@/components/common/ItemImage";
import { ItemStatusBadge, ItemTypeBadge } from "@/components/common/StatusBadge";
import { PageHeading, PageShell } from "@/components/layout/PageShell";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { deleteItem, listMyItems } from "@/services/items";
import { formatDate } from "@/utils/format";

export const Route = createFileRoute("/my-reports")({
  head: () => ({
    meta: [
      { title: "My Reports — LostLink" },
      { name: "description", content: "Track the status of your lost and found reports." },
      { property: "og:title", content: "My Reports — LostLink" },
      { property: "og:description", content: "Your lost and found reports." },
    ],
  }),
  component: () => (
    <PageShell>
      <RequireAuth>
        <MyReports />
      </RequireAuth>
    </PageShell>
  ),
});

function MyReports() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: items, isLoading } = useQuery({ queryKey: ["my-items", user!.id], queryFn: () => listMyItems(user!.id) });

  async function remove(id: string) {
    try {
      await deleteItem(id);
      toast.success("Report deleted");
      void qc.invalidateQueries({ queryKey: ["my-items"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <PageHeading title="My Reports" description="All items you've reported and their verification status." action={<Button asChild><Link to="/report/lost">New report</Link></Button>} />
      {isLoading ? <Skeleton className="h-64 rounded-xl" /> : !items?.length ? (
        <EmptyState icon={ClipboardList} title="No reports yet" description="Items you report will appear here." action={<Button asChild><Link to="/report/found">Report an item</Link></Button>} />
      ) : (
        <div className="space-y-3">
          {items.map((i) => (
            <div key={i.id} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
              <ItemImage reference={i.image_url} alt={i.item_name} className="h-20 w-28 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap gap-2"><ItemTypeBadge type={i.item_type} /><ItemStatusBadge status={i.status} /></div>
                <p className="font-medium">{i.item_name}</p>
                <p className="text-xs text-muted-foreground">{i.category?.name} · {i.location} · {formatDate(i.item_date)}</p>
                {i.rejection_reason ? <p className="text-xs text-destructive">Rejection reason: {i.rejection_reason}</p> : null}
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm"><Link to="/items/$itemId" params={{ itemId: i.id }}>View</Link></Button>
                {i.status !== "recovered" ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="ghost" size="sm" aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Delete this report?</AlertDialogTitle><AlertDialogDescription>This can't be undone.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => remove(i.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

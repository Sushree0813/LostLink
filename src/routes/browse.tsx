import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Search, SearchX } from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/common/EmptyState";
import { ItemCard } from "@/components/items/ItemCard";
import { PageHeading, PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { listCategories } from "@/services/catalog";
import { listPublicItems, type ItemFilters } from "@/services/items";

export const Route = createFileRoute("/browse")({
  head: () => ({
    meta: [
      { title: "Browse Lost & Found Items — LostLink" },
      { name: "description", content: "Search verified lost and found items reported across campus." },
      { property: "og:title", content: "Browse Lost & Found Items — LostLink" },
      { property: "og:description", content: "Search verified lost and found items on campus." },
    ],
  }),
  component: BrowsePage,
});

const PAGE_SIZE = 9;

function BrowsePage() {
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState<ItemFilters>({ type: "all", categoryId: "all", status: "all", sort: "newest", page: 1 });

  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => ({ ...f, search: searchInput, page: 1 })), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: listCategories });
  const { data, isLoading } = useQuery({
    queryKey: ["public-items", filters],
    queryFn: () => listPublicItems({ ...filters, pageSize: PAGE_SIZE }),
    placeholderData: keepPreviousData,
  });
  const update = (patch: Partial<ItemFilters>) => setFilters((f) => ({ ...f, ...patch, page: 1 }));
  const page = filters.page ?? 1;
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

  return (
    <PageShell>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-10">
        <PageHeading title="Browse Items" description="Only admin-verified reports are listed here." />
        <div className="grid gap-3 rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)] md:grid-cols-6">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search name, description, brand, location" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          </div>
          <Select value={filters.type ?? "all"} onValueChange={(v) => update({ type: v as ItemFilters["type"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Lost & Found</SelectItem>
              <SelectItem value="lost">Lost only</SelectItem>
              <SelectItem value="found">Found only</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.categoryId ?? "all"} onValueChange={(v) => update({ categoryId: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.status ?? "all"} onValueChange={(v) => update({ status: v as ItemFilters["status"] })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any status</SelectItem>
              <SelectItem value="approved">Open</SelectItem>
              <SelectItem value="recovered">Recovered</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.sort ?? "newest"} onValueChange={(v) => update({ sort: v as "newest" | "oldest" })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
            </SelectContent>
          </Select>
          <Input className="md:col-span-2" placeholder="Filter by location" onChange={(e) => update({ location: e.target.value })} />
          <div className="flex items-center gap-2 md:col-span-2">
            <span className="whitespace-nowrap text-xs text-muted-foreground">From date</span>
            <Input type="date" onChange={(e) => update({ dateFrom: e.target.value || undefined })} />
          </div>
          <p className="self-center text-sm text-muted-foreground md:col-span-2 md:text-right">{data?.total ?? 0} results</p>
        </div>

        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-xl" />)}
          </div>
        ) : data && data.items.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((item) => <ItemCard key={item.id} item={item} />)}
          </div>
        ) : (
          <EmptyState icon={SearchX} title="No items match your search" description="Try different keywords or clear some filters." />
        )}

        {totalPages > 1 ? (
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setFilters((f) => ({ ...f, page: page - 1 }))}>
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setFilters((f) => ({ ...f, page: page + 1 }))}>
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </div>
    </PageShell>
  );
}

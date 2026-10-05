import { Link } from "@tanstack/react-router";
import { CalendarDays, MapPin, Tag } from "lucide-react";

import { ItemImage } from "@/components/common/ItemImage";
import { ItemStatusBadge, ItemTypeBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/format";
import type { ItemWithRelations } from "@/types";

export function ItemCard({ item }: { item: ItemWithRelations }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
      <div className="relative h-44 w-full overflow-hidden bg-muted">
        <ItemImage
          reference={item.image_url}
          alt={item.item_name}
          className="h-44 w-full transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute left-3 top-3 flex gap-2">
          <ItemTypeBadge type={item.item_type} />
        </div>
        <div className="absolute right-3 top-3">
          <ItemStatusBadge status={item.status} className="bg-card/90 backdrop-blur" />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 text-base font-semibold text-foreground">{item.item_name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>

        <dl className="mt-3 space-y-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.category?.name ?? "Uncategorised"}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0" />
            <span>{formatDate(item.item_date)}</span>
          </div>
        </dl>

        <Button asChild className="mt-4 w-full" variant="secondary">
          <Link to="/items/$itemId" params={{ itemId: item.id }}>
            View Details
          </Link>
        </Button>
      </div>
    </article>
  );
}

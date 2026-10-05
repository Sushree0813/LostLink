import { CheckCircle2, Clock, PackageCheck, Search, ShieldCheck, XCircle } from "lucide-react";
import type { ComponentType } from "react";

import { cn } from "@/lib/utils";
import {
  CLAIM_STATUS_LABEL,
  ITEM_STATUS_LABEL,
  type ClaimStatus,
  type ItemStatus,
  type ItemType,
} from "@/types";

const base =
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-tight";

const itemStatusStyles: Record<ItemStatus, string> = {
  pending: "bg-warning/15 text-warning-foreground",
  approved: "bg-info/15 text-info",
  rejected: "bg-destructive/12 text-destructive",
  recovered: "bg-success/15 text-success",
  closed: "bg-muted text-muted-foreground",
};

const itemStatusIcons: Record<ItemStatus, ComponentType<{ className?: string }>> = {
  pending: Clock,
  approved: ShieldCheck,
  rejected: XCircle,
  recovered: PackageCheck,
  closed: CheckCircle2,
};

const claimStatusStyles: Record<ClaimStatus, string> = {
  pending: "bg-warning/15 text-warning-foreground",
  under_review: "bg-info/15 text-info",
  approved: "bg-success/15 text-success",
  rejected: "bg-destructive/12 text-destructive",
  completed: "bg-primary/12 text-primary",
};

const claimStatusIcons: Record<ClaimStatus, ComponentType<{ className?: string }>> = {
  pending: Clock,
  under_review: Search,
  approved: CheckCircle2,
  rejected: XCircle,
  completed: PackageCheck,
};

export function ItemStatusBadge({ status, className }: { status: ItemStatus; className?: string }) {
  const Icon = itemStatusIcons[status];
  return (
    <span className={cn(base, itemStatusStyles[status], className)}>
      <Icon className="h-3.5 w-3.5" />
      {ITEM_STATUS_LABEL[status]}
    </span>
  );
}

export function ClaimStatusBadge({ status, className }: { status: ClaimStatus; className?: string }) {
  const Icon = claimStatusIcons[status];
  return (
    <span className={cn(base, claimStatusStyles[status], className)}>
      <Icon className="h-3.5 w-3.5" />
      {CLAIM_STATUS_LABEL[status]}
    </span>
  );
}

export function ItemTypeBadge({ type, className }: { type: ItemType; className?: string }) {
  return (
    <span
      className={cn(
        base,
        "uppercase",
        type === "lost" ? "bg-lost text-lost-foreground" : "bg-found text-found-foreground",
        className,
      )}
    >
      {type}
    </span>
  );
}

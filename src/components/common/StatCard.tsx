import type { ComponentType } from "react";

import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  hint,
}: {
  label: string;
  value: number | string;
  icon: ComponentType<{ className?: string }>;
  tone?: "primary" | "lost" | "found" | "success" | "warning" | "info";
  hint?: string;
}) {
  const tones: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    lost: "bg-lost/12 text-lost",
    found: "bg-found/12 text-found",
    success: "bg-success/12 text-success",
    warning: "bg-warning/18 text-warning-foreground",
    info: "bg-info/12 text-info",
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-lift)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-3xl font-semibold text-foreground">{value}</p>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <span className={cn("flex h-10 w-10 items-center justify-center rounded-lg", tones[tone])}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

import { Link } from "@tanstack/react-router";
import { Radar } from "lucide-react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Radar className="h-5 w-5" />
      </span>
      {!compact ? (
        <span className="leading-tight">
          <span className="block font-display text-lg font-semibold tracking-tight text-foreground">
            LostLink
          </span>
          <span className="block text-[11px] font-medium text-muted-foreground">
            Report. Search. Claim. Recover.
          </span>
        </span>
      ) : null}
    </Link>
  );
}

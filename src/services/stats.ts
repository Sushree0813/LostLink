import { supabase } from "@/integrations/supabase/client";
import type { ItemWithRelations } from "@/types";

export interface PublicStats {
  total_reports: number;
  lost_items: number;
  found_items: number;
  recovered_items: number;
  active_users: number;
}

export async function getPublicStats(): Promise<PublicStats> {
  const { data, error } = await supabase.rpc("get_public_stats");
  if (error) throw error;
  return data as unknown as PublicStats;
}

export interface AdminStats {
  totalUsers: number;
  totalLost: number;
  totalFound: number;
  pendingReports: number;
  approvedReports: number;
  rejectedReports: number;
  pendingClaims: number;
  approvedClaims: number;
  rejectedClaims: number;
  recoveredItems: number;
  byCategory: { name: string; count: number }[];
  byMonth: { month: string; lost: number; found: number; recovered: number }[];
}

export async function getAdminStats(): Promise<AdminStats> {
  const [usersResult, itemsResult, claimsResult] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("items").select("*, category:categories(name)"),
    supabase.from("claims").select("status"),
  ]);
  if (itemsResult.error) throw itemsResult.error;
  if (claimsResult.error) throw claimsResult.error;

  const items = (itemsResult.data ?? []) as unknown as ItemWithRelations[];
  const claims = claimsResult.data ?? [];

  const categoryCounts = new Map<string, number>();
  for (const item of items) {
    const name = item.category?.name ?? "Uncategorised";
    categoryCounts.set(name, (categoryCounts.get(name) ?? 0) + 1);
  }

  const monthMap = new Map<string, { lost: number; found: number; recovered: number }>();
  for (const item of items) {
    const date = new Date(item.created_at);
    const key = date.toLocaleString("en-US", { month: "short", year: "2-digit" });
    const bucket = monthMap.get(key) ?? { lost: 0, found: 0, recovered: 0 };
    if (item.item_type === "lost") bucket.lost += 1;
    else bucket.found += 1;
    if (item.status === "recovered") bucket.recovered += 1;
    monthMap.set(key, bucket);
  }

  return {
    totalUsers: usersResult.count ?? 0,
    totalLost: items.filter((i) => i.item_type === "lost").length,
    totalFound: items.filter((i) => i.item_type === "found").length,
    pendingReports: items.filter((i) => i.verification_status === "pending").length,
    approvedReports: items.filter((i) => i.verification_status === "approved").length,
    rejectedReports: items.filter((i) => i.verification_status === "rejected").length,
    pendingClaims: claims.filter((c) => c.status === "pending" || c.status === "under_review").length,
    approvedClaims: claims.filter((c) => c.status === "approved" || c.status === "completed").length,
    rejectedClaims: claims.filter((c) => c.status === "rejected").length,
    recoveredItems: items.filter((i) => i.status === "recovered").length,
    byCategory: [...categoryCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    byMonth: [...monthMap.entries()]
      .map(([month, value]) => ({ month, ...value }))
      .slice(-6),
  };
}

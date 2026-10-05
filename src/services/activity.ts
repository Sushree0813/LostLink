import { supabase } from "@/integrations/supabase/client";
import type { ActivityLogRow, Profile } from "@/types";

export type ActivityLogWithUser = ActivityLogRow & {
  user: Pick<Profile, "id" | "full_name" | "email"> | null;
};

export async function logActivity(userId: string, action: string, description: string) {
  const { error } = await supabase
    .from("activity_logs")
    .insert({ user_id: userId, action, description });
  if (error) console.error("Failed to write activity log", error);
}

export async function listActivityLogs(limit = 100): Promise<ActivityLogWithUser[]> {
  const { data, error } = await supabase
    .from("activity_logs")
    .select("*, user:profiles(id, full_name, email)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as unknown as ActivityLogWithUser[];
}

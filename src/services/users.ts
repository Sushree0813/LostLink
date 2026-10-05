import { supabase } from "@/integrations/supabase/client";
import type { AccountStatus, AppRole, Profile } from "@/types";
import { logActivity } from "@/services/activity";

export type ManagedUser = Profile & { roles: AppRole[] };

export async function listUsers(): Promise<ManagedUser[]> {
  const [profilesResult, rolesResult] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("user_roles").select("user_id, role"),
  ]);
  if (profilesResult.error) throw profilesResult.error;
  if (rolesResult.error) throw rolesResult.error;

  const roleMap = new Map<string, AppRole[]>();
  for (const row of rolesResult.data ?? []) {
    roleMap.set(row.user_id, [...(roleMap.get(row.user_id) ?? []), row.role]);
  }
  return (profilesResult.data ?? []).map((profile) => ({
    ...profile,
    roles: roleMap.get(profile.id) ?? ["user"],
  }));
}

export async function setUserStatus(userId: string, status: AccountStatus, adminId: string) {
  const { error } = await supabase.from("profiles").update({ status }).eq("id", userId);
  if (error) throw error;
  await logActivity(adminId, "user_status_changed", `User ${userId} set to ${status}`);
}

export async function updateOwnProfile(
  userId: string,
  values: {
    full_name: string;
    phone: string | null;
    department: string | null;
    student_id: string | null;
    profile_image?: string | null;
  },
) {
  const { error } = await supabase.from("profiles").update(values).eq("id", userId);
  if (error) throw error;
}

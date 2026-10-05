import { supabase } from "@/integrations/supabase/client";
import type { NotificationRow } from "@/types";

export interface NewNotification {
  userId: string;
  title: string;
  message: string;
  type: string;
  link?: string;
}

export async function createNotification(input: NewNotification) {
  const { error } = await supabase.from("notifications").insert({
    user_id: input.userId,
    title: input.title,
    message: input.message,
    type: input.type,
    link: input.link ?? null,
  });
  // Notifications must never block the primary operation.
  if (error) console.error("Failed to create notification", error);
}

export async function listNotifications(userId: string): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  if (error) throw error;
}

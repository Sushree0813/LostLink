import { supabase } from "@/integrations/supabase/client";
import type { ItemStatus, ItemType, ItemWithRelations } from "@/types";
import { logActivity } from "@/services/activity";
import { createNotification } from "@/services/notifications";

const ITEM_SELECT = `
  *,
  category:categories(id, name),
  reporter:profiles!items_user_id_fkey(id, full_name, department, email)
`;

export interface ItemFilters {
  search?: string | undefined;
  type?: ItemType | "all" | undefined;
  categoryId?: string | "all" | undefined;
  location?: string | undefined;
  status?: ItemStatus | "all" | undefined;
  dateFrom?: string | undefined;
  sort?: "newest" | "oldest" | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
}

export interface NewItemInput {
  item_type: ItemType;
  item_name: string;
  category_id: string;
  description: string;
  brand: string | null;
  color: string | null;
  identifying_features: string | null;
  item_date: string;
  item_time: string | null;
  location: string;
  image_url: string | null;
  additional_info: string | null;
}

/** Public discovery listing - only admin-approved reports are visible. */
export async function listPublicItems(filters: ItemFilters) {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 9;
  const from = (page - 1) * pageSize;

  let query = supabase
    .from("items")
    .select(ITEM_SELECT, { count: "exact" })
    .eq("verification_status", "approved");

  if (filters.search && filters.search.trim().length > 0) {
    const term = filters.search.trim().replace(/[%,()]/g, " ");
    query = query.or(
      `item_name.ilike.%${term}%,description.ilike.%${term}%,brand.ilike.%${term}%,location.ilike.%${term}%`,
    );
  }
  if (filters.type && filters.type !== "all") query = query.eq("item_type", filters.type);
  if (filters.categoryId && filters.categoryId !== "all")
    query = query.eq("category_id", filters.categoryId);
  if (filters.location && filters.location.trim())
    query = query.ilike("location", `%${filters.location.trim()}%`);
  if (filters.status && filters.status !== "all") query = query.eq("status", filters.status);
  if (filters.dateFrom) query = query.gte("item_date", filters.dateFrom);

  query = query
    .order("created_at", { ascending: filters.sort === "oldest" })
    .range(from, from + pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { items: (data ?? []) as unknown as ItemWithRelations[], total: count ?? 0 };
}

export async function getItemById(id: string): Promise<ItemWithRelations | null> {
  const { data, error } = await supabase.from("items").select(ITEM_SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as unknown as ItemWithRelations) ?? null;
}

export async function listMyItems(userId: string): Promise<ItemWithRelations[]> {
  const { data, error } = await supabase
    .from("items")
    .select(ITEM_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ItemWithRelations[];
}

export async function createItem(userId: string, input: NewItemInput) {
  const { data, error } = await supabase
    .from("items")
    .insert({ ...input, user_id: userId, status: "pending", verification_status: "pending" })
    .select("id, item_name, item_type")
    .single();
  if (error) throw error;

  await logActivity(
    userId,
    "report_created",
    `Reported a ${input.item_type} item: ${input.item_name}`,
  );
  await createNotification({
    userId,
    title: "Report submitted",
    message: `Your report "${input.item_name}" was submitted and is pending admin verification.`,
    type: "report_submitted",
    link: "/my-reports",
  });
  return data;
}

export async function deleteItem(id: string) {
  const { error } = await supabase.from("items").delete().eq("id", id);
  if (error) throw error;
}

/* ---------------- Admin operations ---------------- */

export async function listAllItems(): Promise<ItemWithRelations[]> {
  const { data, error } = await supabase
    .from("items")
    .select(ITEM_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ItemWithRelations[];
}

export async function approveItem(item: ItemWithRelations, adminId: string) {
  const { error } = await supabase
    .from("items")
    .update({ verification_status: "approved", status: "approved", rejection_reason: null })
    .eq("id", item.id);
  if (error) throw error;

  await createNotification({
    userId: item.user_id,
    title: "Report approved",
    message: `Your report "${item.item_name}" has been verified and is now visible in the public listing.`,
    type: "report_approved",
    link: `/items/${item.id}`,
  });
  await logActivity(adminId, "report_approved", `Approved report: ${item.item_name}`);
}

export async function rejectItem(item: ItemWithRelations, adminId: string, reason: string) {
  const { error } = await supabase
    .from("items")
    .update({ verification_status: "rejected", status: "rejected", rejection_reason: reason })
    .eq("id", item.id);
  if (error) throw error;

  await createNotification({
    userId: item.user_id,
    title: "Report rejected",
    message: `Your report "${item.item_name}" was rejected. Reason: ${reason}`,
    type: "report_rejected",
    link: "/my-reports",
  });
  await logActivity(adminId, "report_rejected", `Rejected report: ${item.item_name} (${reason})`);
}

export async function updateItemStatus(itemId: string, status: ItemStatus) {
  const { error } = await supabase.from("items").update({ status }).eq("id", itemId);
  if (error) throw error;
}

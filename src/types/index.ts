import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type ItemType = Database["public"]["Enums"]["item_type"];
export type ItemStatus = Database["public"]["Enums"]["item_status"];
export type VerificationStatus = Database["public"]["Enums"]["verification_status"];
export type ClaimStatus = Database["public"]["Enums"]["claim_status"];
export type AccountStatus = Database["public"]["Enums"]["account_status"];

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type ItemRow = Database["public"]["Tables"]["items"]["Row"];
export type ClaimRow = Database["public"]["Tables"]["claims"]["Row"];
export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
export type ActivityLogRow = Database["public"]["Tables"]["activity_logs"]["Row"];

export type ItemWithRelations = ItemRow & {
  category: Pick<Category, "id" | "name"> | null;
  reporter: Pick<Profile, "id" | "full_name" | "department" | "email"> | null;
};

export type ClaimWithRelations = ClaimRow & {
  item: Pick<ItemRow, "id" | "item_name" | "item_type" | "image_url" | "status" | "user_id"> | null;
  claimant: Pick<Profile, "id" | "full_name" | "email" | "student_id" | "department"> | null;
};

export const ITEM_STATUS_LABEL: Record<ItemStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  recovered: "Recovered",
  closed: "Closed",
};

export const CLAIM_STATUS_LABEL: Record<ClaimStatus, string> = {
  pending: "Pending",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
};

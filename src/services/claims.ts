import { supabase } from "@/integrations/supabase/client";
import type { ClaimStatus, ClaimWithRelations } from "@/types";
import { logActivity } from "@/services/activity";
import { createNotification } from "@/services/notifications";

const CLAIM_SELECT = `
  *,
  item:items(id, item_name, item_type, image_url, status, user_id),
  claimant:profiles!claims_claimant_id_fkey(id, full_name, email, student_id, department)
`;

export interface NewClaimInput {
  item_id: string;
  reason: string;
  proof_description: string;
  lost_date: string | null;
  lost_location: string | null;
  additional_proof: string | null;
}

export async function createClaim(
  claimantId: string,
  claimantName: string,
  itemName: string,
  itemOwnerId: string,
  input: NewClaimInput,
) {
  const { data, error } = await supabase
    .from("claims")
    .insert({ ...input, claimant_id: claimantId, status: "pending" })
    .select("id")
    .single();
  if (error) throw error;

  await createNotification({
    userId: claimantId,
    title: "Claim submitted",
    message: `Your claim for "${itemName}" has been submitted and is awaiting admin review.`,
    type: "claim_submitted",
    link: "/my-claims",
  });
  if (itemOwnerId !== claimantId) {
    await createNotification({
      userId: itemOwnerId,
      title: "Someone claimed your report",
      message: `${claimantName} submitted a claim for "${itemName}". An admin will verify it.`,
      type: "claim_submitted",
      link: `/items/${input.item_id}`,
    });
  }
  await logActivity(claimantId, "claim_created", `Submitted a claim for ${itemName}`);
  return data;
}

export async function listMyClaims(userId: string): Promise<ClaimWithRelations[]> {
  const { data, error } = await supabase
    .from("claims")
    .select(CLAIM_SELECT)
    .eq("claimant_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ClaimWithRelations[];
}

export async function listClaimsForItem(itemId: string): Promise<ClaimWithRelations[]> {
  const { data, error } = await supabase
    .from("claims")
    .select(CLAIM_SELECT)
    .eq("item_id", itemId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ClaimWithRelations[];
}

export async function listAllClaims(): Promise<ClaimWithRelations[]> {
  const { data, error } = await supabase
    .from("claims")
    .select(CLAIM_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ClaimWithRelations[];
}

export async function setClaimStatus(claim: ClaimWithRelations, adminId: string, status: ClaimStatus) {
  const { error } = await supabase
    .from("claims")
    .update({ status, reviewed_by: adminId, reviewed_at: new Date().toISOString() })
    .eq("id", claim.id);
  if (error) throw error;
  await logActivity(adminId, "claim_status_changed", `Claim ${claim.id} set to ${status}`);
}

export async function addClaimRemarks(claimId: string, remarks: string) {
  const { error } = await supabase.from("claims").update({ admin_remarks: remarks }).eq("id", claimId);
  if (error) throw error;
}

/** Approving a claim also marks the item as recovered and notifies both parties. */
export async function approveClaim(claim: ClaimWithRelations, adminId: string, remarks: string) {
  const { error } = await supabase
    .from("claims")
    .update({
      status: "approved",
      admin_remarks: remarks || null,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", claim.id);
  if (error) throw error;

  if (claim.item) {
    const { error: itemError } = await supabase
      .from("items")
      .update({ status: "recovered" })
      .eq("id", claim.item.id);
    if (itemError) throw itemError;
  }

  const itemName = claim.item?.item_name ?? "the item";
  await createNotification({
    userId: claim.claimant_id,
    title: "Claim approved",
    message: `Your claim for "${itemName}" was approved. Please collect the item from the admin desk.`,
    type: "claim_approved",
    link: "/my-claims",
  });
  if (claim.item && claim.item.user_id !== claim.claimant_id) {
    await createNotification({
      userId: claim.item.user_id,
      title: "Item recovered",
      message: `"${itemName}" you reported has been matched with its owner and marked as recovered.`,
      type: "item_recovered",
      link: `/items/${claim.item.id}`,
    });
  }
  await logActivity(adminId, "claim_approved", `Approved claim for ${itemName}; item marked recovered`);
}

export async function rejectClaim(claim: ClaimWithRelations, adminId: string, reason: string) {
  const { error } = await supabase
    .from("claims")
    .update({
      status: "rejected",
      admin_remarks: reason,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", claim.id);
  if (error) throw error;

  const itemName = claim.item?.item_name ?? "the item";
  await createNotification({
    userId: claim.claimant_id,
    title: "Claim rejected",
    message: `Your claim for "${itemName}" was rejected. Reason: ${reason}`,
    type: "claim_rejected",
    link: "/my-claims",
  });
  await logActivity(adminId, "claim_rejected", `Rejected claim for ${itemName} (${reason})`);
}

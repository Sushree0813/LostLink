import { supabase } from "@/integrations/supabase/client";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

export function validateImageFile(file: File): string | null {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_IMAGE_TYPES.includes(file.type) || !ALLOWED_EXTENSIONS.includes(extension)) {
    return "Only JPG, JPEG, PNG or WebP images are allowed.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "Image must be 5 MB or smaller.";
  }
  if (file.size === 0) {
    return "The selected file is empty.";
  }
  return null;
}

/** Builds a safe, collision-free storage path scoped to the uploading user. */
function buildSafePath(userId: string, file: File): string {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const safeExtension = ALLOWED_EXTENSIONS.includes(extension) ? extension : "jpg";
  const random = crypto.randomUUID();
  return `${userId}/${Date.now()}-${random}.${safeExtension}`;
}

/** Uploads to a private bucket and returns the stored object path. */
export async function uploadImage(
  bucket: "item-images" | "avatars",
  userId: string,
  file: File,
): Promise<string> {
  const validationError = validateImageFile(file);
  if (validationError) throw new Error(validationError);

  const path = buildSafePath(userId, file);
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  return `${bucket}/${path}`;
}

const signedUrlCache = new Map<string, string>();

/**
 * Resolves a stored reference to a displayable URL.
 * Seed/demo rows store absolute URLs; user uploads store "bucket/path" in a
 * private bucket and are resolved through a signed URL.
 */
export async function resolveImageUrl(reference: string | null): Promise<string | null> {
  if (!reference) return null;
  if (reference.startsWith("http://") || reference.startsWith("https://")) return reference;

  const cached = signedUrlCache.get(reference);
  if (cached) return cached;

  const [bucket, ...rest] = reference.split("/");
  if (!bucket || rest.length === 0) return null;
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(rest.join("/"), 60 * 60);
  if (error || !data) return null;
  signedUrlCache.set(reference, data.signedUrl);
  return data.signedUrl;
}

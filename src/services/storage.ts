
import { supabase } from "@/integrations/supabase/client";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

export function validateImageFile(file: File): string | null {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";

  if (
    !ALLOWED_IMAGE_TYPES.includes(file.type) ||
    !ALLOWED_EXTENSIONS.includes(extension)
  ) {
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

/** Builds a safe, unique storage path scoped to the uploading user. */
function buildSafePath(userId: string, file: File): string {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const safeExtension = ALLOWED_EXTENSIONS.includes(extension)
    ? extension
    : "jpg";

  const random = crypto.randomUUID();

  return `${userId}/${Date.now()}-${random}.${safeExtension}`;
}

/** Uploads an image and returns its stored reference. */
export async function uploadImage(
  bucket: "item-images" | "avatars",
  userId: string,
  file: File,
): Promise<string> {
  const validationError = validateImageFile(file);

  if (validationError) {
    throw new Error(validationError);
  }

  const path = buildSafePath(userId, file);

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    throw error;
  }

  return `${bucket}/${path}`;
}

const signedUrlCache = new Map<string, string>();

/**
 * Converts a stored image reference into a displayable URL.
 * Item images use public URLs; other bucket images use signed URLs.
 */
export async function resolveImageUrl(
  reference: string | null,
): Promise<string | null> {
  if (!reference) {
    return null;
  }

  // Support existing records that already contain full URLs.
  if (
    reference.startsWith("http://") ||
    reference.startsWith("https://")
  ) {
    return reference;
  }

  // Stored references have the format "bucket/path/to/image.png".
  const [bucket, ...rest] = reference.split("/");

  if (!bucket || rest.length === 0) {
    return null;
  }

  const path = rest.join("/");

  // The item-images bucket is configured as public.
  if (bucket === "item-images") {
    const { data } = supabase.storage
      .from("item-images")
      .getPublicUrl(path);

    return data.publicUrl;
  }

  // Keep signed URLs for other buckets, such as avatars.
  const cached = signedUrlCache.get(reference);

  if (cached) {
    return cached;
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60);

  if (error || !data) {
    console.error("Could not resolve image URL:", error);
    return null;
  }

  signedUrlCache.set(reference, data.signedUrl);

  return data.signedUrl;
}

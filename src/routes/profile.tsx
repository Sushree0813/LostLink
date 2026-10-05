import { createFileRoute } from "@tanstack/react-router";
import { Camera, Loader2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { RequireAuth } from "@/components/auth/Guards";
import { ItemImage } from "@/components/common/ItemImage";
import { PageHeading, PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { uploadImage, validateImageFile } from "@/services/storage";
import { updateOwnProfile } from "@/services/users";
import { formatDate } from "@/utils/format";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — LostLink" },
      { name: "description", content: "Manage your LostLink account details." },
      { property: "og:title", content: "My Profile — LostLink" },
      { property: "og:description", content: "Your LostLink profile." },
    ],
  }),
  component: () => (
    <PageShell>
      <RequireAuth>
        <ProfilePage />
      </RequireAuth>
    </PageShell>
  ),
});

const schema = z.object({
  full_name: z.string().trim().min(2, "Name is required").max(100),
  phone: z.string().trim().regex(/^[0-9+\-\s]{0,15}$/, "Invalid phone number"),
  department: z.string().trim().max(100),
  student_id: z.string().trim().max(30),
});

function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [v, setV] = useState({ full_name: "", phone: "", department: "", student_id: "" });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile) setV({ full_name: profile.full_name, phone: profile.phone ?? "", department: profile.department ?? "", student_id: profile.student_id ?? "" });
  }, [profile]);

  async function save(e: FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(v);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Invalid input"); return; }
    setBusy(true);
    try {
      const d = parsed.data;
      await updateOwnProfile(user!.id, { full_name: d.full_name, phone: d.phone || null, department: d.department || null, student_id: d.student_id || null });
      await refreshProfile();
      toast.success("Profile updated");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Update failed";
      toast.error(msg.includes("duplicate") ? "That student ID is already registered" : msg);
    } finally {
      setBusy(false);
    }
  }

  async function onAvatar(file: File | undefined) {
    if (!file) return;
    const err = validateImageFile(file);
    if (err) { toast.error(err); return; }
    setUploading(true);
    try {
      const path = await uploadImage("avatars", user!.id, file);
      await updateOwnProfile(user!.id, { full_name: v.full_name || profile!.full_name, phone: v.phone || null, department: v.department || null, student_id: v.student_id || null, profile_image: path });
      await refreshProfile();
      toast.success("Profile photo updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const bind = (k: keyof typeof v) => ({ id: k, value: v[k], onChange: (e: { target: { value: string } }) => setV((s) => ({ ...s, [k]: e.target.value })) });

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <PageHeading title="My Profile" description="Update your personal details." />
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-6 flex items-center gap-5">
          <div className="relative">
            {profile?.profile_image ? (
              <ItemImage reference={profile.profile_image} alt="Profile" className="h-20 w-20 rounded-full" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-soft font-display text-2xl font-semibold text-primary">{(profile?.full_name ?? "U").charAt(0)}</div>
            )}
            <label className="absolute -bottom-1 -right-1 cursor-pointer rounded-full bg-primary p-1.5 text-primary-foreground shadow" aria-label="Change photo">
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => onAvatar(e.target.files?.[0])} />
            </label>
          </div>
          <div>
            <p className="font-display text-lg font-semibold">{profile?.full_name}</p>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
            <p className="text-xs text-muted-foreground">Member since {profile ? formatDate(profile.created_at) : "—"}</p>
          </div>
        </div>
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="full_name">Full name</Label><Input {...bind("full_name")} /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input value={profile?.email ?? ""} disabled /></div>
          <div className="space-y-1.5"><Label htmlFor="phone">Phone</Label><Input {...bind("phone")} /></div>
          <div className="space-y-1.5"><Label htmlFor="student_id">Student ID</Label><Input {...bind("student_id")} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="department">College / Department</Label><Input {...bind("department")} /></div>
          <div className="sm:col-span-2 flex justify-end"><Button type="submit" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save changes</Button></div>
        </form>
      </div>
    </div>
  );
}

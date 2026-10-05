import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, ImagePlus, Loader2, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { listCategories } from "@/services/catalog";
import { createItem } from "@/services/items";
import { uploadImage, validateImageFile } from "@/services/storage";
import type { ItemType } from "@/types";

const schema = z.object({
  item_name: z.string().trim().min(2, "Item name is required").max(100),
  category_id: z.string().uuid("Select a category"),
  description: z.string().trim().min(10, "Describe the item (min 10 characters)").max(1000),
  brand: z.string().trim().max(60),
  color: z.string().trim().max(40),
  identifying_features: z.string().trim().max(500),
  item_date: z
    .string()
    .min(1, "Date is required")
    .refine((d) => new Date(d) <= new Date(), "Date cannot be in the future"),
  item_time: z.string(),
  location: z.string().trim().min(2, "Location is required").max(150),
  additional_info: z.string().trim().max(1000),
});

type FormValues = z.infer<typeof schema>;
const empty: FormValues = {
  item_name: "",
  category_id: "",
  description: "",
  brand: "",
  color: "",
  identifying_features: "",
  item_date: "",
  item_time: "",
  location: "",
  additional_info: "",
};

export function ReportItemForm({ type }: { type: ItemType }) {
  const { user } = useAuth();
  const [values, setValues] = useState<FormValues>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues | "image", string>>>({});
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: listCategories });
  const word = type === "lost" ? "Lost" : "Found";

  const set = (key: keyof FormValues) => (v: string) => setValues((s) => ({ ...s, [key]: v }));

  function onFile(f: File | null) {
    if (!f) return;
    const err = validateImageFile(f);
    if (err) {
      setErrors((e) => ({ ...e, image: err }));
      return;
    }
    setErrors(({ image: _omit, ...rest }) => rest);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const next: typeof errors = {};
      for (const issue of parsed.error.issues) next[issue.path[0] as keyof FormValues] ??= issue.message;
      setErrors(next);
      toast.error("Please fix the highlighted fields");
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const imagePath = file ? await uploadImage("item-images", user.id, file) : null;
      const v = parsed.data;
      const created = await createItem(user.id, {
        item_type: type,
        item_name: v.item_name,
        category_id: v.category_id,
        description: v.description,
        brand: v.brand || null,
        color: v.color || null,
        identifying_features: v.identifying_features || null,
        item_date: v.item_date,
        item_time: v.item_time || null,
        location: v.location,
        image_url: imagePath,
        additional_info: v.additional_info || null,
      });
      setSubmittedId(created.id);
      toast.success("Report submitted for verification");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit report");
    } finally {
      setSubmitting(false);
    }
  }

  if (submittedId)
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center shadow-[var(--shadow-card)]">
        <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
        <h2 className="mt-4 font-display text-xl font-semibold">Report submitted</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Your {type} item report is now <strong>Pending Verification</strong>. An admin will review it and
          you'll get a notification once it's approved or rejected.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link to="/my-reports">View my reports</Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setSubmittedId(null);
              setValues(empty);
              setFile(null);
              setPreview(null);
            }}
          >
            Report another item
          </Button>
        </div>
      </div>
    );

  const field = (key: keyof FormValues, label: string, node: React.ReactNode, required = false) => (
    <div className="space-y-1.5">
      <Label htmlFor={key}>
        {label} {required ? <span className="text-destructive">*</span> : null}
      </Label>
      {node}
      {errors[key] ? <p className="text-xs text-destructive">{errors[key]}</p> : null}
    </div>
  );

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        {field("item_name", "Item name", <Input id="item_name" value={values.item_name} onChange={(e) => set("item_name")(e.target.value)} placeholder="e.g. Black Samsung Galaxy S23" />, true)}
        {field(
          "category_id",
          "Category",
          <Select value={values.category_id} onValueChange={set("category_id")}>
            <SelectTrigger id="category_id">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>,
          true,
        )}
      </div>
      {field("description", "Description", <Textarea id="description" rows={4} value={values.description} onChange={(e) => set("description")(e.target.value)} placeholder="Describe the item in detail" />, true)}
      <div className="grid gap-5 sm:grid-cols-2">
        {field("brand", "Brand", <Input id="brand" value={values.brand} onChange={(e) => set("brand")(e.target.value)} />)}
        {field("color", "Color", <Input id="color" value={values.color} onChange={(e) => set("color")(e.target.value)} />)}
      </div>
      {field("identifying_features", "Unique / identifying features", <Textarea id="identifying_features" rows={2} value={values.identifying_features} onChange={(e) => set("identifying_features")(e.target.value)} placeholder="Stickers, scratches, engraving, cover…" />)}
      <div className="grid gap-5 sm:grid-cols-3">
        {field("item_date", `Date ${word.toLowerCase()}`, <Input id="item_date" type="date" max={new Date().toISOString().slice(0, 10)} value={values.item_date} onChange={(e) => set("item_date")(e.target.value)} />, true)}
        {field("item_time", "Approximate time", <Input id="item_time" type="time" value={values.item_time} onChange={(e) => set("item_time")(e.target.value)} />)}
        {field("location", `Location ${word.toLowerCase()}`, <Input id="location" value={values.location} onChange={(e) => set("location")(e.target.value)} placeholder="e.g. Central Library, 2nd floor" />, true)}
      </div>

      <div className="space-y-1.5">
        <Label>Image</Label>
        {preview ? (
          <div className="relative w-fit">
            <img src={preview} alt="Preview" className="h-44 w-64 rounded-lg border border-border object-cover" />
            <button
              type="button"
              aria-label="Remove image"
              onClick={() => {
                setFile(null);
                setPreview(null);
              }}
              className="absolute right-2 top-2 rounded-full bg-background/90 p-1 shadow"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="flex h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/40 text-sm text-muted-foreground hover:border-primary/50">
            <ImagePlus className="h-6 w-6" />
            Click to upload (JPG, PNG, WebP · max 5 MB)
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
          </label>
        )}
        {errors.image ? <p className="text-xs text-destructive">{errors.image}</p> : null}
      </div>

      {field("additional_info", "Additional information", <Textarea id="additional_info" rows={2} value={values.additional_info} onChange={(e) => set("additional_info")(e.target.value)} />)}

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting} size="lg">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Submit {word} Report
        </Button>
      </div>
    </form>
  );
}

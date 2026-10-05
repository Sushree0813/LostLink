import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeading } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { createCategory, deleteCategory, listCategories, updateCategory } from "@/services/catalog";
import type { Category } from "@/types";

export const Route = createFileRoute("/admin/categories")({
  head: () => ({ meta: [{ title: "Categories — LostLink Admin" }] }),
  component: Categories,
});

function Categories() {
  const qc = useQueryClient();
  const { data: cats, isLoading } = useQuery({ queryKey: ["categories"], queryFn: listCategories });
  const [editing, setEditing] = useState<Partial<Category> | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ["categories"] });

  async function save() {
    const name = editing?.name?.trim() ?? "";
    if (name.length < 2 || name.length > 50) return void toast.error("Name must be 2–50 characters");
    try {
      if (editing?.id) await updateCategory(editing.id, name, editing.description ?? "");
      else await createCategory(name, editing?.description ?? "");
      toast.success("Category saved");
      setEditing(null);
      void refresh();
    } catch (e) {
      toast.error(e instanceof Error && e.message.includes("duplicate") ? "Category already exists" : "Save failed");
    }
  }
  async function remove(c: Category) {
    if (!window.confirm(`Delete category "${c.name}"?`)) return;
    try {
      await deleteCategory(c.id);
      toast.success("Category deleted");
      void refresh();
    } catch {
      toast.error("This category is used by reports and can't be deleted");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeading title="Categories" description="Item categories used in report forms and filters." action={<Button onClick={() => setEditing({ name: "", description: "" })}><Plus className="h-4 w-4" /> Add category</Button>} />
      {isLoading ? <Skeleton className="h-64 rounded-xl" /> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cats?.map((c) => (
            <div key={c.id} className="flex items-start justify-between rounded-xl border border-border bg-card p-4">
              <div><p className="font-medium">{c.name}</p><p className="text-xs text-muted-foreground">{c.description ?? "No description"}</p></div>
              <div className="flex">
                <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => setEditing(c)}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => remove(c)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Edit category" : "New category"}</DialogTitle></DialogHeader>
          <div className="space-y-1"><Label>Name</Label><Input value={editing?.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
          <div className="space-y-1"><Label>Description</Label><Input value={editing?.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
          <DialogFooter><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={save}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

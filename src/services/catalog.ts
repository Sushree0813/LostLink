import { supabase } from "@/integrations/supabase/client";
import type { Category } from "@/types";

export async function listCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from("categories").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function createCategory(name: string, description: string) {
  const { error } = await supabase
    .from("categories")
    .insert({ name, description: description || null });
  if (error) throw error;
}

export async function updateCategory(id: string, name: string, description: string) {
  const { error } = await supabase
    .from("categories")
    .update({ name, description: description || null })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

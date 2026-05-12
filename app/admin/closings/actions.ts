"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CropArea } from "@/components/admin/media/CropEditor";

type Result = { ok: true } | { ok: false; error: string };

export type ClosingInput = {
  image_id: string | null;
  image_crop: CropArea | null;
  neighborhood: string;
  city: string;
  state: string;
  closed_year: number;
  is_visible: boolean;
};

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function createClosing(input: ClosingInput): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };

  // Append at end of order
  const { data: existing } = await supabase
    .from("closings")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (existing?.display_order ?? -1) + 1;

  const { error } = await supabase
    .from("closings")
    .insert({ ...input, display_order: nextOrder });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/closings");
  revalidatePath("/closings");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateClosing(
  id: string,
  input: ClosingInput,
): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase.from("closings").update(input).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/closings");
  revalidatePath("/closings");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteClosing(id: string): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase.from("closings").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/closings");
  revalidatePath("/closings");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function reorderClosings(orderedIds: string[]): Promise<Result> {
  const { supabase, user } = await requireUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const updates = orderedIds.map((id, idx) =>
    supabase.from("closings").update({ display_order: idx }).eq("id", id),
  );
  const results = await Promise.all(updates);
  const firstErr = results.find((r) => r.error);
  if (firstErr?.error) return { ok: false, error: firstErr.error.message };

  revalidatePath("/admin/closings");
  revalidatePath("/closings");
  revalidatePath("/", "layout");
  return { ok: true };
}

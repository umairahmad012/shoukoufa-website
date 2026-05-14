"use server";

/**
 * Server actions for the page builder. All return { ok: true } or
 * { ok: false, error: string } so the client can show inline errors.
 */
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { findBlockDef } from "@/lib/blockRegistry";

async function client() {
  return await createClient();
}

export async function addBlock(input: {
  pageKey: string;
  blockType: string;
  position?: number;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const def = findBlockDef(input.blockType);
  if (!def) return { ok: false, error: `Unknown block type: ${input.blockType}` };

  const supabase = await client();

  // If no position given, place at the end (max + 10)
  let position = input.position;
  if (position === undefined) {
    const { data: maxRow } = await supabase
      .from("page_blocks")
      .select("position")
      .eq("page_key", input.pageKey)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    position = ((maxRow?.position ?? 0) as number) + 10;
  }

  const { data, error } = await supabase
    .from("page_blocks")
    .insert({
      page_key: input.pageKey,
      block_type: input.blockType,
      position,
      enabled: true,
      data: { ...def.defaultData(), wrapper: {} },
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/builder/${input.pageKey}`);
  revalidatePath(`/${input.pageKey === "home" ? "" : input.pageKey}`);
  return { ok: true, id: data!.id };
}

export async function updateBlockData(input: {
  id: string;
  data: Record<string, unknown>;
  pageKey: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await client();
  const { error } = await supabase
    .from("page_blocks")
    .update({ data: input.data })
    .eq("id", input.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/builder/${input.pageKey}`);
  revalidatePath(`/${input.pageKey === "home" ? "" : input.pageKey}`);
  return { ok: true };
}

export async function toggleBlock(input: {
  id: string;
  enabled: boolean;
  pageKey: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await client();
  const { error } = await supabase
    .from("page_blocks")
    .update({ enabled: input.enabled })
    .eq("id", input.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/builder/${input.pageKey}`);
  revalidatePath(`/${input.pageKey === "home" ? "" : input.pageKey}`);
  return { ok: true };
}

export async function deleteBlock(input: {
  id: string;
  pageKey: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await client();
  const { error } = await supabase.from("page_blocks").delete().eq("id", input.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/builder/${input.pageKey}`);
  revalidatePath(`/${input.pageKey === "home" ? "" : input.pageKey}`);
  return { ok: true };
}

export async function duplicateBlock(input: {
  id: string;
  pageKey: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = await client();
  const { data: src, error: e1 } = await supabase
    .from("page_blocks")
    .select("page_key, block_type, position, data")
    .eq("id", input.id)
    .single();
  if (e1 || !src) return { ok: false, error: e1?.message ?? "Block not found" };

  const { data: ins, error: e2 } = await supabase
    .from("page_blocks")
    .insert({
      page_key: src.page_key,
      block_type: src.block_type,
      // place new block immediately after source — bump position by 5,
      // reorder() can normalize later
      position: (src.position as number) + 5,
      enabled: true,
      data: src.data,
    })
    .select("id")
    .single();

  if (e2 || !ins) return { ok: false, error: e2?.message ?? "Insert failed" };
  revalidatePath(`/admin/builder/${input.pageKey}`);
  revalidatePath(`/${input.pageKey === "home" ? "" : input.pageKey}`);
  return { ok: true, id: ins.id };
}

/**
 * Reorder the entire page's blocks. Receives a list of block IDs in the
 * desired order and assigns positions 10, 20, 30, ... in that order.
 */
export async function reorderBlocks(input: {
  pageKey: string;
  orderedIds: string[];
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await client();
  // Doing N small UPDATEs is fine for a page of 10–20 blocks.
  for (let i = 0; i < input.orderedIds.length; i++) {
    const { error } = await supabase
      .from("page_blocks")
      .update({ position: (i + 1) * 10 })
      .eq("id", input.orderedIds[i]);
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath(`/admin/builder/${input.pageKey}`);
  revalidatePath(`/${input.pageKey === "home" ? "" : input.pageKey}`);
  return { ok: true };
}

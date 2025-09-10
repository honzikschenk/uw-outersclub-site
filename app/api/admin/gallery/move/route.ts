import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { supabaseService } from "@/utils/supabase/service";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  const { data: membership } = await supabase
    .from("Membership")
    .select("admin")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership?.admin) return { error: NextResponse.json({ error: "Admin access required" }, { status: 403 }) } as const;
  return { user } as const;
}

// Move a single image to another group (or ungrouped) and reindex sequences in both source and target groups.
// Body: { id: string, target_group_id: string | null, target_index?: number }
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if ("error" in admin) return admin.error;

  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "").trim();
  const target_group_id: string | null = (body.target_group_id === null || body.target_group_id === undefined)
    ? null
    : String(body.target_group_id).trim();
  let target_index: number | undefined = Number.isFinite(body.target_index) ? Number(body.target_index) : undefined;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Load the image to determine source group
  const { data: img, error: imgErr } = await supabaseService
    .from("GalleryImage")
    .select("id, group_id")
    .eq("id", id)
    .maybeSingle();
  if (imgErr) return NextResponse.json({ error: imgErr.message }, { status: 400 });
  if (!img) return NextResponse.json({ error: "not found" }, { status: 404 });

  const source_group_id = img.group_id as string | null;
  const sameGroup = (source_group_id || null) === (target_group_id || null);
  
  // If moving within same group with no specific target index, nothing to do here; client should use reorder API
  if (sameGroup && target_index === undefined) return NextResponse.json({ success: true });

  // Temporarily detach the item so we can reindex source cleanly
  {
    const { error } = await supabaseService
      .from("GalleryImage")
      .update({ group_id: null, sequence: null })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Reindex source group sequences (if it existed)
  if (source_group_id) {
    const { data: src, error: srcErr } = await supabaseService
      .from("GalleryImage")
      .select("id")
      .eq("group_id", source_group_id)
      .order("sequence", { ascending: true, nullsFirst: true });
    if (srcErr) return NextResponse.json({ error: srcErr.message }, { status: 400 });
    for (let i = 0; i < (src?.length || 0); i++) {
      const row = src![i];
      const { error } = await supabaseService
        .from("GalleryImage")
        .update({ sequence: i })
        .eq("id", row.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  // Place into target group (possibly null)
  if (target_group_id) {
    // Find current target group items and compute insertion point
    const { data: tgt, error: tgtErr } = await supabaseService
      .from("GalleryImage")
      .select("id")
      .eq("group_id", target_group_id)
      .order("sequence", { ascending: true, nullsFirst: true });
    if (tgtErr) return NextResponse.json({ error: tgtErr.message }, { status: 400 });
    const list = (tgt || []).map(r => r.id);
    const insertAt = Math.max(0, Math.min(target_index ?? list.length, list.length));
    list.splice(insertAt, 0, id);
    // Update moved image group
    {
      const { error } = await supabaseService
        .from("GalleryImage")
        .update({ group_id: target_group_id })
        .eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }
    // Reindex target group
    for (let i = 0; i < list.length; i++) {
      const rowId = list[i];
      const { error } = await supabaseService
        .from("GalleryImage")
        .update({ sequence: i })
        .eq("id", rowId);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }
  } else {
    // Ungrouped: just leave group_id=null and sequence=null
    const { error } = await supabaseService
      .from("GalleryImage")
      .update({ group_id: null, sequence: null })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

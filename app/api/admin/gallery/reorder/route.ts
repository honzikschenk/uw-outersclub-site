import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { supabaseService } from "@/utils/supabase/service";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  const { data: membership } = await supabase
    .from("Membership")
    .select("admin")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership?.admin)
    return {
      error: NextResponse.json({ error: "Admin access required" }, { status: 403 }),
    } as const;
  return { user } as const;
}

// Reorder images within a group and optionally update caption for the group.
// Expects: { group_id: string, ids: string[], caption?: string }
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if ("error" in admin) return admin.error;

  const body = await req.json().catch(() => ({}));
  const group_id = String(body.group_id || "").trim();
  const ids: string[] = Array.isArray(body.ids) ? body.ids : [];
  const caption: string | undefined = typeof body.caption === "string" ? body.caption : undefined;

  if (!group_id) return NextResponse.json({ error: "group_id required" }, { status: 400 });
  if (!ids.length) return NextResponse.json({ error: "ids required" }, { status: 400 });

  // Update sequences in order
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const { error } = await supabaseService
      .from("GalleryImage")
      .update({ sequence: i })
      .eq("id", id)
      .eq("group_id", group_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (caption !== undefined) {
    const { error } = await supabaseService
      .from("GalleryImage")
      .update({ title: caption })
      .eq("group_id", group_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

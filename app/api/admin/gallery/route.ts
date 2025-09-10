import { NextResponse } from "next/server";
import { supabaseService } from "@/utils/supabase/service";
import { createClient } from "@/utils/supabase/server";

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

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const { data, error: dbErr } = await supabaseService
    .from("GalleryImage")
  .select("id, title, image_url, created_at, group_id, sequence")
    .order("created_at", { ascending: false });
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if ("error" in admin) return admin.error;
  const body = await req.json().catch(() => ({}));
  const titleRaw = typeof body.title === 'string' ? body.title : '';
  const title = titleRaw.trim();
  const image_url = (body.image_url ?? "").toString().trim();
  const group_id = (body.group_id ?? null) as string | null;
  const sequence = typeof body.sequence === 'number' ? body.sequence : null;
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });
  if (!image_url) return NextResponse.json({ error: "image_url required" }, { status: 400 });
  const { data, error } = await supabaseService
    .from("GalleryImage")
    .insert({ title, image_url, uploaded_by: admin.user.id, group_id, sequence })
    .select("id, title, image_url, created_at, group_id, sequence")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin();
  if ("error" in admin) return admin.error;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const { error } = await supabaseService.from("GalleryImage").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

import { NextResponse } from "next/server";
import { supabaseService } from "@/utils/supabase/service";
import { createClient } from "@/utils/supabase/server";

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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const { error } = await requireAdmin();
  if (error) return error;
  if (id) {
    const { data, error: dbErr } = await supabaseService
      .from("BlogPost")
      .select(
        "id, slug, title, excerpt, content_html, cover_image_url, published, published_at, updated_at",
      )
      .eq("id", id)
      .maybeSingle();
    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
    return NextResponse.json(data);
  }
  const { data, error: listErr } = await supabaseService
    .from("BlogPost")
    .select("id, slug, title, excerpt, published, published_at, updated_at")
    .order("updated_at", { ascending: false });
  if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if ("error" in admin) return admin.error;
  const body = await req.json();
  const now = new Date().toISOString();
  const title = (body.title ?? "").trim();
  const excerpt = (body.excerpt ?? "").trim();
  const content_html = (body.content_html ?? "").trim();
  if (!title || !excerpt || !content_html) {
    return NextResponse.json(
      { error: "title, excerpt, and content_html are required" },
      { status: 400 },
    );
  }
  // Fetch author name from Membership
  const { data: member } = await supabaseService
    .from("Membership")
    .select("name")
    .eq("user_id", admin.user.id)
    .maybeSingle();

  const payload = {
    title,
    slug: body.slug,
    excerpt,
    content_html,
    cover_image_url: body.cover_image_url || null,
    published: !!body.published,
    published_at: body.published ? body.published_at || now : null,
    author_user_id: admin.user.id,
    author_name: member?.name || null,
  };
  const { data, error } = await supabaseService
    .from("BlogPost")
    .insert(payload)
    .select("id, slug, title, excerpt, published, published_at, updated_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const admin = await requireAdmin();
  if ("error" in admin) return admin.error;
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const now = new Date().toISOString();
  const title = (body.title ?? "").trim();
  const excerpt = (body.excerpt ?? "").trim();
  const content_html = (body.content_html ?? "").trim();
  if (!title || !excerpt || !content_html) {
    return NextResponse.json(
      { error: "title, excerpt, and content_html are required" },
      { status: 400 },
    );
  }
  const payload: any = {
    title,
    slug: body.slug,
    excerpt,
    content_html,
    cover_image_url: body.cover_image_url ?? null,
    published: !!body.published,
    published_at: body.published ? body.published_at || now : null,
  };
  const { data, error } = await supabaseService
    .from("BlogPost")
    .update(payload)
    .eq("id", body.id)
    .select("id, slug, title, excerpt, published, published_at, updated_at")
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
  const { error } = await supabaseService.from("BlogPost").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

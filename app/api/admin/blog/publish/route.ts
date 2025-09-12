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

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if ("error" in admin) return admin.error;
  const body = await req.json().catch(() => ({}));
  const id = body?.id as string | undefined;
  const published = !!body?.published;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const now = new Date().toISOString();
  const payload = {
    published,
    published_at: published ? now : null,
  };
  const { data, error } = await supabaseService
    .from("BlogPost")
    .update(payload)
    .eq("id", id)
    .select("id, published, published_at, updated_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

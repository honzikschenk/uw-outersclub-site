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

function sanitizeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 100);
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if ("error" in admin) return admin.error;

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  const folder = (form.get("folder")?.toString() || "covers").trim() || "covers";
  const originalName = (file as any).name || "upload";
  const cleaned = sanitizeName(originalName);
  const ext = cleaned.includes(".") ? cleaned.split(".").pop() : undefined;
  const base = cleaned.replace(/\.[^.]+$/, "");
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const filename = ext ? `${base}-${id}.${ext}` : `${base}-${id}`;
  const path = `${folder}/${filename}`;

  const arrayBuffer = await file.arrayBuffer();
  const contentType = (file as any).type || "application/octet-stream";
  if (!contentType.startsWith("image/")) {
    return NextResponse.json({ error: "Only image uploads are allowed" }, { status: 400 });
  }
  const fileSize = (file as any).size as number | undefined;
  if (typeof fileSize === "number" && fileSize > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "Image too large (max 8MB)" }, { status: 400 });
  }

  const { error: upErr } = await supabaseService.storage
    .from("blog-images")
    .upload(path, arrayBuffer, { contentType, upsert: false, cacheControl: "31536000" });

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 });

  const { data: pub } = supabaseService.storage.from("blog-images").getPublicUrl(path);
  return NextResponse.json({ path, url: pub.publicUrl });
}

function extractPath(input: string) {
  try {
    const marker = "/blog-images/";
    const idx = input.indexOf(marker);
    if (idx >= 0) return decodeURIComponent(input.substring(idx + marker.length));
  } catch {}
  return input.replace(/^\/+/, "");
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin();
  if ("error" in admin) return admin.error;

  let path = "";
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const body = await req.json().catch(() => ({}));
    const input = body?.path || body?.url;
    if (!input) return NextResponse.json({ error: "path or url required" }, { status: 400 });
    path = extractPath(String(input));
  } else {
    const { searchParams } = new URL(req.url);
    const input = searchParams.get("path") || searchParams.get("url");
    if (!input) return NextResponse.json({ error: "path or url required" }, { status: 400 });
    path = extractPath(input);
  }

  if (!path) return NextResponse.json({ error: "invalid path" }, { status: 400 });
  const { error } = await supabaseService.storage.from("blog-images").remove([path]);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

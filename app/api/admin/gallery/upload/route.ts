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
  const folder = (form.get("folder")?.toString() || "gallery").trim() || "gallery";
  const originalName = (file as any).name || "upload";
  const cleaned = sanitizeName(originalName);
  const ext = cleaned.includes(".") ? cleaned.split(".").pop() : undefined;
  const base = cleaned.replace(/\.[^.]+$/, "");
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const filename = ext ? `${base}-${id}.${ext}` : `${base}-${id}`;
  const path = `${folder}/${filename}`;

  // Ensure bucket exists (public for direct access)
  try {
    const { data: bucketInfo } = await supabaseService.storage.getBucket("gallery-images");
    if (!bucketInfo) {
      await supabaseService.storage.createBucket("gallery-images", { public: true });
    }
  } catch {
    // Ignore; upload below will surface any real errors
  }

  let arrayBuffer = await (file as any).arrayBuffer();
  let contentType = (file as any).type || "application/octet-stream";
  if (!contentType.startsWith("image/")) {
    return NextResponse.json({ error: "Only image uploads are allowed" }, { status: 400 });
  }
  const fileSize = (file as any).size as number | undefined;
  // If larger than ~1.5MB, try server-side re-encode to webp at lower quality to avoid body size issues upstream
  if (typeof fileSize === "number" && fileSize > 1.5 * 1024 * 1024) {
    try {
      // Use sharp if available in the runtime; fallback to reject if not
      // We intentionally avoid adding a dependency; this block will be skipped if sharp is not present
      // @ts-ignore
      const sharp = (await import("sharp")).default as any;
      if (sharp) {
        const input = Buffer.from(arrayBuffer);
        const img = sharp(input, { limitInputPixels: 268402689 });
        const meta = await img.metadata();
        const maxW = 1600;
        const maxH = 1200;
        const width = meta.width || maxW;
        const height = meta.height || maxH;
        const ratio = Math.min(maxW / width, maxH / height, 1);
        const targetW = Math.max(1, Math.floor(width * ratio));
        const targetH = Math.max(1, Math.floor(height * ratio));
        const out = await img.resize(targetW, targetH).webp({ quality: 75 }).toBuffer();
        arrayBuffer = out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength);
        contentType = "image/webp";
      }
    } catch {
      // ignore; will try raw upload below
    }
  }

  const { error: upErr } = await supabaseService.storage
    .from("gallery-images")
    .upload(path, arrayBuffer, { contentType, upsert: false, cacheControl: "31536000" });

  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 });

  const { data: pub } = supabaseService.storage.from("gallery-images").getPublicUrl(path);
  return NextResponse.json({ path, url: pub.publicUrl });
}

function extractPath(input: string) {
  try {
    const marker = "/gallery-images/";
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
  const { error } = await supabaseService.storage.from("gallery-images").remove([path]);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

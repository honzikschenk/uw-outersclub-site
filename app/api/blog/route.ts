import { NextResponse } from "next/server";
import { supabaseService } from "@/utils/supabase/service";

export async function GET() {
  const { data, error } = await supabaseService
    .from("BlogPost")
    .select("id, slug, title, excerpt, cover_image_url, published_at")
    .eq("published", true)
    .order("published_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

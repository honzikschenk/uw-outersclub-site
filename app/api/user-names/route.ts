import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams.get("ids");
  if (!ids) return NextResponse.json({});
  const supabase = await createClient();
  // Query the public auth.users table directly for emails
  const { data, error } = await supabase
    .from("users")
    .select("id, email")
    .in("id", ids.split(","));
  if (error || !data) return NextResponse.json({});
  const map: Record<string, string> = {};
  for (const u of data) map[u.id] = u.email ?? "";
  return NextResponse.json(map);
}

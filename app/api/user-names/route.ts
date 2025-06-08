import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams.get("ids");
  if (!ids) return NextResponse.json({});

  // Use the service role key to access the admin API
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Use the admin API to list all users and filter by id
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error || !data) return NextResponse.json({});
  const idArr = ids.split(",");
  const map: Record<string, string> = {};
  for (const u of data.users) {
    if (idArr.includes(u.id)) {
      map[u.id] = u.email ?? "";
    }
  }
  return NextResponse.json(map);
}

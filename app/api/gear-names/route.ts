import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams.get("ids");
  if (!ids) return NextResponse.json({});
  const supabase = await createClient();
  const { data, error } = await supabase.from("Gear").select("id, name").in("id", ids.split(","));
  if (error) return NextResponse.json({});
  const map: Record<string, string> = {};
  for (const g of data) map[g.id] = g.name;
  return NextResponse.json(map);
}

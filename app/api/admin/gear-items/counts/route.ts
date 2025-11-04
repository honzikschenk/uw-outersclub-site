import { NextResponse } from "next/server";
import { supabaseService } from "@/utils/supabase/service";

// Returns counts of GearItem per gear_id (both total and active)
export async function GET() {
  try {
    const supabase = supabaseService;

    // Aggregate counts per gear_id
    const { data, error } = await supabase
      .from("GearItem")
      .select("gear_id, active")
      .returns<{ gear_id: number; active: boolean }[]>();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Reduce client-side to avoid RPC function; service role has full read
    const counts = new Map<
      number,
      { gear_id: number; total_units: number; active_units: number }
    >();
    for (const row of data || []) {
      const current = counts.get(row.gear_id) || {
        gear_id: row.gear_id,
        total_units: 0,
        active_units: 0,
      };
      current.total_units += 1;
      if (row.active) current.active_units += 1;
      counts.set(row.gear_id, current);
    }

    return NextResponse.json({
      data: Array.from(counts.values()),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}

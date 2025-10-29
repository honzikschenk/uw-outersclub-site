import { NextRequest, NextResponse } from "next/server";
import { supabaseService } from "@/utils/supabase/service";

// GET /api/admin/gear-items?gear_id=123
export async function GET(request: NextRequest) {
  try {
    const supabase = supabaseService;
    const { searchParams } = new URL(request.url);
    const gearId = searchParams.get("gear_id");

    if (!gearId) {
      return NextResponse.json({ error: "gear_id is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("GearItem")
      .select("id, gear_id, code, active")
      .eq("gear_id", Number(gearId))
      .order("code", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Unknown error" },
      { status: 500 },
    );
  }
}

// POST /api/admin/gear-items
// Body: { action: "create" | "update" | "delete", ... }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = supabaseService;

    const action = body?.action as "create" | "update" | "delete" | undefined;
    if (!action) {
      return NextResponse.json({ error: "action is required" }, { status: 400 });
    }

    if (action === "create") {
      const { gear_id, code, active = true } = body || {};
      if (!gear_id || !code) {
        return NextResponse.json({ error: "gear_id and code are required" }, { status: 400 });
      }
      const { data, error } = await supabase
        .from("GearItem")
        .insert([{ gear_id, code, active }])
        .select();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, data });
    }

    if (action === "update") {
      const { id, code, active } = body || {};
      if (!id) {
        return NextResponse.json({ error: "id is required" }, { status: 400 });
      }
      const update: Record<string, any> = {};
      if (code !== undefined) update.code = code;
      if (active !== undefined) update.active = active;
      if (Object.keys(update).length === 0) {
        return NextResponse.json({ error: "No fields to update" }, { status: 400 });
      }
      const { data, error } = await supabase.from("GearItem").update(update).eq("id", id).select();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, data });
    }

    if (action === "delete") {
      const { id } = body || {};
      if (!id) {
        return NextResponse.json({ error: "id is required" }, { status: 400 });
      }
      // Optional: prevent delete if active non-returned rentals exist for this unit
      const { data: activeRentals } = await supabase
        .from("Lent")
        .select("id")
        .eq("gear_item_id", id)
        .eq("returned", false);
      if (activeRentals && activeRentals.length > 0) {
        return NextResponse.json(
          { error: "Cannot delete unit with active rentals" },
          { status: 400 },
        );
      }
      const { error } = await supabase.from("GearItem").delete().eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Unknown error" },
      { status: 500 },
    );
  }
}

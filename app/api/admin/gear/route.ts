import { supabaseService } from "@/utils/supabase/service";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { originalRows, editedRows, deletedRowIds } = await request.json();
    const supabase = supabaseService;
    let errors: string[] = [];

    // 1. Update changed rows
    for (const edited of editedRows) {
      const original = originalRows.find((row: any) => row.id === edited.id);
      if (!original) continue;
      
      // Only update if something changed
      const changedFields: Record<string, any> = {};
      for (const key of Object.keys(edited)) {
        if (key === "id") continue;
        if (edited[key] !== original[key]) {
          changedFields[key] = edited[key];
        }
      }
      
      if (Object.keys(changedFields).length > 0) {
        const { error } = await supabase
          .from("Gear")
          .update(changedFields)
          .eq("id", edited.id);
        
        if (error) errors.push(`Update failed for gear id ${edited.id}: ${error.message}`);
      }
    }

    // 2. Delete marked rows
    for (const id of deletedRowIds) {
      // Check if gear has active rentals before deleting
      const { data: activeRentals } = await supabase
        .from("Lent")
        .select("id")
        .eq("gear_id", id)
        .eq("returned", false);

      if (activeRentals && activeRentals.length > 0) {
        errors.push(`Cannot delete gear id ${id}: has active rentals`);
        continue;
      }

      const { error } = await supabase.from("Gear").delete().eq("id", id);
      if (error) errors.push(`Delete failed for gear id ${id}: ${error.message}`);
    }

    if (errors.length === 0) {
      return NextResponse.json({ success: true, errors }, { status: 200 });
    } else {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Unknown error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = supabaseService;
    
    // Check authentication and admin status
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: membership, error: membershipError } = await supabase
      .from("Membership")
      .select("admin")
      .eq("user_id", user.id)
      .maybeSingle();

    if (membershipError) {
      console.error("Error checking admin status:", membershipError);
      return NextResponse.json({ error: "Error checking admin status" }, { status: 500 });
    }

    if (!membership?.admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const gearId = searchParams.get('id');
    
    if (!gearId) {
      return NextResponse.json({ error: "Gear ID is required" }, { status: 400 });
    }

    // Check if gear has active rentals
    const { data: activeRentals } = await supabase
      .from("Lent")
      .select("id")
      .eq("gear_id", gearId)
      .eq("returned", false);

    if (activeRentals && activeRentals.length > 0) {
      return NextResponse.json({ 
        error: "Cannot delete gear with active rentals" 
      }, { status: 400 });
    }

    const { error } = await supabase
      .from("Gear")
      .delete()
      .eq("id", gearId);

    if (error) {
      console.error("Error deleting gear:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Gear delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
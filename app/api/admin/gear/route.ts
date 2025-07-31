import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin status
    const { data: membership } = await supabase
      .from("Membership")
      .select("admin")
      .eq("user_id", user.id)
      .single();

    if (!membership?.admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const gearData = await request.json();
    
    // Validate required fields
    if (!gearData.name || !gearData.category) {
      return NextResponse.json({ error: "Name and category are required" }, { status: 400 });
    }

    let result;
    
    if (gearData.id && gearData.id > 1000000) {
      // This is a new item (temporary ID was assigned), create it
      const { data, error } = await supabase
        .from("Gear")
        .insert({
          name: gearData.name,
          category: gearData.category,
          num_available: gearData.num_available || 0,
          description: gearData.description || null,
          price_tu_th: gearData.price_tu_th || null,
          price_th_tu: gearData.price_th_tu || null,
          price_week: gearData.price_week || null,
          total_times_rented: 0,
          revenue_generated: 0
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating gear:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      result = data;
    } else {
      // Update existing item
      const { data, error } = await supabase
        .from("Gear")
        .update({
          name: gearData.name,
          category: gearData.category,
          num_available: gearData.num_available || 0,
          description: gearData.description || null,
          price_tu_th: gearData.price_tu_th || null,
          price_th_tu: gearData.price_th_tu || null,
          price_week: gearData.price_week || null,
        })
        .eq("id", gearData.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating gear:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      result = data;
    }

    return NextResponse.json({ success: true, gear: result });
    
  } catch (error) {
    console.error("Gear save error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    
    // Check authentication and admin status
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: membership } = await supabase
      .from("Membership")
      .select("admin")
      .eq("user_id", user.id)
      .single();

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
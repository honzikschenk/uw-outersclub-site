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

    const userData = await request.json();
    
    // Validate required fields
    if (!userData.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    let result;
    
    if (!userData.user_id || userData.user_id === '') {
      // This is a new user, but we can't create auth users through this API
      // We can only create membership records for existing auth users
      return NextResponse.json({ 
        error: "Cannot create new users. Users must sign up through the authentication system first." 
      }, { status: 400 });
    } else {
      // Update existing membership
      const { data, error } = await supabase
        .from("Membership")
        .update({
          name: userData.name,
          valid: userData.valid !== undefined ? userData.valid : true,
          admin: userData.admin !== undefined ? userData.admin : false,
        })
        .eq("user_id", userData.user_id)
        .select()
        .maybeSingle();

      if (error) {
        console.error("Error updating user membership:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      if (!data) {
        return NextResponse.json({ error: "User membership not found" }, { status: 404 });
      }
      
      result = data;
    }

    return NextResponse.json({ success: true, user: result });
    
  } catch (error) {
    console.error("User save error:", error);
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
    const userId = searchParams.get('user_id');
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Prevent deleting self
    if (userId === user.id) {
      return NextResponse.json({ 
        error: "Cannot delete your own membership" 
      }, { status: 400 });
    }

    // Check if user has active rentals
    const { data: activeRentals } = await supabase
      .from("Lent")
      .select("id")
      .eq("user_id", userId)
      .eq("returned", false);

    if (activeRentals && activeRentals.length > 0) {
      return NextResponse.json({ 
        error: "Cannot delete user with active rentals" 
      }, { status: 400 });
    }

    // Invalidate membership instead of deleting
    const { error } = await supabase
      .from("Membership")
      .update({ valid: false })
      .eq("user_id", userId);

    if (error) {
      console.error("Error invalidating user membership:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("User delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
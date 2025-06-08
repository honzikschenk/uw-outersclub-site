import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  // Query Membership table for admin status
  const { data: membership, error: membershipError } = await supabase
    .from("Membership")
    .select("admin")
    .eq("user_id", user.id)
    .maybeSingle();
  if (membershipError) {
    return NextResponse.json({ error: "Could not fetch admin status" }, { status: 500 });
  }
  return NextResponse.json({
    id: user.id,
    email: user.email,
    admin: membership?.admin === true,
  });
}

import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import React from "react";
import LentItemsTable from "@/components/LentItemsTable";

export default async function MemberDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="container mx-auto py-10">
        <nav className="mb-6 text-sm text-muted-foreground flex gap-2 items-center">
          <Link href="/member" className="hover:underline">
            Member
          </Link>
        </nav>
        <Card className="p-8 text-center">
          <p className="mb-4">You must be signed in to view your dashboard.</p>
          <Link href="/sign-in" className="underline text-green-600">
            Sign in
          </Link>
        </Card>
      </div>
    );
  }

  // Fetch user membership status
  const { data: memberships, error: membershipError } = await supabase
    .from("Membership")
    .select("user_id, valid, admin, name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) {
    return (
      <div className="container mx-auto py-10">
        <div className="p-8 text-red-600">
          Error loading membership status: {membershipError.message}
        </div>
      </div>
    );
  }

  if (!memberships || !memberships.valid) {
    return (
      <div className="container mx-auto py-10">
        <nav className="mb-6 text-sm text-muted-foreground flex gap-2 items-center">
          <Link href="/member" className="hover:underline">
            Member
          </Link>
        </nav>
        <Card className="p-8 text-center">
          <p className="mb-4">
            Your membership is not valid. Please renew your membership to access
            this page.
          </p>
          <Link href="/about" className="underline text-green-600">
            About Becoming a Member
          </Link>
        </Card>
      </div>
    );
  }

  // Fetch currently lent items for this user
  const { data: lentItems, error: lentError } = await supabase
    .from("Lent")
    .select("id, user_id, gear_id, lent_date, due_date, returned")
    .eq("user_id", user.id)
    .order("due_date", { ascending: true });

  if (lentError) {
    return (
      <div className="container mx-auto py-10">
        <div className="p-8 text-red-600">
          Error loading lent items: {lentError.message}
        </div>
      </div>
    );
  }

  // Fetch all gear names for user's lent items
  let gearMap: Record<string, string> = {};
  if (lentItems && lentItems.length > 0) {
    const gearIds = Array.from(new Set(lentItems.map((item: any) => item.gear_id).filter(Boolean)));
    if (gearIds.length > 0) {
      const { data: gearRows } = await supabase
        .from("Gear")
        .select("id, name")
        .in("id", gearIds);
      if (gearRows) {
        gearMap = gearRows.reduce((acc: Record<string, string>, g: any) => {
          acc[g.id] = g.name;
          return acc;
        }, {});
      }
    }
  }

  return (
    <div className="container mx-auto py-10">
      <nav className="mb-6 text-sm text-muted-foreground flex gap-2 items-center">
        <Link href="/member" className="hover:underline">
          Member
        </Link>
      </nav>
      <h1 className="text-4xl font-bold mb-8">My Lent Items</h1>
      {lentItems && lentItems.length > 0 ? (
        <LentItemsTable lentItems={lentItems} gearMap={gearMap} />
      ) : (
        <p className="p-8 text-muted-foreground text-center">
          You have no items currently checked out.
        </p>
      )}
    </div>
  );
}

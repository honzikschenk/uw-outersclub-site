import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import React from "react";
import LentItemsTable from "@/components/LentItemsTable";

export const metadata = {
  title: "Member | UW Outers Club",
};

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
    // Allow access but show warning
    const membershipStatus = !memberships ? "no_record" : "invalid";

    // Still fetch lent items for non-valid users
    const { data: lentItems, error: lentError } = await supabase
      .from("Lent")
      .select("id, user_id, gear_id, gear_item_id, lent_date, due_date, returned")
      .eq("user_id", user.id)
      .order("due_date", { ascending: true });

    if (lentError) {
      return (
        <div className="container mx-auto py-10">
          <div className="p-8 text-red-600">Error loading lent items: {lentError.message}</div>
        </div>
      );
    }

    // Fetch all gear names and gear item codes for user's lent items
    let gearMap: Record<string, string> = {};
    let gearItemMap: Record<string, string> = {};
    if (lentItems && lentItems.length > 0) {
      const gearIds = Array.from(
        new Set(lentItems.map((item: any) => item.gear_id).filter(Boolean)),
      );
      const gearItemIds = Array.from(
        new Set(lentItems.map((item: any) => item.gear_item_id).filter(Boolean)),
      );
      if (gearIds.length > 0) {
        const { data: gearRows } = await supabase.from("Gear").select("id, name").in("id", gearIds);
        if (gearRows) {
          gearMap = gearRows.reduce((acc: Record<string, string>, g: any) => {
            acc[g.id] = g.name;
            return acc;
          }, {});
        }
      }
      if (gearItemIds.length > 0) {
        const { data: gearItemRows } = await supabase
          .from("GearItem")
          .select("id, code")
          .in("id", gearItemIds);
        if (gearItemRows) {
          gearItemMap = gearItemRows.reduce((acc: Record<string, string>, gi: any) => {
            acc[gi.id] = gi.code;
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

        {/* Membership Warning */}
        <Card className="p-6 mb-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <div className="bg-yellow-100 p-2 rounded-full">
              <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-yellow-800 mb-2">Membership Required for Pickup</h3>
              <p className="text-yellow-700 text-sm mb-3">
                {membershipStatus === "no_record"
                  ? "You don't have a membership record. You can still make reservations, but you'll need to become a member when you pick up your gear."
                  : "Your membership has expired. You can still make reservations, but you'll need to renew your membership when you pick up your gear."}
              </p>
              <p className="text-yellow-700 text-sm mb-3">
                <strong>
                  Membership can be completed at pickup time during equipment room hours:
                </strong>
              </p>
              <ul className="text-yellow-700 text-sm space-y-1 mb-3">
                <li>• Tuesdays & Thursdays, 5:30-6:30 PM</li>
                <li>• Location: PAC 2010 (west)</li>
                <li>• Bring your WatCard</li>
              </ul>
              <Link
                href="/about"
                className="inline-block bg-yellow-600 text-white px-4 py-2 rounded text-sm hover:bg-yellow-700 transition-colors"
              >
                Learn About Membership
              </Link>
            </div>
          </div>
        </Card>

        <h1 className="text-4xl font-bold mb-8">My Lent Items</h1>
        {lentItems && lentItems.length > 0 ? (
          <LentItemsTable lentItems={lentItems} gearMap={gearMap} gearItemMap={gearItemMap} />
        ) : (
          <p className="p-8 text-muted-foreground text-center">
            You have no items currently checked out.
          </p>
        )}
      </div>
    );
  }

  // Fetch currently lent items for this user
  const { data: lentItems, error: lentError } = await supabase
    .from("Lent")
    .select("id, user_id, gear_id, gear_item_id, lent_date, due_date, returned")
    .eq("user_id", user.id)
    .order("due_date", { ascending: true });

  if (lentError) {
    return (
      <div className="container mx-auto py-10">
        <div className="p-8 text-red-600">Error loading lent items: {lentError.message}</div>
      </div>
    );
  }

  // Fetch all gear names and gear item codes for user's lent items
  let gearMap: Record<string, string> = {};
  let gearItemMap: Record<string, string> = {};
  if (lentItems && lentItems.length > 0) {
    const gearIds = Array.from(new Set(lentItems.map((item: any) => item.gear_id).filter(Boolean)));
    const gearItemIds = Array.from(
      new Set(lentItems.map((item: any) => item.gear_item_id).filter(Boolean)),
    );
    if (gearIds.length > 0) {
      const { data: gearRows } = await supabase.from("Gear").select("id, name").in("id", gearIds);
      if (gearRows) {
        gearMap = gearRows.reduce((acc: Record<string, string>, g: any) => {
          acc[g.id] = g.name;
          return acc;
        }, {});
      }
    }
    if (gearItemIds.length > 0) {
      const { data: gearItemRows } = await supabase
        .from("GearItem")
        .select("id, code")
        .in("id", gearItemIds);
      if (gearItemRows) {
        gearItemMap = gearItemRows.reduce((acc: Record<string, string>, gi: any) => {
          acc[gi.id] = gi.code;
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
        <LentItemsTable lentItems={lentItems} gearMap={gearMap} gearItemMap={gearItemMap} />
      ) : (
        <p className="p-8 text-muted-foreground text-center">
          You have no items currently checked out.
        </p>
      )}
    </div>
  );
}

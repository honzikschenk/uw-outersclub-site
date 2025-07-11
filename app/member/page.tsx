import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator"
import React, { useState } from "react";
import AdminSpreadsheet from "@/components/AdminSpreadsheet";
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

  // Fetch admin status
  const isAdmin = memberships && memberships.admin;

  // Fetch all lent items and all members if admin
  let allLentItems: any[] = [];
  let allMembers: any[] = [];
  let allLentError: any = null;
  let allMembersError: any = null;
  if (isAdmin) {
    const [
      { data: lent, error: lentErr },
      { data: members, error: membersErr },
    ] = await Promise.all([
      supabase
        .from("Lent")
        .select("id, lent_date, due_date, gear_id, user_id, returned")
        .order("due_date", { ascending: true }),
      supabase.from("Membership").select("joined_on, user_id, valid, admin, name"),
    ]);
    allLentItems = lent || [];
    allMembers = members || [];
    allLentError = lentErr;
    allMembersError = membersErr;
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

      {/* Admin spreadsheets */}
      {isAdmin && (
        <div className="mt-12 space-y-12">
          <Separator />
          <h2 className="text-3xl font-bold mb-6">Admin Spreadsheets</h2>
          {/* Lent Items Spreadsheet */}
          <AdminSpreadsheet
            title="Lent Items"
            columns={["lent_date", "due_date", "gear_id", "user_id", "returned"]}
            data={allLentItems}
            error={allLentError}
            tableName="Lent"
          />
          {/* Members Spreadsheet */}
          <AdminSpreadsheet
            title="Memberships"
            columns={["user_id", "name", "joined_on", "valid", "admin"]}
            data={allMembers}
            error={allMembersError}
            tableName="Membership"
          />
        </div>
      )}
    </div>
  );
}

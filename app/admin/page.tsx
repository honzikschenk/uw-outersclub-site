import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import AdminSpreadsheet from "@/components/AdminSpreadsheet";
import AdminAnalytics from "@/components/admin/AdminAnalytics";
import { Users, Package, Clock, AlertTriangle } from "lucide-react";

export default async function AdminDashboard() {
  const supabase = await createClient();
  
  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Check admin status
  const { data: membership, error: membershipError } = await supabase
    .from("Membership")
    .select("user_id, valid, admin, name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError || !membership || !membership.admin) {
    return redirect("/member");
  }

  // Fetch all data for admin management
  const [
    { data: allLentItems, error: lentError },
    { data: allMembers, error: membersError },
    { data: allGear, error: gearError },
  ] = await Promise.all([
    supabase
      .from("Lent")
      .select("id, lent_date, due_date, gear_id, user_id, returned")
      .order("due_date", { ascending: true }),
    supabase
      .from("Membership")
      .select("user_id, joined_on, valid, admin, name")
      .order("joined_on", { ascending: false }),
    supabase
      .from("Gear")
      .select("id, name, category, available, description")
      .order("category", { ascending: true }),
  ]);

  // Calculate analytics
  const now = new Date();
  const activeRentals = allLentItems?.filter(item => !item.returned) || [];
  const overdueRentals = activeRentals.filter(item => 
    item.due_date && new Date(item.due_date) < now
  );
  const totalMembers = allMembers?.filter(member => member.valid) || [];
  const totalGear = allGear?.length || 0;
  const availableGear = allGear?.filter(gear => gear.available) || [];

  return (
    <div className="container mx-auto py-10">
      <nav className="mb-6 text-sm text-muted-foreground flex gap-2 items-center">
        <Link href="/admin" className="hover:underline">
          Admin Dashboard
        </Link>
      </nav>
      
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>
      
      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rentals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRentals.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently checked out
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueRentals.length}</div>
            <p className="text-xs text-muted-foreground">
              Past due date
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers.length}</div>
            <p className="text-xs text-muted-foreground">
              Active memberships
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Gear</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableGear.length}</div>
            <p className="text-xs text-muted-foreground">
              of {totalGear} total items
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <AdminAnalytics 
        lentItems={allLentItems || []} 
        members={allMembers || []} 
        gear={allGear || []} 
      />

      <Separator className="my-8" />

      {/* Management Spreadsheets */}
      <h2 className="text-3xl font-bold mb-6">Management Tools</h2>
      
      <div className="space-y-8">
        {/* Rental Management */}
        <AdminSpreadsheet
          title="Rental Management"
          columns={["lent_date", "due_date", "gear_id", "user_id", "returned"]}
          data={allLentItems || []}
          error={lentError}
          tableName="Lent"
        />

        {/* User Management */}
        <AdminSpreadsheet
          title="User Management"
          columns={["user_id", "name", "joined_on", "valid", "admin"]}
          data={allMembers || []}
          error={membersError}
          tableName="Membership"
        />

        {/* Gear Management */}
        <AdminSpreadsheet
          title="Gear Inventory"
          columns={["name", "category", "available", "description"]}
          data={allGear || []}
          error={gearError}
          tableName="Gear"
        />
      </div>
    </div>
  );
}
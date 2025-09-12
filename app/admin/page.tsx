import { createClient } from "@/utils/supabase/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, Package, Clock, AlertTriangle, TrendingUp, Calendar, FileText } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import QuickReturnRentals from "@/components/admin/QuickReturnRentals";
import Link from "next/link";

export default async function AdminOverview() {
  const supabase = await createClient();

  // Check authentication and admin status
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-8 text-center">
          <p className="mb-4">You must be signed in to view the admin dashboard.</p>
          <Link href="/sign-in" className="underline text-green-600">
            Sign in
          </Link>
        </Card>
      </div>
    );
  }

  // Check admin status
  const { data: membership, error: membershipError } = await supabase
    .from("Membership")
    .select("user_id, valid, admin, name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) {
    return (
      <div className="p-8 text-red-600">
        Error loading membership status: {membershipError.message}
      </div>
    );
  }

  if (!membership?.admin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-8 text-center">
          <p className="mb-4">Admin access required to view this page.</p>
          <Link href="/member" className="underline text-green-600">
            Go to Member Dashboard
          </Link>
        </Card>
      </div>
    );
  }

  // Fetch all data for admin overview and spreadsheets
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
      .select(
        "id, name, category, num_available, description, price_tu_th, price_th_tu, price_week, total_times_rented, revenue_generated",
      )
      .order("category", { ascending: true }),
  ]);

  // Calculate analytics
  const now = new Date();
  const activeRentals = allLentItems?.filter((item) => !item.returned) || [];
  const overdueRentals = activeRentals.filter(
    (item) => item.due_date && new Date(item.due_date) < now,
  );
  const totalMembers = allMembers?.filter((member) => member.valid) || [];
  const totalGear = allGear?.length || 0;
  const availableGear = allGear?.filter((gear) => (gear.num_available || 0) > 0) || [];

  // Recent activity (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const recentRentals =
    allLentItems?.filter((item) => item.lent_date && new Date(item.lent_date) >= weekAgo) || [];

  // Create lookup maps for enhanced rentals
  const gearMap =
    allGear?.reduce((acc, g) => ({ ...acc, [g.id]: g }), {} as Record<number, any>) || {};
  const userMap =
    allMembers?.reduce((acc, u) => ({ ...acc, [u.user_id]: u }), {} as Record<string, any>) || {};

  // Enhance rentals with gear and user info for QuickReturnRentals component
  const enhancedRentals =
    allLentItems?.map((rental) => {
      let status: "returned" | "overdue" | "active";
      if (rental.returned) {
        status = "returned";
      } else if (rental.due_date && new Date(rental.due_date) < now) {
        status = "overdue";
      } else {
        status = "active";
      }

      return {
        ...rental,
        gearName: gearMap[rental.gear_id]?.name || `Gear #${rental.gear_id}`,
        gearCategory: gearMap[rental.gear_id]?.category || "Unknown",
        userName: userMap[rental.user_id]?.name || "Unknown User",
        status,
      };
    }) || [];

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage gear, rentals, and memberships</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rentals</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{activeRentals.length}</div>
            <p className="text-xs text-gray-600">Currently checked out</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueRentals.length}</div>
            <p className="text-xs text-gray-600">Past due date</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalMembers.length}</div>
            <p className="text-xs text-gray-600">Active memberships</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Gear</CardTitle>
            <Package className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{availableGear.length}</div>
            <p className="text-xs text-gray-600">of {totalGear} total items</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Return rentals */}
      <div className="space-y-8">
        <Separator />

        <QuickReturnRentals rentals={enhancedRentals} />
      </div>
    </div>
  );
}

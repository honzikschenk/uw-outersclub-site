import { createClient } from "@/utils/supabase/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, AlertTriangle, CheckCircle, Calendar, FileText, TrendingDown } from "lucide-react";
import RentalsTable from "@/components/admin/RentalsTable";
import RentalChart from "@/components/admin/RentalChart";

export default async function RentalsPage() {
  const supabase = await createClient();

  // Fetch all rental data with gear and user information
  const [
    { data: allRentals, error: rentalsError },
    { data: gearData, error: gearError },
    { data: userData, error: userError },
    { data: gearItems, error: gearItemsError },
  ] = await Promise.all([
    supabase
      .from("Lent")
      .select("id, lent_date, due_date, gear_id, gear_item_id, user_id, returned")
      .order("lent_date", { ascending: false }),
    supabase.from("Gear").select("id, name, category"),
    supabase.from("Membership").select("user_id, name"),
    supabase.from("GearItem").select("id, code"),
  ]);

  if (rentalsError || gearError || userError || gearItemsError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Rental Management</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">
              Error loading rental data:{" "}
              {rentalsError?.message ||
                gearError?.message ||
                userError?.message ||
                gearItemsError?.message}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const rentals = allRentals || [];
  const gear = gearData || [];
  const users = userData || [];
  const gearItemRows = gearItems || [];

  // Create lookup maps
  const gearMap = gear.reduce((acc, g) => ({ ...acc, [g.id]: g }), {} as Record<number, any>);
  const userMap = users.reduce((acc, u) => ({ ...acc, [u.user_id]: u }), {} as Record<string, any>);
  const gearItemCodeMap = gearItemRows.reduce(
    (acc, gi) => ({ ...acc, [gi.id]: gi.code }),
    {} as Record<string | number, string>,
  );

  // Calculate rental statistics
  const now = new Date();
  const activeRentals = rentals.filter((r) => !r.returned);
  const overdueRentals = activeRentals.filter((r) => r.due_date && new Date(r.due_date) < now);
  const completedRentals = rentals.filter((r) => r.returned);

  // Calculate recent activity (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const recentRentals = rentals.filter((r) => r.lent_date && new Date(r.lent_date) >= weekAgo);
  const recentReturns = rentals.filter(
    (r) => r.returned && r.lent_date && new Date(r.lent_date) >= weekAgo,
  );

  // Calculate average rental duration for completed rentals
  const completedWithDates = completedRentals.filter((r) => r.lent_date && r.due_date);
  const avgDuration =
    completedWithDates.length > 0
      ? Math.round(
          completedWithDates.reduce((acc, r) => {
            const lent = new Date(r.lent_date);
            const due = new Date(r.due_date);
            return acc + (due.getTime() - lent.getTime()) / (1000 * 60 * 60 * 24);
          }, 0) / completedWithDates.length,
        )
      : 0;

  // Enhance rentals with gear and user info
  const enhancedRentals = rentals.map((rental) => {
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
      gearItemCode: rental.gear_item_id ? gearItemCodeMap[rental.gear_item_id] : undefined,
      status,
    };
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rental Management</h1>
          <p className="text-gray-600 mt-2">Track gear checkouts and returns</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rentals</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{activeRentals.length}</div>
            <p className="text-xs text-gray-600">Currently checked out or not yet rented</p>
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
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedRentals.length}</div>
            <p className="text-xs text-gray-600">Total returns</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{avgDuration}</div>
            <p className="text-xs text-gray-600">days per rental</p>
          </CardContent>
        </Card>
      </div>

      {/* Rental Trends Chart */}
      <RentalChart rentals={enhancedRentals} />

      {/* Rentals Table */}
      <RentalsTable rentals={enhancedRentals} />
    </div>
  );
}

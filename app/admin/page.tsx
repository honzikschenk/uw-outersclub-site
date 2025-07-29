import { createClient } from "@/utils/supabase/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, Package, Clock, AlertTriangle, TrendingUp, Calendar, FileText } from "lucide-react";
import Link from "next/link";

export default async function AdminOverview() {
  const supabase = await createClient();

  // Fetch all data for admin overview
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

  // Recent activity (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const recentRentals = allLentItems?.filter(item => 
    item.lent_date && new Date(item.lent_date) >= weekAgo
  ) || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Overview</h1>
        <p className="text-gray-600 mt-2">Welcome to the UW Outers Club admin dashboard</p>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rentals</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{activeRentals.length}</div>
            <p className="text-xs text-gray-600">
              Currently checked out
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueRentals.length}</div>
            <p className="text-xs text-gray-600">
              Past due date
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalMembers.length}</div>
            <p className="text-xs text-gray-600">
              Active memberships
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Gear</CardTitle>
            <Package className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{availableGear.length}</div>
            <p className="text-xs text-gray-600">
              of {totalGear} total items
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/admin/users" className="group">
          <Card className="group-hover:shadow-lg transition-all group-hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Manage Users</h3>
                  <p className="text-sm text-gray-600">View and edit member accounts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/gear" className="group">
          <Card className="group-hover:shadow-lg transition-all group-hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Package className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Manage Gear</h3>
                  <p className="text-sm text-gray-600">Update inventory and availability</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/rentals" className="group">
          <Card className="group-hover:shadow-lg transition-all group-hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Track Rentals</h3>
                  <p className="text-sm text-gray-600">Monitor checkout status</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/analytics" className="group">
          <Card className="group-hover:shadow-lg transition-all group-hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold">View Analytics</h3>
                  <p className="text-sm text-gray-600">Detailed reports and trends</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Activity (Last 7 days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentRentals.length > 0 ? (
            <div className="space-y-3">
              {recentRentals.slice(0, 5).map((rental) => (
                <div key={rental.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Gear ID: {rental.gear_id}</p>
                    <p className="text-sm text-gray-600">
                      Rented on {new Date(rental.lent_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-sm">
                    Due: {rental.due_date ? new Date(rental.due_date).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              ))}
              {recentRentals.length > 5 && (
                <Link href="/admin/rentals" className="block text-center text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View all recent rentals →
                </Link>
              )}
            </div>
          ) : (
            <p className="text-gray-600">No recent rental activity</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import { createClient } from "@/utils/supabase/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, BarChart3, PieChart, Users, Package } from "lucide-react";
import AdminAnalytics from "@/components/admin/AdminAnalytics";
import MembershipGrowthChart from "@/components/admin/MembershipGrowthChart";
import GearUtilizationChart from "@/components/admin/GearUtilizationChart";
import OverdueAnalysis from "@/components/admin/OverdueAnalysis";

export default async function AnalyticsPage() {
  const supabase = await createClient();

  // Fetch comprehensive data for analytics
  const [
    { data: allLentItems, error: lentError },
    { data: allMembers, error: membersError },
    { data: allGear, error: gearError },
  ] = await Promise.all([
    supabase
      .from("Lent")
      .select("id, lent_date, due_date, gear_id, user_id, returned")
      .order("lent_date", { ascending: true }),
    supabase
      .from("Membership")
      .select("user_id, joined_on, valid, admin, name")
      .order("joined_on", { ascending: true }),
    supabase
      .from("Gear")
      .select("id, name, num_available, category, price_tu_th, price_th_tu, price_week, description, total_times_rented, revenue_generated")
      .order("category", { ascending: true }),
  ]);

  if (lentError || membersError || gearError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">
              Error loading analytics data: {lentError?.message || membersError?.message || gearError?.message}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const lentItems = allLentItems || [];
  const members = allMembers || [];
  const gear = allGear || [];

  // Calculate key metrics
  const now = new Date();
  const activeRentals = lentItems.filter(item => !item.returned);
  const overdueRentals = activeRentals.filter(item => 
    item.due_date && new Date(item.due_date) < now
  );
  const totalRentals = lentItems.length;
  const completedRentals = lentItems.filter(item => item.returned);

  // Calculate time-based metrics
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentRentals = lentItems.filter(item => 
    item.lent_date && new Date(item.lent_date) >= thirtyDaysAgo
  );

  const recentMembers = members.filter(member => 
    member.joined_on && new Date(member.joined_on) >= thirtyDaysAgo
  );

  // Calculate utilization rates
  const gearUtilization = gear.map(gearItem => {
    const rentalCount = lentItems.filter(rental => 
      rental.gear_id === gearItem.id
    ).length;
    
    const activeRentalCount = activeRentals.filter(rental => 
      rental.gear_id === gearItem.id
    ).length;

    return {
      ...gearItem,
      totalRentals: rentalCount,
      currentlyRented: activeRentalCount,
      utilizationScore: rentalCount // Simple utilization score
    };
  }).sort((a, b) => b.utilizationScore - a.utilizationScore);

  // Category performance
  const categoryStats = gear.reduce((acc, gearItem) => {
    const category = gearItem.category || 'Unknown';
    if (!acc[category]) {
      acc[category] = {
        totalItems: 0,
        availableItems: 0,
        totalRentals: 0,
        activeRentals: 0
      };
    }
    
    acc[category].totalItems++;
    acc[category].availableItems += gearItem.num_available || 0;
    
    const itemRentals = lentItems.filter(rental => rental.gear_id === gearItem.id);
    acc[category].totalRentals += itemRentals.length;
    acc[category].activeRentals += activeRentals.filter(rental => rental.gear_id === gearItem.id).length;
    
    return acc;
  }, {} as Record<string, any>);

  const categoryPerformance = Object.entries(categoryStats).map(([category, stats]) => ({
    category,
    ...stats,
    utilizationRate: stats.totalItems > 0 ? Math.round((stats.activeRentals / stats.totalItems) * 100) : 0,
    averageRentalsPerItem: stats.totalItems > 0 ? Math.round((stats.totalRentals / stats.totalItems) * 10) / 10 : 0
  })).sort((a, b) => b.utilizationRate - a.utilizationRate);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-2">Comprehensive insights and performance metrics</p>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rentals</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalRentals}</div>
            <p className="text-xs text-gray-600">
              {recentRentals.length} in last 30 days
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {totalRentals > 0 ? Math.round((completedRentals.length / totalRentals) * 100) : 0}%
            </div>
            <p className="text-xs text-gray-600">
              {completedRentals.length} of {totalRentals} returned
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Member Growth</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{members.length}</div>
            <p className="text-xs text-gray-600">
              +{recentMembers.length} new members
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Utilization</CardTitle>
            <Package className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {categoryPerformance.length > 0 
                ? Math.round(categoryPerformance.reduce((acc, cat) => acc + cat.utilizationRate, 0) / categoryPerformance.length)
                : 0}%
            </div>
            <p className="text-xs text-gray-600">
              Across all categories
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Category Performance Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryPerformance.map((category, index) => {
              const colors = ["border-blue-500", "border-green-500", "border-purple-500", "border-orange-500", "border-red-500", "border-yellow-500"];
              return (
                <div key={category.category} className={`p-4 border-l-4 ${colors[index % colors.length]} bg-gray-50 rounded-r-lg`}>
                  <h4 className="font-semibold capitalize text-lg">{category.category}</h4>
                  <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                    <div>
                      <span className="text-gray-600">Items:</span>
                      <p className="font-bold">{category.totalItems}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Available:</span>
                      <p className="font-bold text-green-600">{category.availableItems}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Rentals:</span>
                      <p className="font-bold">{category.totalRentals}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Utilization:</span>
                      <p className="font-bold text-orange-600">{category.utilizationRate}%</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full" 
                        style={{ width: `${category.utilizationRate}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {category.averageRentalsPerItem} avg rentals per item
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analytics Components */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <MembershipGrowthChart members={members} />
        <GearUtilizationChart gearUtilization={gearUtilization.slice(0, 10)} />
      </div>

      <OverdueAnalysis rentals={lentItems} overdueRentals={overdueRentals} />

      {/* Original Detailed Analytics */}
      <AdminAnalytics 
        lentItems={lentItems} 
        members={members} 
        gear={gear} 
      />
    </div>
  );
}
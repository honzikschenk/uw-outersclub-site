"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, Calendar, User, Package2 } from "lucide-react";
import { useMemo } from "react";

interface AdminAnalyticsProps {
  lentItems: any[];
  members: any[];
  gear: any[];
}

export default function AdminAnalytics({ lentItems, members, gear }: AdminAnalyticsProps) {
  const analytics = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    // Rental analytics
    const recentRentals = lentItems.filter(
      (item) => item.lent_date && new Date(item.lent_date) >= sevenDaysAgo,
    );

    const popularGear = gear
      .map((item) => {
        const rentalCount = lentItems.filter((rental) => rental.gear_id === item.id).length;
        return { ...item, rentalCount };
      })
      .sort((a, b) => b.rentalCount - a.rentalCount)
      .slice(0, 5);

    // Member analytics
    const newMembers = members.filter(
      (member) => member.joined_on && new Date(member.joined_on) >= thirtyDaysAgo,
    );

    // Category analytics
    const categoryStats = gear.reduce(
      (acc: Record<string, { total: number; available: number }>, item: any) => {
        const category = item.category || "Uncategorized";
        if (!acc[category]) {
          acc[category] = { total: 0, available: 0 };
        }
        acc[category].total++;
        acc[category].available += item.unit_count ?? item.num_available ?? 0;
        return acc;
      },
      {},
    );

    // Rental trends - removed basic version since we have RentalChart component

    return {
      recentRentals: recentRentals.length,
      popularGear,
      newMembers: newMembers.length,
      categoryStats,
    };
  }, [lentItems, members, gear]);

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold">Analytics Overview</h3>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Rentals</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.recentRentals}</div>
            <p className="text-xs text-muted-foreground">In the last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Members</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.newMembers}</div>
            <p className="text-xs text-muted-foreground">In the last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gear Categories</CardTitle>
            <Package2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(analytics.categoryStats).length}</div>
            <p className="text-xs text-muted-foreground">Active categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Popular Gear */}
      <Card>
        <CardHeader>
          <CardTitle>Most Popular Gear</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.popularGear.map((item, index) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{item.rentalCount} rentals</p>
                  <p className="text-sm text-muted-foreground">
                    {(item.unit_count ?? item.num_available ?? 0)
                      ? `${item.unit_count ?? item.num_available} units`
                      : "No units"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Gear by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(analytics.categoryStats).map(([category, stats]) => (
              <div key={category} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium capitalize">{category}</span>
                  <span className="text-sm text-muted-foreground">
                    {stats.available}/{stats.total} available
                  </span>
                </div>
                <progress
                  value={(stats.available / stats.total) * 100}
                  max={100}
                  className="w-full h-2 rounded-full overflow-hidden [&::-webkit-progress-bar]:bg-gray-200 [&::-webkit-progress-value]:bg-green-500 [&::-moz-progress-bar]:bg-green-500"
                  aria-label={`Availability ${Math.round((stats.available / stats.total) * 100)}%`}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

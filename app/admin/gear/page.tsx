import { createClient } from "@/utils/supabase/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Plus, Archive, CheckCircle, XCircle, TrendingUp } from "lucide-react";
import GearGrid from "@/components/admin/GearGrid";
import GearCategoryChart from "@/components/admin/GearCategoryChart";

export default async function GearPage() {
  const supabase = await createClient();

  // Fetch all gear with usage statistics
  const [
    { data: allGear, error: gearError },
    { data: rentalData, error: rentalError }
  ] = await Promise.all([
    supabase
      .from("Gear")
      .select("id, name, num_available, category, price_tu_th, price_th_tu, price_week, description, total_times_rented, revenue_generated")
      .order("category", { ascending: true }),
    supabase
      .from("Lent")
      .select("gear_id, lent_date, returned")
  ]);

  if (gearError || rentalError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Gear Management</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">
              Error loading gear data: {gearError?.message || rentalError?.message}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const gear = allGear || [];
  const rentals = rentalData || [];

  // Calculate gear statistics
  const totalGear = gear.length;
  const totalAvailableUnits = gear.reduce((sum, g) => sum + (g.num_available || 0), 0);
  const currentlyRentedCount = rentals.filter(r => !r.returned).length;
  
  // Group gear by category
  const categories = Array.from(new Set(gear.map(g => g.category))).filter(Boolean);
  const categoryStats = categories.map(category => {
    const categoryGear = gear.filter(g => g.category === category);
    const totalUnits = categoryGear.reduce((sum, g) => sum + (g.num_available || 0), 0);
    const totalItems = categoryGear.length;
    const rentalCount = rentals.filter(r => 
      categoryGear.some(g => g.id === r.gear_id) && !r.returned
    ).length;
    
    return {
      category,
      total: totalItems,
      totalUnits,
      currentlyRented: rentalCount,
      availableUnits: Math.max(0, totalUnits - rentalCount),
      utilizationRate: totalUnits > 0 ? Math.round((rentalCount / totalUnits) * 100) : 0
    };
  });

  // Calculate most popular gear (by rental frequency)
  const gearRentalCounts = gear.map(g => {
    const rentalCount = rentals.filter(r => r.gear_id === g.id).length;
    return { ...g, rentalCount };
  }).sort((a, b) => b.rentalCount - a.rentalCount);

  const popularGear = gearRentalCounts.slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gear Management</h1>
          <p className="text-gray-600 mt-2">Manage equipment inventory and availability</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Add New Gear
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalGear}</div>
            <p className="text-xs text-gray-600">All gear items</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Units</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalAvailableUnits}</div>
            <p className="text-xs text-gray-600">Total units available</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currently Rented</CardTitle>
            <XCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{currentlyRentedCount}</div>
            <p className="text-xs text-gray-600">Units checked out</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Archive className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{categories.length}</div>
            <p className="text-xs text-gray-600">Gear categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Category Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryStats.map(cat => (
                <div key={cat.category} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium capitalize">{cat.category}</h4>
                    <span className="text-sm text-gray-600">{cat.utilizationRate}% utilized</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Items:</span>
                      <p className="font-bold">{cat.total}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Available:</span>
                      <p className="font-bold text-green-600">{cat.availableUnits}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Rented:</span>
                      <p className="font-bold text-orange-600">{cat.currentlyRented}</p>
                    </div>
                  </div>
                  <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${cat.utilizationRate}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Most Popular Gear
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {popularGear.map((item, index) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                    </div>
                    <div>
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-600 capitalize">{item.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{item.rentalCount}</p>
                    <p className="text-xs text-gray-600">rentals</p>
                  </div>
                </div>
              ))}
              {popularGear.length === 0 && (
                <p className="text-gray-600 text-center py-4">No rental data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Distribution Chart */}
      <GearCategoryChart categoryStats={categoryStats} />

      {/* Gear Grid */}
      <GearGrid gear={gear} />
    </div>
  );
}
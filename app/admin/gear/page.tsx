"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Plus, Archive, CheckCircle, XCircle, TrendingUp } from "lucide-react";
import GearGrid from "@/components/admin/GearGrid";
import GearCategoryChart from "@/components/admin/GearCategoryChart";
import GearEditModal from "@/components/admin/GearEditModal";

export default function GearPage() {
  const [gear, setGear] = useState<any[]>([]);
  const [rentals, setRentals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const supabase = createClient();

      const [{ data: allGear, error: gearError }, { data: rentalData, error: rentalError }] =
        await Promise.all([
          supabase
            .from("Gear")
            .select(
              "id, name, num_available, category, price_tu_th, price_th_tu, price_week, description, total_times_rented, revenue_generated",
            )
            .order("category", { ascending: true }),
          supabase.from("Lent").select("gear_id, lent_date, returned"),
        ]);

      if (gearError || rentalError) {
        setError(gearError?.message || rentalError?.message || "Unknown error");
        return;
      }

      // Fetch unit counts by gear_id from admin API (service role)
      let unitCounts: Record<number, { total_units: number; active_units: number }> = {};
      try {
        const res = await fetch("/api/admin/gear-items/counts", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          for (const row of json.data || []) {
            unitCounts[row.gear_id] = {
              total_units: row.total_units,
              active_units: row.active_units,
            };
          }
        }
      } catch {}

      // Merge counts into gear objects as unit_count (active units) and unit_count_total
      const mergedGear = (allGear || []).map((g) => ({
        ...g,
        unit_count_total: unitCounts[g.id]?.total_units ?? 0,
        unit_count: unitCounts[g.id]?.active_units ?? 0,
      }));

      setGear(mergedGear);
      setRentals(rentalData || []);
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewGear = () => {
    setIsAddModalOpen(true);
  };

  const handleSaveGear = async (gearData: any) => {
    try {
      // Remove the temporary ID for new gear creation
      const { id, ...gearDataWithoutId } = gearData;

      const response = await fetch("/api/admin/gear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gearDataWithoutId),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Gear saved successfully:", result);
        setIsAddModalOpen(false);
        // Reload data
        loadData();
      } else {
        const error = await response.json();
        console.error("Error saving gear:", error.error);
        alert(`Error saving gear: ${error.error}`);
      }
    } catch (error) {
      console.error("Error saving gear:", error);
      alert("Error saving gear. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Gear Management</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Gear Management</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">Error loading gear data: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate gear statistics
  const totalGear = gear.length;
  const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format
  const currentlyRentedCount = rentals.filter((r) => {
    const lentDate = new Date(r.lent_date).toISOString().split("T")[0];
    return !r.returned && lentDate <= today;
  }).length;
  const totalActiveUnits = gear.reduce(
    (sum, g: any) => sum + (g.unit_count ?? g.num_available ?? 0),
    0,
  );
  const totalAvailableUnits = Math.max(0, totalActiveUnits - currentlyRentedCount);

  // Group gear by category
  const categories = Array.from(new Set(gear.map((g) => g.category))).filter(Boolean);
  const categoryStats = categories.map((category) => {
    const categoryGear = gear.filter((g) => g.category === category);
    const totalUnits = categoryGear.reduce(
      (sum, g: any) => sum + (g.unit_count ?? g.num_available ?? 0),
      0,
    );
    const totalItems = categoryGear.length;
    const rentalCount = rentals.filter((r) => {
      const lentDate = new Date(r.lent_date).toISOString().split("T")[0];
      return categoryGear.some((g) => g.id === r.gear_id) && !r.returned && lentDate <= today;
    }).length;

    return {
      category,
      total: totalItems,
      totalUnits,
      currentlyRented: rentalCount,
      availableUnits: Math.max(0, totalUnits - rentalCount),
      utilizationRate: totalUnits > 0 ? Math.round((rentalCount / totalUnits) * 100) : 0,
    };
  });

  // Calculate most popular gear (by rental frequency)
  const gearRentalCounts = gear
    .map((g) => {
      const rentalCount = rentals.filter((r) => r.gear_id === g.id).length;
      return { ...g, rentalCount };
    })
    .sort((a, b) => b.rentalCount - a.rentalCount);

  const popularGear = gearRentalCounts.slice(0, 5);

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Gear Management</h1>
          <p className="text-gray-600 mt-2">Manage equipment inventory and availability</p>
        </div>
        <Button
          className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
          onClick={handleAddNewGear}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Gear
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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
            <CardTitle className="text-sm font-medium">Current Units</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalAvailableUnits}</div>
            <p className="text-xs text-gray-600">Total units available currently</p>
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
      <div className="grid grid-cols-1 gap-8">
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
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
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
      <GearGrid gear={gear} existingCategories={categories} />

      {/* Add New Gear Modal */}
      <GearEditModal
        gear={{
          id: Date.now(),
          name: "",
          category: "",
          num_available: 0,
          description: "",
          price_tu_th: null,
          price_th_tu: null,
          price_week: null,
          total_times_rented: 0,
          revenue_generated: 0,
        }}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveGear}
        existingCategories={categories}
      />
    </div>
  );
}

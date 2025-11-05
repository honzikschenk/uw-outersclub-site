"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Plus, Archive, CheckCircle, XCircle } from "lucide-react";
import GearGrid from "@/components/admin/GearGrid";
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

  // Group gear by category (names only for summary card)
  const categories = Array.from(new Set(gear.map((g) => g.category))).filter(Boolean);

  // Note: Additional analytics (e.g., popularity, category charts) were removed to simplify this page.

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

      {/* Additional analytics removed; keeping stats cards and management grid only. */}

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

"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Package, TrendingUp } from "lucide-react";

interface GearUtilization {
  id: number;
  name: string;
  category: string;
  available: boolean;
  description: string | null;
  totalRentals: number;
  currentlyRented: number;
  utilizationScore: number;
}

interface GearUtilizationChartProps {
  gearUtilization: GearUtilization[];
}

export default function GearUtilizationChart({ gearUtilization }: GearUtilizationChartProps) {
  const maxScore = Math.max(...gearUtilization.map(g => g.utilizationScore), 1);

  const colors = [
    "bg-blue-500",
    "bg-green-500", 
    "bg-purple-500",
    "bg-orange-500",
    "bg-red-500",
    "bg-yellow-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
    "bg-gray-500"
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Top Performing Gear
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {gearUtilization.length > 0 ? gearUtilization[0].totalRentals : 0}
              </p>
              <p className="text-sm text-gray-600">Most Rented Item</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {gearUtilization.reduce((acc, item) => acc + item.totalRentals, 0)}
              </p>
              <p className="text-sm text-gray-600">Total Rentals</p>
            </div>
          </div>

          {/* Top Items Chart */}
          <div className="space-y-4">
            <h4 className="font-medium">Most Popular Items</h4>
            {gearUtilization.length > 0 ? (
              gearUtilization.map((item, index) => (
                <div key={item.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${colors[index % colors.length]}`}></div>
                      <div>
                        <span className="font-medium text-sm">{item.name}</span>
                        <p className="text-xs text-gray-600 capitalize">{item.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold">{item.totalRentals}</span>
                      <p className="text-xs text-gray-600">rentals</p>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${colors[index % colors.length]}`}
                        style={{ width: `${(item.totalRentals / maxScore) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>
                        {item.available ? 'Available' : 'Currently rented'}
                      </span>
                      <span>
                        Score: {item.utilizationScore}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No gear utilization data available
              </div>
            )}
          </div>

          {gearUtilization.length > 0 && (
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Showing top {Math.min(gearUtilization.length, 10)} items</span>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Ranked by total rentals</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
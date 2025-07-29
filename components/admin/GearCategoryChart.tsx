"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PieChart, BarChart3 } from "lucide-react";

interface CategoryStat {
  category: string;
  total: number;
  totalUnits: number;
  currentlyRented: number;
  availableUnits: number;
  utilizationRate: number;
}

interface GearCategoryChartProps {
  categoryStats: CategoryStat[];
}

export default function GearCategoryChart({ categoryStats }: GearCategoryChartProps) {
  const maxTotal = Math.max(...categoryStats.map(c => c.total));
  const colors = [
    "bg-blue-500",
    "bg-green-500", 
    "bg-purple-500",
    "bg-orange-500",
    "bg-red-500",
    "bg-yellow-500",
    "bg-pink-500",
    "bg-indigo-500"
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Category Distribution Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Category Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryStats.map((cat, index) => (
              <div key={cat.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize text-sm">{cat.category}</span>
                  <span className="text-sm text-gray-600">{cat.total} items</span>
                </div>
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${colors[index % colors.length]}`}
                      style={{ width: `${maxTotal > 0 ? (cat.total / maxTotal) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>Available: {cat.availableUnits}</span>
                    <span>Rented: {cat.currentlyRented}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Utilization Rate Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Utilization Rates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryStats.map((cat, index) => (
              <div key={cat.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${colors[index % colors.length]}`}></div>
                  <div>
                    <p className="font-medium capitalize text-sm">{cat.category}</p>
                    <p className="text-xs text-gray-600">{cat.total} total items</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{cat.utilizationRate}%</p>
                  <p className="text-xs text-gray-600">utilized</p>
                </div>
              </div>
            ))}
          </div>
          
          {categoryStats.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No category data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
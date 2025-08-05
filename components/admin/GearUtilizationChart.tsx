"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Package, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface GearUtilization {
  id: number;
  name: string;
  category: string;
  num_available: number;
  description: string | null;
  price_tu_th: number | null;
  price_th_tu: number | null;
  price_week: number | null;
  total_times_rented: number | null;
  revenue_generated: number | null;
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
    "#3b82f6",
    "#10b981", 
    "#8b5cf6",
    "#f59e0b",
    "#ef4444",
    "#eab308",
    "#ec4899",
    "#6366f1",
    "#14b8a6",
    "#6b7280"
  ];

  // Prepare data for charts
  const chartData = gearUtilization.map((item, index) => ({
    name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
    fullName: item.name,
    category: item.category,
    totalRentals: item.totalRentals,
    currentlyRented: item.currentlyRented,
    available: item.num_available || 0,
    utilizationScore: item.utilizationScore,
    fill: colors[index % colors.length]
  }));

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
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      type="number"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      type="category"
                      dataKey="name"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      width={120}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                              <p className="font-medium">{data.fullName}</p>
                              <p className="text-sm text-gray-600 capitalize">{data.category}</p>
                              <p className="text-blue-600">
                                {`Total Rentals: ${data.totalRentals}`}
                              </p>
                              <p className="text-orange-600">
                                {`Currently Rented: ${data.currentlyRented}`}
                              </p>
                              <p className="text-green-600">
                                {`Available: ${data.available}`}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="totalRentals" 
                      fill="#3b82f6"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
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
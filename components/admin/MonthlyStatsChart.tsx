"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, DollarSign, Package } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
  Legend,
} from "recharts";

interface MonthlyStats {
  id: number;
  month: string; // first day of the month
  total_revenue: number;
  total_items: number;
}

interface MonthlyStatsChartProps {
  monthlyStats: MonthlyStats[];
}

export default function MonthlyStatsChart({ monthlyStats }: MonthlyStatsChartProps) {
  // Sort by month and prepare data for charts
  const sortedStats = monthlyStats
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
    .map((stat) => ({
      ...stat,
      monthLabel: new Date(stat.month).toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      }),
      fullDate: new Date(stat.month),
    }));

  // Get the last 12 months of data
  const last12Months = sortedStats.slice(-12);

  const maxRevenue = Math.max(...last12Months.map((d) => d.total_revenue), 1);
  const maxItems = Math.max(...last12Months.map((d) => d.total_items), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Monthly Revenue and Items Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Monthly Rental Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={last12Months}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthLabel" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  yAxisId="revenue"
                  orientation="left"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <YAxis
                  yAxisId="items"
                  orientation="right"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                          <p className="font-medium">{`${label}`}</p>
                          <p className="text-green-600">
                            {`Revenue: $${payload.find((p) => p.dataKey === "total_revenue")?.value?.toFixed(2) || 0}`}
                          </p>
                          <p className="text-blue-600">
                            {`Items Rented: ${payload.find((p) => p.dataKey === "total_items")?.value || 0}`}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar
                  yAxisId="items"
                  dataKey="total_items"
                  fill="#3b82f6"
                  name="Items Rented"
                  opacity={0.7}
                />
                <Line
                  yAxisId="revenue"
                  type="monotone"
                  dataKey="total_revenue"
                  stroke="#10b981"
                  strokeWidth={3}
                  name="Revenue ($)"
                  dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Monthly Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Items Rented</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Trend Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Revenue Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={last12Months}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthLabel" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const currentData = payload[0].payload;
                      const previousMonth = last12Months[last12Months.indexOf(currentData) - 1];
                      const growth = previousMonth
                        ? (
                            ((currentData.total_revenue - previousMonth.total_revenue) /
                              previousMonth.total_revenue) *
                            100
                          ).toFixed(1)
                        : "0";

                      return (
                        <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                          <p className="font-medium">{`${label}`}</p>
                          <p className="text-green-600">
                            {`Revenue: $${payload[0]?.value?.toFixed(2)}`}
                          </p>
                          <p className="text-gray-600">{`Growth: ${growth}%`}</p>
                          <p className="text-blue-600">{`Items: ${currentData.total_items}`}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="total_revenue"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {last12Months.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Revenue (12 months):</span>
                  <p className="font-bold text-green-600">
                    ${last12Months.reduce((sum, month) => sum + month.total_revenue, 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Average per Month:</span>
                  <p className="font-bold text-blue-600">
                    $
                    {(
                      last12Months.reduce((sum, month) => sum + month.total_revenue, 0) /
                      last12Months.length
                    ).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

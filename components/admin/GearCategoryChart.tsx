"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PieChart as PieChartIcon, BarChart3 } from "lucide-react";
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
  const colors = [
    "#3b82f6",
    "#10b981", 
    "#8b5cf6",
    "#f59e0b",
    "#ef4444",
    "#eab308",
    "#ec4899",
    "#6366f1"
  ];

  // Prepare data for charts
  const chartData = categoryStats.map((cat, index) => ({
    category: cat.category,
    total: cat.total,
    available: cat.availableUnits,
    rented: cat.currentlyRented,
    utilizationRate: cat.utilizationRate,
    fill: colors[index % colors.length]
  }));

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

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
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="category"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                          <p className="font-medium capitalize">{label}</p>
                          <p className="text-blue-600">
                            {`Total Items: ${data.total}`}
                          </p>
                          <p className="text-green-600">
                            {`Available: ${data.available}`}
                          </p>
                          <p className="text-orange-600">
                            {`Currently Rented: ${data.rented}`}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="total" 
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Utilization Rate Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Utilization Rates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                <Pie
                  data={categoryStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="utilizationRate"
                  nameKey="category"
                >
                  {categoryStats.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={colors[index % colors.length]} 
                  />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                    <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                      <p className="font-medium capitalize">{data.category}</p>
                      <p className="text-blue-600">
                      {`Utilization Rate: ${data.utilizationRate}%`}
                      </p>
                      <p className="text-gray-600">
                      {`${data.currentlyRented} of ${data.total} items rented`}
                      </p>
                    </div>
                    );
                  }
                  return null;
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value) => (
                  <span className="capitalize text-sm">{value}</span>
                  )}
                />
                </PieChart>
            </ResponsiveContainer>
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
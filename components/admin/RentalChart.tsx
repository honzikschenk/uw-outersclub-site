"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, Calendar, BarChart3 } from "lucide-react";
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
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface EnhancedRental {
  id: number;
  lent_date: string;
  due_date: string | null;
  gear_id: number;
  user_id: string;
  returned: boolean;
  gearName: string;
  gearCategory: string;
  userName: string;
  status: 'returned' | 'overdue' | 'active';
}

interface RentalChartProps {
  rentals: EnhancedRental[];
}

export default function RentalChart({ rentals }: RentalChartProps) {
  // Generate data for the last 12 months
  const now = new Date();
  const months = [];
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      fullDate: date
    });
  }

  // Calculate rental counts per month
  const monthlyData = months.map(({ month, fullDate }) => {
    const nextMonth = new Date(fullDate.getFullYear(), fullDate.getMonth() + 1, 1);
    
    const monthRentals = rentals.filter(rental => {
      const rentalDate = new Date(rental.lent_date);
      return rentalDate >= fullDate && rentalDate < nextMonth;
    });

    const activeCount = monthRentals.filter(r => !r.returned).length;
    const returnedCount = monthRentals.filter(r => r.returned).length;
    
    return {
      month,
      total: monthRentals.length,
      active: activeCount,
      returned: returnedCount,
      fullDate
    };
  });

  const maxTotal = Math.max(...monthlyData.map(d => d.total), 1);

  // Category breakdown for current month
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  
  const currentMonthRentals = rentals.filter(rental => {
    const rentalDate = new Date(rental.lent_date);
    return rentalDate >= currentMonth && rentalDate < nextMonth;
  });

  const categoryBreakdown = currentMonthRentals.reduce((acc, rental) => {
    const category = rental.gearCategory || 'Unknown';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryData = Object.entries(categoryBreakdown)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6); // Top 6 categories

  const maxCategoryCount = Math.max(...categoryData.map(d => d.count), 1);

  const colors = [
    "#3b82f6",
    "#10b981", 
    "#8b5cf6",
    "#f59e0b",
    "#ef4444",
    "#eab308"
  ];

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
      {/* Monthly Rental Trends */}
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
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
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
                          <p className="text-blue-600">
                            {`Total Rentals: ${payload[0]?.value}`}
                          </p>
                          <p className="text-green-600">
                            {`Returned: ${payload[1]?.value}`}
                          </p>
                          <p className="text-orange-600">
                            {`Active: ${payload[2]?.value}`}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="returned" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="active" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b', strokeWidth: 2, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Total Rentals</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Returned</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span>Active</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Current Month by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="category"
                >
                  {categoryData.map((entry, index) => (
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
                      {`${data.count} rentals`}
                      </p>
                      <p className="text-gray-600">
                      {`${((data.count / currentMonthRentals.length) * 100).toFixed(1)}% of total`}
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
                  payload={categoryData.map((entry, index) => ({
                  value: entry.category,
                  type: "square",
                  color: colors[index % colors.length],
                  }))}
                />
                </PieChart>
            </ResponsiveContainer>
          </div>
          
          {categoryData.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <p className="text-sm text-gray-600">
                Total rentals this month: {currentMonthRentals.length}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
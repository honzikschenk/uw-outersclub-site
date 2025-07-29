"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, Calendar, BarChart3 } from "lucide-react";

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
    "bg-blue-500",
    "bg-green-500", 
    "bg-purple-500",
    "bg-orange-500",
    "bg-red-500",
    "bg-yellow-500"
  ];

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
          <div className="space-y-4">
            {monthlyData.map((data, index) => (
              <div key={data.month} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{data.month}</span>
                  <span className="text-sm text-gray-600">{data.total} rentals</span>
                </div>
                <div className="relative">
                  {/* Total bar */}
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-500 h-3 rounded-full relative"
                      style={{ width: `${(data.total / maxTotal) * 100}%` }}
                    >
                      {/* Returned portion */}
                      <div 
                        className="bg-green-500 h-3 rounded-full absolute top-0 left-0"
                        style={{ width: data.total > 0 ? `${(data.returned / data.total) * 100}%` : '0%' }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>Active: {data.active}</span>
                    <span>Returned: {data.returned}</span>
                  </div>
                </div>
              </div>
            ))}
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
          <div className="space-y-4">
            {categoryData.length > 0 ? (
              categoryData.map((data, index) => (
                <div key={data.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm capitalize">{data.category}</span>
                    <span className="text-sm text-gray-600">{data.count} rentals</span>
                  </div>
                  <div className="relative">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${colors[index % colors.length]}`}
                        style={{ width: `${(data.count / maxCategoryCount) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No rentals this month
              </div>
            )}
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
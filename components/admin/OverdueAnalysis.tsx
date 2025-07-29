"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AlertTriangle, Calendar, TrendingDown } from "lucide-react";

interface Rental {
  id: number;
  lent_date: string;
  due_date: string | null;
  gear_id: number;
  user_id: string;
  returned: boolean;
}

interface OverdueAnalysisProps {
  rentals: Rental[];
  overdueRentals: Rental[];
}

export default function OverdueAnalysis({ rentals, overdueRentals }: OverdueAnalysisProps) {
  const now = new Date();

  // Calculate overdue patterns
  const overduePatterns = overdueRentals.map(rental => {
    const dueDate = rental.due_date ? new Date(rental.due_date) : null;
    const daysPastDue = dueDate ? Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    return {
      ...rental,
      daysPastDue
    };
  }).sort((a, b) => b.daysPastDue - a.daysPastDue);

  // Group overdue items by severity
  const severelyOverdue = overduePatterns.filter(r => r.daysPastDue > 14); // More than 2 weeks
  const moderatelyOverdue = overduePatterns.filter(r => r.daysPastDue > 7 && r.daysPastDue <= 14); // 1-2 weeks
  const recentlyOverdue = overduePatterns.filter(r => r.daysPastDue <= 7); // Within a week

  // Calculate overdue rate over time (last 6 months)
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      fullDate: date
    });
  }

  const monthlyOverdueData = months.map(({ month, fullDate }) => {
    const nextMonth = new Date(fullDate.getFullYear(), fullDate.getMonth() + 1, 1);
    
    // Rentals that became overdue in this month
    const monthlyOverdue = rentals.filter(rental => {
      if (!rental.due_date) return false;
      const dueDate = new Date(rental.due_date);
      return dueDate >= fullDate && dueDate < nextMonth && dueDate < now && !rental.returned;
    });

    // Total rentals in this month
    const monthlyRentals = rentals.filter(rental => {
      const lentDate = new Date(rental.lent_date);
      return lentDate >= fullDate && lentDate < nextMonth;
    });

    const overdueRate = monthlyRentals.length > 0 
      ? Math.round((monthlyOverdue.length / monthlyRentals.length) * 100) 
      : 0;

    return {
      month,
      overdueCount: monthlyOverdue.length,
      totalRentals: monthlyRentals.length,
      overdueRate
    };
  });

  const maxOverdueCount = Math.max(...monthlyOverdueData.map(d => d.overdueCount), 1);
  const averageOverdueRate = monthlyOverdueData.length > 0
    ? Math.round(monthlyOverdueData.reduce((acc, d) => acc + d.overdueRate, 0) / monthlyOverdueData.length)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Overdue Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Overdue Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-red-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-red-600">{overdueRentals.length}</p>
              <p className="text-sm text-gray-600">Total Overdue</p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-orange-600">{severelyOverdue.length}</p>
              <p className="text-sm text-gray-600">14+ Days</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-yellow-600">{moderatelyOverdue.length}</p>
              <p className="text-sm text-gray-600">7-14 Days</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-600">{averageOverdueRate}%</p>
              <p className="text-sm text-gray-600">Avg Rate</p>
            </div>
          </div>

          {/* Overdue Trends */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Monthly Overdue Trends
            </h4>
            {monthlyOverdueData.map((data, index) => (
              <div key={data.month} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{data.month}</span>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-600">{data.overdueCount} overdue</span>
                    <span className="text-red-600">{data.overdueRate}% rate</span>
                  </div>
                </div>
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-red-500 h-3 rounded-full"
                      style={{ width: `${(data.overdueCount / maxOverdueCount) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Most Overdue Items */}
          {overduePatterns.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Most Overdue Items
              </h4>
              <div className="space-y-3">
                {overduePatterns.slice(0, 5).map((rental, index) => (
                  <div key={rental.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-red-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">Gear ID: {rental.gear_id}</p>
                        <p className="text-sm text-gray-600">
                          Due: {rental.due_date ? new Date(rental.due_date).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">{rental.daysPastDue}</p>
                      <p className="text-xs text-gray-600">days overdue</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {overdueRentals.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No overdue items! Great job keeping track of rentals.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
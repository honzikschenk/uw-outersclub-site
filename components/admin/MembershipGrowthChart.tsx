"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, Users } from "lucide-react";

interface Member {
  user_id: string;
  name: string | null;
  joined_on: string | null;
  valid: boolean;
  admin: boolean;
}

interface MembershipGrowthChartProps {
  members: Member[];
}

export default function MembershipGrowthChart({ members }: MembershipGrowthChartProps) {
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

  // Calculate cumulative membership growth
  let cumulativeCount = 0;
  const growthData = months.map(({ month, fullDate }) => {
    const nextMonth = new Date(fullDate.getFullYear(), fullDate.getMonth() + 1, 1);
    
    // Count members who joined before this month
    const membersJoinedByMonth = members.filter(member => {
      if (!member.joined_on) return false;
      const joinDate = new Date(member.joined_on);
      return joinDate < nextMonth;
    }).length;

    // Count new members in this specific month
    const newMembersThisMonth = members.filter(member => {
      if (!member.joined_on) return false;
      const joinDate = new Date(member.joined_on);
      return joinDate >= fullDate && joinDate < nextMonth;
    }).length;

    return {
      month,
      total: membersJoinedByMonth,
      newMembers: newMembersThisMonth,
      active: members.filter(member => {
        if (!member.joined_on) return false;
        const joinDate = new Date(member.joined_on);
        return joinDate < nextMonth && member.valid;
      }).length
    };
  });

  const maxTotal = Math.max(...growthData.map(d => d.total), 1);
  const maxNew = Math.max(...growthData.map(d => d.newMembers), 1);

  // Calculate growth rate
  const currentTotal = growthData[growthData.length - 1]?.total || 0;
  const previousTotal = growthData[growthData.length - 2]?.total || 0;
  const growthRate = previousTotal > 0 ? Math.round(((currentTotal - previousTotal) / previousTotal) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Membership Growth
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Key Stats */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{currentTotal}</p>
              <p className="text-sm text-gray-600">Total Members</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {growthData[growthData.length - 1]?.newMembers || 0}
              </p>
              <p className="text-sm text-gray-600">New This Month</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {growthRate > 0 ? '+' : ''}{growthRate}%
              </p>
              <p className="text-sm text-gray-600">Growth Rate</p>
            </div>
          </div>

          {/* Growth Chart */}
          <div className="space-y-4">
            <h4 className="font-medium">Monthly Membership Trends</h4>
            {growthData.map((data, index) => (
              <div key={data.month} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{data.month}</span>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-600">Total: {data.total}</span>
                    <span className="text-green-600">+{data.newMembers} new</span>
                  </div>
                </div>
                <div className="relative">
                  {/* Total membership bar */}
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-500 h-3 rounded-full relative"
                      style={{ width: `${(data.total / maxTotal) * 100}%` }}
                    >
                      {/* Active members portion */}
                      <div 
                        className="bg-green-500 h-3 rounded-full absolute top-0 left-0"
                        style={{ width: data.total > 0 ? `${(data.active / data.total) * 100}%` : '0%' }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* New members indicator */}
                  {data.newMembers > 0 && (
                    <div className="mt-1 relative">
                      <div className="w-full bg-gray-100 rounded-full h-1">
                        <div 
                          className="bg-orange-400 h-1 rounded-full"
                          style={{ width: `${(data.newMembers / maxNew) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 text-sm pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Total Members</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Active Members</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
              <span>New Members</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
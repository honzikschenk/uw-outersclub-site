"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, Users } from "lucide-react";
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
} from "recharts";

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
      month: date.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      fullDate: date,
    });
  }

  // Calculate cumulative membership growth
  let cumulativeCount = 0;
  const growthData = months.map(({ month, fullDate }) => {
    const nextMonth = new Date(fullDate.getFullYear(), fullDate.getMonth() + 1, 1);

    // Count members who joined before this month
    const membersJoinedByMonth = members.filter((member) => {
      if (!member.joined_on) return false;
      const joinDate = new Date(member.joined_on);
      return joinDate < nextMonth;
    }).length;

    // Count new members in this specific month
    const newMembersThisMonth = members.filter((member) => {
      if (!member.joined_on) return false;
      const joinDate = new Date(member.joined_on);
      return joinDate >= fullDate && joinDate < nextMonth;
    }).length;

    return {
      month,
      total: membersJoinedByMonth,
      newMembers: newMembersThisMonth,
      active: members.filter((member) => {
        if (!member.joined_on) return false;
        const joinDate = new Date(member.joined_on);
        return joinDate < nextMonth && member.valid;
      }).length,
    };
  });

  const maxTotal = Math.max(...growthData.map((d) => d.total), 1);
  const maxNew = Math.max(...growthData.map((d) => d.newMembers), 1);

  // Calculate growth rate
  const currentTotal = growthData[growthData.length - 1]?.total || 0;
  const previousTotal = growthData[growthData.length - 2]?.total || 0;
  const growthRate =
    previousTotal > 0 ? Math.round(((currentTotal - previousTotal) / previousTotal) * 100) : 0;

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
              <p
                className={`text-2xl font-bold ${growthRate >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {growthRate > 0 ? "+" : ""}
                {growthRate}%
              </p>
              <p className="text-sm text-gray-600">Growth Rate</p>
            </div>
          </div>

          {/* Growth Chart */}
          <div className="space-y-4">
            <h4 className="font-medium">Monthly Membership Trends</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                            <p className="font-medium">{`${label}`}</p>
                            <p className="text-blue-600">{`Total Members: ${payload[0]?.value}`}</p>
                            <p className="text-green-600">
                              {`Active Members: ${payload[1]?.value}`}
                            </p>
                            <p className="text-orange-600">{`New Members: ${payload[2]?.value}`}</p>
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
                    dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="active"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981", strokeWidth: 2, r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="newMembers"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ fill: "#f59e0b", strokeWidth: 2, r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Additional Bar Chart for New Members */}
            <div className="h-48 mt-6">
              <h4 className="font-medium mb-3">New Members by Month</h4>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                            <p className="font-medium">{`${label}`}</p>
                            <p className="text-orange-600">{`New Members: ${payload[0]?.value}`}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="newMembers" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
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

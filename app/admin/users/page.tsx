import { createClient } from "@/utils/supabase/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, UserX, Shield, Calendar, Search, Filter } from "lucide-react";
import UserManagementTable from "@/components/admin/UserManagementTable";

export default async function UsersPage() {
  const supabase = await createClient();

  // Fetch all members with detailed information
  const { data: allMembers, error: membersError } = await supabase
    .from("Membership")
    .select("user_id, name, joined_on, valid, admin")
    .order("joined_on", { ascending: false });

  if (membersError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">Error loading members: {membersError.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const members = allMembers || [];
  const activeMembers = members.filter(m => m.valid);
  const inactiveMembers = members.filter(m => !m.valid);
  const adminMembers = members.filter(m => m.admin);

  // Calculate recent joiners (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentJoiners = members.filter(m => 
    m.joined_on && new Date(m.joined_on) >= thirtyDaysAgo
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage member accounts and permissions</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Users className="h-4 w-4 mr-2" />
          Add New Member
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{members.length}</div>
            <p className="text-xs text-gray-600">All registered users</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeMembers.length}</div>
            <p className="text-xs text-gray-600">Valid memberships</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{adminMembers.length}</div>
            <p className="text-xs text-gray-600">Admin privileges</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Joiners</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{recentJoiners.length}</div>
            <p className="text-xs text-gray-600">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-600" />
              Active Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">{activeMembers.length}</div>
            <div className="space-y-2">
              {activeMembers.slice(0, 3).map((member) => (
                <div key={member.user_id} className="flex items-center justify-between text-sm">
                  <span>{member.name || 'Unknown'}</span>
                  <div className="flex gap-1">
                    <Badge variant="secondary" className="text-xs">Active</Badge>
                    {member.admin && <Badge variant="destructive" className="text-xs">Admin</Badge>}
                  </div>
                </div>
              ))}
              {activeMembers.length > 3 && (
                <p className="text-xs text-gray-600">+{activeMembers.length - 3} more</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserX className="h-5 w-5 text-red-600" />
              Inactive Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 mb-2">{inactiveMembers.length}</div>
            <div className="space-y-2">
              {inactiveMembers.slice(0, 3).map((member) => (
                <div key={member.user_id} className="flex items-center justify-between text-sm">
                  <span>{member.name || 'Unknown'}</span>
                  <Badge variant="outline" className="text-xs">Inactive</Badge>
                </div>
              ))}
              {inactiveMembers.length > 3 && (
                <p className="text-xs text-gray-600">+{inactiveMembers.length - 3} more</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              Recent Joiners
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 mb-2">{recentJoiners.length}</div>
            <div className="space-y-2">
              {recentJoiners.slice(0, 3).map((member) => (
                <div key={member.user_id} className="flex items-center justify-between text-sm">
                  <span>{member.name || 'Unknown'}</span>
                  <span className="text-xs text-gray-600">
                    {member.joined_on ? new Date(member.joined_on).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              ))}
              {recentJoiners.length > 3 && (
                <p className="text-xs text-gray-600">+{recentJoiners.length - 3} more</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Members Table */}
      <UserManagementTable members={members} />
    </div>
  );
}
"use client";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import UserEditModal from "./UserEditModal";
import { 
  Search, 
  Filter, 
  ChevronDown, 
  Edit, 
  MoreHorizontal,
  Shield,
  ShieldCheck,
  UserCheck,
  UserX
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Member {
  user_id: string;
  name: string | null;
  joined_on: string | null;
  valid: boolean;
  admin: boolean;
}

interface UserManagementTableProps {
  members: Member[];
}

export default function UserManagementTable({ members }: UserManagementTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "admin">("all");
  const [sortField, setSortField] = useState<keyof Member>("joined_on");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedUser, setSelectedUser] = useState<Member | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Filter and sort members
  const filteredMembers = members.filter((member) => {
    const matchesSearch = !searchTerm || 
      (member.name && member.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      member.user_id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = 
      filterStatus === "all" ||
      (filterStatus === "active" && member.valid) ||
      (filterStatus === "inactive" && !member.valid) ||
      (filterStatus === "admin" && member.admin);

    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];

    // Handle date sorting
    if (sortField === "joined_on") {
      aVal = aVal ? new Date(aVal).getTime() : 0;
      bVal = bVal ? new Date(bVal).getTime() : 0;
    }

    // Handle string sorting
    if (typeof aVal === "string" && typeof bVal === "string") {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    // Handle null values
    if (aVal === null || aVal === undefined) aVal = 0;
    if (bVal === null || bVal === undefined) bVal = 0;

    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (field: keyof Member) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleMemberAction = async (action: string, memberId: string) => {
    const member = members.find(m => m.user_id === memberId);
    
    if ((action === "view" || action === "edit") && member) {
      setSelectedUser(member);
      setIsEditModalOpen(true);
    } else {
      console.log(`${action} for member ${memberId}`);
      // TODO: Implement other actions like toggle status/admin
    }
  };

  const handleSaveUser = async (updatedUser: Member) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedUser),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("User saved successfully:", result);
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        const error = await response.json();
        console.error("Error saving user:", error.error);
        alert(`Error saving user: ${error.error}`);
      }
    } catch (error) {
      console.error("Error saving user:", error);
      alert("Error saving user. Please try again.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-lg md:text-xl">Member Directory</CardTitle>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 w-full sm:w-auto">
                  <Filter className="h-4 w-4" />
                  Filter
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilterStatus("all")}>
                  All Members
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("active")}>
                  Active Only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("inactive")}>
                  Inactive Only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("admin")}>
                  Admins Only
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Mobile Card View */}
        <div className="block md:hidden">
          <div className="space-y-4 p-4">
            {filteredMembers.map((member) => (
              <div key={member.user_id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {(member.name || member.user_id.substring(0, 2)).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {member.name || "Unknown"}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">
                        {member.user_id.substring(0, 8)}...
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleMemberAction("view", member.user_id)}>
                        <Edit className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleMemberAction("toggle-status", member.user_id)}>
                        {member.valid ? (
                          <>
                            <UserX className="h-4 w-4 mr-2" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleMemberAction("toggle-admin", member.user_id)}>
                        {member.admin ? (
                          <>
                            <Shield className="h-4 w-4 mr-2" />
                            Remove Admin
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="h-4 w-4 mr-2" />
                            Make Admin
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="text-gray-600">
                    Joined: {member.joined_on 
                      ? new Date(member.joined_on).toLocaleDateString()
                      : "N/A"
                    }
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={member.valid ? "default" : "secondary"}
                    className={member.valid ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                  >
                    <div className="flex items-center gap-1">
                      {member.valid ? (
                        <UserCheck className="h-3 w-3" />
                      ) : (
                        <UserX className="h-3 w-3" />
                      )}
                      {member.valid ? "Active" : "Inactive"}
                    </div>
                  </Badge>
                  {member.admin ? (
                    <Badge variant="destructive">
                      <div className="flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        Admin
                      </div>
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <div className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        Member
                      </div>
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            {filteredMembers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No members found matching your criteria.
              </div>
            )}
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th 
                  className="text-left py-3 px-6 font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-2">
                    Name
                    {sortField === "name" && (
                      <span className="text-xs">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th className="text-left py-3 px-6 font-medium text-gray-500">User ID</th>
                <th 
                  className="text-left py-3 px-6 font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("joined_on")}
                >
                  <div className="flex items-center gap-2">
                    Joined Date
                    {sortField === "joined_on" && (
                      <span className="text-xs">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th className="text-left py-3 px-6 font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-6 font-medium text-gray-500">Role</th>
                <th className="text-left py-3 px-6 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => (
                <tr key={member.user_id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {(member.name || member.user_id.substring(0, 2)).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900">
                        {member.name || "Unknown"}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600 font-mono">
                    {member.user_id.substring(0, 8)}...
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">
                    {member.joined_on 
                      ? new Date(member.joined_on).toLocaleDateString()
                      : "N/A"
                    }
                  </td>
                  <td className="py-4 px-6">
                    <Badge 
                      variant={member.valid ? "default" : "secondary"}
                      className={member.valid ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                    >
                      <div className="flex items-center gap-1">
                        {member.valid ? (
                          <UserCheck className="h-3 w-3" />
                        ) : (
                          <UserX className="h-3 w-3" />
                        )}
                        {member.valid ? "Active" : "Inactive"}
                      </div>
                    </Badge>
                  </td>
                  <td className="py-4 px-6">
                    {member.admin ? (
                      <Badge variant="destructive">
                        <div className="flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" />
                          Admin
                        </div>
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <div className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          Member
                        </div>
                      </Badge>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleMemberAction("view", member.user_id)}>
                          <Edit className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleMemberAction("toggle-status", member.user_id)}>
                          {member.valid ? (
                            <>
                              <UserX className="h-4 w-4 mr-2" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleMemberAction("toggle-admin", member.user_id)}>
                          {member.admin ? (
                            <>
                              <Shield className="h-4 w-4 mr-2" />
                              Remove Admin
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="h-4 w-4 mr-2" />
                              Make Admin
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredMembers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No members found matching your criteria.
            </div>
          )}
        </div>
      </CardContent>

      {/* Edit Modal */}
      <UserEditModal
        user={selectedUser}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
        }}
        onSave={handleSaveUser}
      />
    </Card>
  );
}
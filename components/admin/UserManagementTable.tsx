"use client";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
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
  Users,
  UserCheck,
  Shield,
  Save,
  Trash2,
  CheckCircle
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
  const [selectedUser, setSelectedUser] = useState<Member | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Change tracking state for batch operations
  const [originalRows, setOriginalRows] = useState<Member[]>(members || []);
  const [editedRows, setEditedRows] = useState<Member[]>(members || []);
  const [editedRowIndices, setEditedRowIndices] = useState<Set<number>>(new Set());
  const [deletedRows, setDeletedRows] = useState<Set<number>>(new Set());

  useEffect(() => {
    setOriginalRows(members || []);
    setEditedRows(members || []);
    setEditedRowIndices(new Set());
    setDeletedRows(new Set());
  }, [members]);

  const handleDelete = (userId: string) => {
    const rowIndex = editedRows.findIndex(member => member.user_id === userId);
    if (rowIndex === -1) return;

    setDeletedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rowIndex)) {
        newSet.delete(rowIndex); // undelete
      } else {
        newSet.add(rowIndex); // mark for deletion
      }
      return newSet;
    });
  };

  const handleUserEdit = (userId: string) => {
    const member = editedRows.find(m => m.user_id === userId);
    if (member) {
      setSelectedUser(member);
      setIsEditModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    // Add a small delay to ensure proper cleanup
    setTimeout(() => {
      setSelectedUser(null);
    }, 100);
  };

  const handleSaveUser = (updatedUser: Member) => {
    // Update the edited rows with the new user data
    const userIndex = editedRows.findIndex(u => u.user_id === updatedUser.user_id);
    if (userIndex !== -1) {
      const updated = editedRows.map((row, idx) =>
        idx === userIndex ? updatedUser : row
      );
      setEditedRows(updated);
      
      // Check if this user was actually changed compared to original
      const original = originalRows[userIndex];
      let isEdited = false;
      if (original) {
        for (const key of Object.keys(updatedUser) as Array<keyof Member>) {
          if (updatedUser[key] !== original[key]) {
            isEdited = true;
            break;
          }
        }
      }
      
      setEditedRowIndices(prev => {
        const newSet = new Set(prev);
        if (isEdited) {
          newSet.add(userIndex);
        } else {
          newSet.delete(userIndex);
        }
        return newSet;
      });
    }
    // Use the new close handler
    handleCloseModal();
  };

  const handleSaveChanges = async () => {
    try {
      // Only allow admins to submit changes
      const resAuth = await fetch("/api/me");
      if (!resAuth.ok) {
        alert("Could not verify admin status. Please sign in again.");
        return;
      }
      let user: any = null;
      try {
        user = await resAuth.json();
      } catch {
        alert("Could not verify admin status. Please sign in again.");
        return;
      }
      if (!user?.admin) {
        alert("You do not have permission to make changes.");
        return;
      }

      // Check if user is trying to remove their own admin status
      const userChanges = editedRows.find(row => row.user_id === user.id);
      const originalUser = originalRows.find(row => row.user_id === user.id);
      if (userChanges && originalUser && originalUser.admin && !userChanges.admin) {
        if (!confirm("You are removing your own admin privileges. You will lose access to admin functions. Are you sure?")) {
          return;
        }
      }

      // Only send changed or deleted rows
      const changedRows = editedRows
        .map((row, idx) => ({ row, idx }))
        .filter(({ row, idx }) => {
          if (deletedRows.has(idx)) return false;
          const original = originalRows[idx];
          if (!original) return false;
          for (const key of Object.keys(row) as Array<keyof Member>) {
            if (row[key] !== original[key]) return true;
          }
          return false;
        })
        .map(({ row }) => row);

      const deletedRowIds = Array.from(deletedRows)
        .map(idx => originalRows[idx]?.user_id)
        .filter(Boolean);

      if (changedRows.length === 0 && deletedRowIds.length === 0) {
        alert("No changes to save.");
        return;
      }

      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalRows,
          editedRows: changedRows,
          deletedRowIds,
        }),
      });

      let result: any = {};
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        try {
          result = await res.json();
        } catch (jsonErr) {
          throw new Error("Server returned invalid JSON.");
        }
      } else {
        const text = await res.text();
        throw new Error(
          `Server returned an invalid response.\nStatus: ${res.status}\n${text.slice(0, 200)}`
        );
      }

      if (res.ok && result.success) {
        alert("Changes saved successfully!");
        window.location.reload();
      } else {
        let errorMsg = "Some changes failed to save.";
        if (result.errors && Array.isArray(result.errors)) {
          errorMsg += "\n" + result.errors.join("\n");
        } else if (result.error) {
          errorMsg += "\n" + result.error;
        } else if (result.message) {
          errorMsg += "\n" + result.message;
        }
        alert(errorMsg);
      }
    } catch (err: any) {
      alert("Network or server error: " + (err?.message || err));
    }
  };

  // Filter members
  const filteredMembers = editedRows.filter((member) => {
    const matchesSearch = !searchTerm || 
      (member.name && member.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      member.user_id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = 
      filterStatus === "all" ||
      (filterStatus === "active" && member.valid) ||
      (filterStatus === "inactive" && !member.valid) ||
      (filterStatus === "admin" && member.admin);

    return matchesSearch && matchesFilter;
  });

  const hasChanges = editedRowIndices.size > 0 || deletedRows.size > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg md:text-xl flex items-center gap-2">
              <Users className="h-5 w-5" />
              Member Management
            </CardTitle>
            
            {hasChanges && (
              <Button onClick={handleSaveChanges} className="bg-green-600 hover:bg-green-700">
                <Save className="h-4 w-4 mr-2" />
                Save Changes ({editedRowIndices.size + deletedRows.size})
              </Button>
            )}
          </div>
          
          {/* Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                  Status
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilterStatus("all")}>
                  All Members
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("active")}>
                  Active Members
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("inactive")}>
                  Inactive Members
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("admin")}>
                  Admin Members
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Grid View */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => {
            const originalIndex = editedRows.findIndex(r => r.user_id === member.user_id);
            const isEdited = editedRowIndices.has(originalIndex);
            const isDeleted = deletedRows.has(originalIndex);
            
            return (
              <Card 
                key={member.user_id} 
                className={`hover:shadow-lg transition-all duration-200 group ${
                  isDeleted ? 'bg-red-50 opacity-60 line-through' : 
                  isEdited ? 'bg-yellow-50 border-yellow-200' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-blue-600">
                          {(member.name || member.user_id).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <h3 className="font-semibold text-sm truncate">
                          {member.name || "Unnamed User"}
                        </h3>
                        <p className="text-xs text-gray-600 truncate">{member.user_id}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleUserEdit(member.user_id)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Member
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(member.user_id)}
                          className={isDeleted ? "text-green-600" : "text-red-600"}
                        >
                          {isDeleted ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Undo Delete
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Deactivate
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="mb-3 flex flex-wrap gap-1">
                    <Badge 
                      variant={member.valid ? "default" : "secondary"}
                      className={member.valid ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                    >
                      <UserCheck className="h-3 w-3 mr-1" />
                      {member.valid ? "Active" : "Inactive"}
                    </Badge>
                    
                    {member.admin && (
                      <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                        <Shield className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                  </div>
                  
                  {member.joined_on && (
                    <p className="text-xs text-gray-600">
                      Joined: {new Date(member.joined_on).toLocaleDateString()}
                    </p>
                  )}

                  {/* Show edit/delete indicators */}
                  {(isEdited || isDeleted) && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="flex items-center gap-1">
                        {isEdited && (
                          <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">
                            Modified
                          </Badge>
                        )}
                        {isDeleted && (
                          <Badge variant="outline" className="text-xs bg-red-100 text-red-800 border-red-300">
                            Marked for deletion
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {filteredMembers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No members found matching your criteria.
          </div>
        )}
      </CardContent>

      {/* Edit Modal */}
      {selectedUser && (
        <UserEditModal
          key={selectedUser.user_id}
          user={selectedUser}
          isOpen={isEditModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveUser}
        />
      )}
    </Card>
  );
}

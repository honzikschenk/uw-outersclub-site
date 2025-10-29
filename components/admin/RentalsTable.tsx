"use client";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import LoadMoreBar from "@/components/ui/load-more-bar";
import RentalEditModal from "./RentalEditModal";
import {
  Search,
  Filter,
  ChevronDown,
  Edit,
  MoreHorizontal,
  Calendar,
  Package,
  User,
  CheckCircle,
  AlertTriangle,
  Clock,
  Save,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EnhancedRental {
  id: number;
  lent_date: string;
  due_date: string | null;
  gear_id: number;
  gear_item_id?: number | string;
  user_id: string;
  returned: boolean;
  gearName: string;
  gearCategory: string;
  userName: string;
  status: "returned" | "overdue" | "active";
  gearItemCode?: string;
}

interface RentalsTableProps {
  rentals: EnhancedRental[];
}

export default function RentalsTable({ rentals }: RentalsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "overdue" | "returned">(
    "all",
  );
  const [selectedRental, setSelectedRental] = useState<EnhancedRental | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const PAGE_SIZE = 20;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Change tracking state for batch operations
  const [originalRows, setOriginalRows] = useState<EnhancedRental[]>(rentals || []);
  const [editedRows, setEditedRows] = useState<EnhancedRental[]>(rentals || []);
  const [editedRowIndices, setEditedRowIndices] = useState<Set<number>>(new Set());
  const [deletedRows, setDeletedRows] = useState<Set<number>>(new Set());

  useEffect(() => {
    setOriginalRows(rentals || []);
    setEditedRows(rentals || []);
    setEditedRowIndices(new Set());
    setDeletedRows(new Set());
    setVisibleCount(PAGE_SIZE);
  }, [rentals]);
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchTerm, filterStatus]);

  const handleDelete = (rentalId: number) => {
    const rowIndex = editedRows.findIndex((rental) => rental.id === rentalId);
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

  const handleToggleReturned = (rentalId: number) => {
    const rentalIndex = editedRows.findIndex((rental) => rental.id === rentalId);
    if (rentalIndex === -1) return;

    const updatedRentals = editedRows.map((rental, idx) => {
      if (idx === rentalIndex) {
        const updatedRental = {
          ...rental,
          returned: !rental.returned,
          status: !rental.returned ? "returned" : ("active" as "returned" | "overdue" | "active"),
        };
        return updatedRental;
      }
      return rental;
    });

    setEditedRows(updatedRentals);

    // Check if this rental was actually changed compared to original
    const original = originalRows[rentalIndex];
    const updatedRental = updatedRentals[rentalIndex];
    let isEdited = false;
    if (original && updatedRental) {
      for (const key of Object.keys(updatedRental) as Array<keyof EnhancedRental>) {
        if (updatedRental[key] !== original[key]) {
          isEdited = true;
          break;
        }
      }
    }

    setEditedRowIndices((prev) => {
      const newSet = new Set(prev);
      if (isEdited) {
        newSet.add(rentalIndex);
      } else {
        newSet.delete(rentalIndex);
      }
      return newSet;
    });
  };

  const handleRentalEdit = (rentalId: number) => {
    const rental = editedRows.find((r) => r.id === rentalId);
    if (rental) {
      setSelectedRental(rental);
      setIsEditModalOpen(true);
    }
  };

  const handleSaveRental = (updatedRental: EnhancedRental) => {
    // Update the edited rows with the new rental data
    const rentalIndex = editedRows.findIndex((r) => r.id === updatedRental.id);
    if (rentalIndex !== -1) {
      const updated = editedRows.map((row, idx) => (idx === rentalIndex ? updatedRental : row));
      setEditedRows(updated);

      // Check if this rental was actually changed compared to original
      const original = originalRows[rentalIndex];
      let isEdited = false;
      if (original) {
        for (const key of Object.keys(updatedRental) as Array<keyof EnhancedRental>) {
          if (updatedRental[key] !== original[key]) {
            isEdited = true;
            break;
          }
        }
      }

      setEditedRowIndices((prev) => {
        const newSet = new Set(prev);
        if (isEdited) {
          newSet.add(rentalIndex);
        } else {
          newSet.delete(rentalIndex);
        }
        return newSet;
      });
    }
    setIsEditModalOpen(false);
    setSelectedRental(null);
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

      // Only send changed or deleted rows
      const changedRows = editedRows
        .map((row, idx) => ({ row, idx }))
        .filter(({ row, idx }) => {
          if (deletedRows.has(idx)) return false;
          const original = originalRows[idx];
          if (!original) return false;
          for (const key of Object.keys(row) as Array<keyof EnhancedRental>) {
            if (row[key] !== original[key]) return true;
          }
          return false;
        })
        .map(({ row }) => row);

      const deletedRowIds = Array.from(deletedRows)
        .map((idx) => originalRows[idx]?.id)
        .filter(Boolean);

      if (changedRows.length === 0 && deletedRowIds.length === 0) {
        alert("No changes to save.");
        return;
      }

      const res = await fetch("/api/admin/rentals", {
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
          `Server returned an invalid response.\nStatus: ${res.status}\n${text.slice(0, 200)}`,
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

  // Filter rentals
  const filteredRentals = editedRows.filter((rental) => {
    const matchesSearch =
      !searchTerm ||
      rental.gearName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rental.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rental.gearCategory.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterStatus === "all" || rental.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string, dueDate: string | null) => {
    switch (status) {
      case "returned":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Returned
          </Badge>
        );
      case "overdue":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Overdue
          </Badge>
        );
      case "active":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
            <Clock className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
            Unknown
          </Badge>
        );
    }
  };

  const hasChanges = editedRowIndices.size > 0 || deletedRows.size > 0;
  const pagedRentals = filteredRentals.slice(0, visibleCount);
  const remaining = Math.max(0, filteredRentals.length - visibleCount);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg md:text-xl flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Rental Transactions
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
                placeholder="Search rentals..."
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
                  All Rentals
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("active")}>
                  Active Only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("overdue")}>
                  Overdue Only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("returned")}>
                  Returned Only
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Grid View - Works on all screen sizes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {pagedRentals.map((rental) => {
            const originalIndex = editedRows.findIndex((r) => r.id === rental.id);
            const isEdited = editedRowIndices.has(originalIndex);
            const isDeleted = deletedRows.has(originalIndex);

            return (
              <Card
                key={rental.id}
                className={`hover:shadow-lg transition-all duration-200 group ${
                  isDeleted
                    ? "bg-red-50 opacity-60 line-through"
                    : isEdited
                      ? "bg-yellow-50 border-yellow-200"
                      : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <h3 className="font-semibold text-sm truncate">{rental.gearName}</h3>
                        {rental.gearItemCode && (
                          <p className="text-xs text-gray-600">Unit: {rental.gearItemCode}</p>
                        )}
                        <p className="text-xs text-gray-600 capitalize">{rental.gearCategory}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="h-6 w-6 bg-gray-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">
                              {rental.userName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-xs text-gray-600">{rental.userName}</span>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleRentalEdit(rental.id)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Rental
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleReturned(rental.id)}
                          className="text-blue-600"
                        >
                          {rental.returned ? (
                            <>
                              <Package className="h-4 w-4 mr-2" />
                              Mark as Not Returned
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark as Returned
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(rental.id)}
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
                              Delete
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mb-3">{getStatusBadge(rental.status, rental.due_date)}</div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>
                      <span className="font-medium">Rented:</span>
                      <br />
                      {new Date(rental.lent_date).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Due:</span>
                      <br />
                      {rental.due_date
                        ? new Date(rental.due_date).toLocaleDateString()
                        : "No due date"}
                    </div>
                  </div>

                  {/* Show edit/delete indicators */}
                  {(isEdited || isDeleted) && (
                    <div className="mt-3 pt-2 border-t border-gray-200">
                      <div className="flex items-center gap-1">
                        {isEdited && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300"
                          >
                            Modified
                          </Badge>
                        )}
                        {isDeleted && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-red-100 text-red-800 border-red-300"
                          >
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

        {filteredRentals.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No rentals found matching your criteria.
          </div>
        )}
      </CardContent>

      <div className="px-6 pb-6">
        <LoadMoreBar
          hasMore={remaining > 0}
          remaining={remaining}
          size={PAGE_SIZE}
          onLoadMore={() => setVisibleCount((v) => v + PAGE_SIZE)}
        />
      </div>

      {/* Edit Modal */}
      <RentalEditModal
        rental={selectedRental}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedRental(null);
        }}
        onSave={handleSaveRental}
      />
    </Card>
  );
}

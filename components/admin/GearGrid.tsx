"use client";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import LoadMoreBar from "@/components/ui/load-more-bar";
import GearEditModal from "./GearEditModal";
import {
  Search,
  Filter,
  ChevronDown,
  Edit,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Package,
  Save,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface GearItem {
  id: number;
  name: string;
  category: string;
  num_available: number;
  description: string | null;
  price_tu_th: number | null;
  price_th_tu: number | null;
  price_week: number | null;
  total_times_rented: number | null;
  revenue_generated: number | null;
}

interface GearGridProps {
  gear: GearItem[];
  existingCategories?: string[];
}

export default function GearGrid({ gear, existingCategories = [] }: GearGridProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "available" | "out_of_stock">("all");
  const [selectedGear, setSelectedGear] = useState<GearItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const PAGE_SIZE = 24;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Change tracking state for batch operations
  const [originalRows, setOriginalRows] = useState<GearItem[]>(gear || []);
  const [editedRows, setEditedRows] = useState<GearItem[]>(gear || []);
  const [editedRowIndices, setEditedRowIndices] = useState<Set<number>>(new Set());
  const [deletedRows, setDeletedRows] = useState<Set<number>>(new Set());

  const categories = Array.from(new Set(gear.map((g) => g.category))).filter(Boolean);

  useEffect(() => {
    setOriginalRows(gear || []);
    setEditedRows(gear || []);
    setEditedRowIndices(new Set());
    setDeletedRows(new Set());
    setVisibleCount(PAGE_SIZE);
  }, [gear]);
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchTerm, filterCategory, filterStatus]);

  const handleDelete = (gearId: number) => {
    const rowIndex = editedRows.findIndex((item) => item.id === gearId);
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

  const handleGearEdit = (gearId: number) => {
    const gearItem = editedRows.find((g) => g.id === gearId);
    if (gearItem) {
      setSelectedGear(gearItem);
      setIsEditModalOpen(true);
    }
  };

  const handleSaveGear = (updatedGear: GearItem) => {
    // Update the edited rows with the new gear data
    const gearIndex = editedRows.findIndex((g) => g.id === updatedGear.id);
    if (gearIndex !== -1) {
      const updated = editedRows.map((row, idx) => (idx === gearIndex ? updatedGear : row));
      setEditedRows(updated);

      // Check if this item was actually changed compared to original
      const original = originalRows[gearIndex];
      let isEdited = false;
      if (original) {
        for (const key of Object.keys(updatedGear) as Array<keyof GearItem>) {
          if (updatedGear[key] !== original[key]) {
            isEdited = true;
            break;
          }
        }
      }

      setEditedRowIndices((prev) => {
        const newSet = new Set(prev);
        if (isEdited) {
          newSet.add(gearIndex);
        } else {
          newSet.delete(gearIndex);
        }
        return newSet;
      });
    }
    setIsEditModalOpen(false);
    setSelectedGear(null);
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
          for (const key of Object.keys(row) as Array<keyof GearItem>) {
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

      const res = await fetch("/api/admin/gear", {
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

  // Filter gear
  const filteredGear = editedRows.filter((item) => {
    const matchesSearch =
      !searchTerm ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = filterCategory === "all" || item.category === filterCategory;

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "available" && (item.num_available || 0) > 0) ||
      (filterStatus === "out_of_stock" && (item.num_available || 0) === 0);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const hasChanges = editedRowIndices.size > 0 || deletedRows.size > 0;
  const pagedGear = filteredGear.slice(0, visibleCount);
  const remaining = Math.max(0, filteredGear.length - visibleCount);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg md:text-xl flex items-center gap-2">
              <Package className="h-5 w-5" />
              Gear Inventory
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
                placeholder="Search gear..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 w-full sm:w-auto">
                    <Filter className="h-4 w-4" />
                    Category
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterCategory("all")}>
                    All Categories
                  </DropdownMenuItem>
                  {categories.map((category) => (
                    <DropdownMenuItem key={category} onClick={() => setFilterCategory(category)}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

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
                    All Items
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus("available")}>
                    Available (In Stock)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus("out_of_stock")}>
                    Out of Stock
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Grid View - Works on all screen sizes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {pagedGear.map((item) => {
            const originalIndex = editedRows.findIndex((r) => r.id === item.id);
            const isEdited = editedRowIndices.has(originalIndex);
            const isDeleted = deletedRows.has(originalIndex);

            return (
              <Card
                key={item.id}
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
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                        <p className="text-xs text-gray-600 capitalize">{item.category}</p>
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
                        <DropdownMenuItem onClick={() => handleGearEdit(item.id)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Item
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(item.id)}
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

                  <div className="mb-3">
                    <Badge
                      variant={(item.num_available || 0) > 0 ? "default" : "secondary"}
                      className={
                        (item.num_available || 0) > 0
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }
                    >
                      <div className="flex items-center gap-1">
                        {(item.num_available || 0) > 0 ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {(item.num_available || 0) > 0
                          ? `${item.num_available} available`
                          : "Out of stock"}
                      </div>
                    </Badge>
                  </div>

                  {item.description && (
                    <p className="text-xs text-gray-600 line-clamp-2">{item.description}</p>
                  )}

                  {/* Show pricing info if available */}
                  {(item.price_tu_th || item.price_th_tu || item.price_week) && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        {item.price_tu_th && `Tue-Thu: $${item.price_tu_th}`}
                        {item.price_th_tu && ` • Thu-Tue: $${item.price_th_tu}`}
                        {item.price_week && ` • Week: $${item.price_week}`}
                      </p>
                    </div>
                  )}

                  {/* Show edit/delete indicators */}
                  {(isEdited || isDeleted) && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
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

        {filteredGear.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No gear items found matching your criteria.
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
      <GearEditModal
        gear={selectedGear}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedGear(null);
        }}
        onSave={handleSaveGear}
        existingCategories={existingCategories}
      />
    </Card>
  );
}

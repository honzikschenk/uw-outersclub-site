"use client";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Eye
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
}

export default function GearGrid({ gear }: GearGridProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "available" | "out_of_stock">("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [selectedGear, setSelectedGear] = useState<GearItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const categories = Array.from(new Set(gear.map(g => g.category))).filter(Boolean);

  // Filter gear
  const filteredGear = gear.filter((item) => {
    const matchesSearch = !searchTerm || 
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

  const handleGearAction = async (action: string, gearId: number) => {
    const gearItem = gear.find(g => g.id === gearId);
    
    if (action === "edit" && gearItem) {
      setSelectedGear(gearItem);
      setIsEditModalOpen(true);
    } else if (action === "view" && gearItem) {
      // Open view details modal or navigate to detail page
      setSelectedGear(gearItem);
      setIsEditModalOpen(true);
    } else {
      console.log(`${action} for gear ${gearId}`);
      // TODO: Implement other actions like toggle availability
    }
  };

  const handleSaveGear = async (updatedGear: GearItem) => {
    try {
      const response = await fetch('/api/admin/gear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedGear),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Gear saved successfully:", result);
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        const error = await response.json();
        console.error("Error saving gear:", error.error);
        alert(`Error saving gear: ${error.error}`);
      }
    } catch (error) {
      console.error("Error saving gear:", error);
      alert("Error saving gear. Please try again.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-4">
          <CardTitle className="text-lg md:text-xl flex items-center gap-2">
            <Package className="h-5 w-5" />
            Gear Inventory
          </CardTitle>
          
          {/* Mobile-friendly controls */}
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
                  {categories.map(category => (
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

              <Button
                variant="outline"
                onClick={() => setViewMode(viewMode === "grid" ? "table" : "grid")}
                className="w-full sm:w-auto hidden md:block"
              >
                {viewMode === "grid" ? "Table View" : "Grid View"}
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Mobile: Always show grid, Desktop: Toggle between grid and table */}
        <div className="block md:hidden">
          {/* Mobile Grid View */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredGear.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-all duration-200">
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
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleGearAction("view", item.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleGearAction("edit", item.id)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Item
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleGearAction("toggle", item.id)}>
                          {(item.num_available || 0) > 0 ? (
                            <>
                              <XCircle className="h-4 w-4 mr-2" />
                              Mark as Out of Stock
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Add Stock
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="mb-3">
                    <Badge 
                      variant={(item.num_available || 0) > 0 ? "default" : "secondary"}
                      className={(item.num_available || 0) > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                    >
                      <div className="flex items-center gap-1">
                        {(item.num_available || 0) > 0 ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {(item.num_available || 0) > 0 ? `${item.num_available} available` : "Out of stock"}
                      </div>
                    </Badge>
                  </div>
                  
                  {item.description && (
                    <p className="text-xs text-gray-600 line-clamp-2">{item.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Desktop: Show grid or table based on viewMode */}
        <div className="hidden md:block">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredGear.map((item) => (
                <Card key={item.id} className="hover:shadow-lg transition-all duration-200 group">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Package className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex flex-col">
                          <h3 className="font-semibold text-sm line-clamp-1">{item.name}</h3>
                          <p className="text-xs text-gray-600 capitalize">{item.category}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleGearAction("view", item.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleGearAction("edit", item.id)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Item
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleGearAction("toggle", item.id)}>
                            {(item.num_available || 0) > 0 ? (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Mark as Out of Stock
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Add Stock
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <div className="mb-3">
                      <Badge 
                        variant={(item.num_available || 0) > 0 ? "default" : "secondary"}
                        className={(item.num_available || 0) > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                      >
                        <div className="flex items-center gap-1">
                          {(item.num_available || 0) > 0 ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          {(item.num_available || 0) > 0 ? `${item.num_available} available` : "Out of stock"}
                        </div>
                      </Badge>
                    </div>
                    
                    {item.description && (
                      <p className="text-xs text-gray-600 line-clamp-2">{item.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-3 px-6 font-medium text-gray-500">Name</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-500">Category</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-500">Description</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGear.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Package className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="font-medium">{item.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600 capitalize">
                        {item.category}
                      </td>
                      <td className="py-4 px-6">
                        <Badge 
                          variant={(item.num_available || 0) > 0 ? "default" : "secondary"}
                          className={(item.num_available || 0) > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                        >
                          <div className="flex items-center gap-1">
                            {(item.num_available || 0) > 0 ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            {(item.num_available || 0) > 0 ? `${item.num_available} available` : "Out of stock"}
                          </div>
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600 max-w-xs truncate">
                        {item.description || "No description"}
                      </td>
                      <td className="py-4 px-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleGearAction("view", item.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleGearAction("edit", item.id)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Item
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleGearAction("toggle", item.id)}>
                              {(item.num_available || 0) > 0 ? (
                                <>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Mark as Out of Stock
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Add Stock
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
            </div>
          )}
        </div>
        
        {filteredGear.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No gear items found matching your criteria.
          </div>
        )}
      </CardContent>

      {/* Edit Modal */}
      <GearEditModal
        gear={selectedGear}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedGear(null);
        }}
        onSave={handleSaveGear}
      />
    </Card>
  );
}
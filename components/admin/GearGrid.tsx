"use client";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  available: boolean;
  description: string | null;
}

interface GearGridProps {
  gear: GearItem[];
}

export default function GearGrid({ gear }: GearGridProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "available" | "unavailable">("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

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
      (filterStatus === "available" && item.available) ||
      (filterStatus === "unavailable" && !item.available);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleGearAction = async (action: string, gearId: number) => {
    console.log(`${action} for gear ${gearId}`);
    // TODO: Implement actual API calls for gear management
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <Package className="h-5 w-5" />
            Gear Inventory
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search gear..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
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
                <Button variant="outline" className="gap-2">
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
                  Available Only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("unavailable")}>
                  Checked Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              onClick={() => setViewMode(viewMode === "grid" ? "table" : "grid")}
            >
              {viewMode === "grid" ? "Table View" : "Grid View"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
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
                          {item.available ? (
                            <>
                              <XCircle className="h-4 w-4 mr-2" />
                              Mark as Unavailable
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark as Available
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="mb-3">
                    <Badge 
                      variant={item.available ? "default" : "secondary"}
                      className={item.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                    >
                      <div className="flex items-center gap-1">
                        {item.available ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        {item.available ? "Available" : "Checked Out"}
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
                        variant={item.available ? "default" : "secondary"}
                        className={item.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                      >
                        <div className="flex items-center gap-1">
                          {item.available ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          {item.available ? "Available" : "Checked Out"}
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
                            {item.available ? (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Mark as Unavailable
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark as Available
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
        
        {filteredGear.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No gear items found matching your criteria.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
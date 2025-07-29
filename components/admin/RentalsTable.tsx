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
  Eye, 
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  User,
  Package
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
  user_id: string;
  returned: boolean;
  gearName: string;
  gearCategory: string;
  userName: string;
  status: 'returned' | 'overdue' | 'active';
}

interface RentalsTableProps {
  rentals: EnhancedRental[];
}

export default function RentalsTable({ rentals }: RentalsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "overdue" | "returned">("all");
  const [sortField, setSortField] = useState<keyof EnhancedRental>("lent_date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Filter and sort rentals
  const filteredRentals = rentals.filter((rental) => {
    const matchesSearch = !searchTerm || 
      rental.gearName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rental.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rental.gearCategory.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = 
      filterStatus === "all" ||
      rental.status === filterStatus;

    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    // Handle date sorting
    if (sortField === "lent_date" || sortField === "due_date") {
      aVal = aVal ? new Date(aVal as string).getTime() : 0;
      bVal = bVal ? new Date(bVal as string).getTime() : 0;
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

  const handleSort = (field: keyof EnhancedRental) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getStatusBadge = (status: string, dueDate: string | null) => {
    switch (status) {
      case 'returned':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Returned
          </Badge>
        );
      case 'overdue':
        return (
          <Badge className="bg-red-100 text-red-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Overdue
          </Badge>
        );
      case 'active':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Clock className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">Unknown</Badge>
        );
    }
  };

  const getDaysInfo = (rental: EnhancedRental) => {
    const now = new Date();
    
    if (rental.status === 'returned') {
      // Calculate how long the rental lasted
      if (rental.lent_date && rental.due_date) {
        const lent = new Date(rental.lent_date);
        const due = new Date(rental.due_date);
        const duration = Math.ceil((due.getTime() - lent.getTime()) / (1000 * 60 * 60 * 24));
        return `${duration} day rental`;
      }
      return 'Completed';
    }
    
    if (rental.due_date) {
      const due = new Date(rental.due_date);
      const diffTime = due.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return `${Math.abs(diffDays)} days overdue`;
      } else if (diffDays === 0) {
        return 'Due today';
      } else {
        return `Due in ${diffDays} days`;
      }
    }
    
    return 'No due date';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Rental Transactions
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search rentals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            
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
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th 
                  className="text-left py-3 px-6 font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("gearName")}
                >
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Gear Item
                    {sortField === "gearName" && (
                      <span className="text-xs">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="text-left py-3 px-6 font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("userName")}
                >
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Rented By
                    {sortField === "userName" && (
                      <span className="text-xs">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="text-left py-3 px-6 font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("lent_date")}
                >
                  <div className="flex items-center gap-2">
                    Rented Date
                    {sortField === "lent_date" && (
                      <span className="text-xs">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="text-left py-3 px-6 font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("due_date")}
                >
                  <div className="flex items-center gap-2">
                    Due Date
                    {sortField === "due_date" && (
                      <span className="text-xs">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
                <th className="text-left py-3 px-6 font-medium text-gray-500">Status</th>
                <th className="text-left py-3 px-6 font-medium text-gray-500">Duration</th>
                <th className="text-left py-3 px-6 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRentals.map((rental) => (
                <tr key={rental.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium">{rental.gearName}</p>
                      <p className="text-sm text-gray-600 capitalize">{rental.gearCategory}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {rental.userName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span>{rental.userName}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">
                    {new Date(rental.lent_date).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">
                    {rental.due_date ? new Date(rental.due_date).toLocaleDateString() : 'No due date'}
                  </td>
                  <td className="py-4 px-6">
                    {getStatusBadge(rental.status, rental.due_date)}
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">
                    {getDaysInfo(rental)}
                  </td>
                  <td className="py-4 px-6">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredRentals.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No rentals found matching your criteria.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
"use client";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Package,
  User,
  Calendar,
  ArrowRight
} from "lucide-react";

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

interface QuickReturnRentalsProps {
  rentals: EnhancedRental[];
}

export default function QuickReturnRentals({ rentals }: QuickReturnRentalsProps) {
  const [processingReturns, setProcessingReturns] = useState<Set<number>>(new Set());

  // Get overdue, due soon, and currently rented items
  const now = new Date();
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 59, 999); // End of tomorrow

  const overdueRentals = rentals.filter(rental => 
    !rental.returned && 
    rental.due_date && 
    new Date(rental.due_date) < now
  );

  const dueSoonRentals = rentals.filter(rental => 
    !rental.returned && 
    rental.due_date && 
    new Date(rental.due_date) >= now &&
    new Date(rental.due_date) <= tomorrow
  );

  // Currently rented items (started today or before, not overdue, due more than tomorrow)
  const currentlyRentedItems = rentals.filter(rental => 
    !rental.returned && 
    rental.lent_date &&
    new Date(rental.lent_date) <= now && // Started today or before
    rental.due_date && 
    new Date(rental.due_date) > tomorrow // Due more than tomorrow
  );

  // Combine and sort by urgency (overdue first, then due soon, then currently rented)
  const urgentRentals = [
    ...overdueRentals.map(rental => ({
      ...rental,
      urgencyLevel: 'overdue' as const,
      daysSinceDue: rental.due_date ? 
        Math.floor((now.getTime() - new Date(rental.due_date).getTime()) / (1000 * 60 * 60 * 24)) : 0
    })),
    ...dueSoonRentals.map(rental => ({
      ...rental,
      urgencyLevel: 'due-soon' as const,
      daysSinceDue: 0
    })),
    ...currentlyRentedItems.map(rental => ({
      ...rental,
      urgencyLevel: 'currently-rented' as const,
      daysSinceDue: 0,
      daysUntilDue: rental.due_date ? 
        Math.ceil((new Date(rental.due_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0,
      daysSinceStart: rental.lent_date ?
        Math.floor((now.getTime() - new Date(rental.lent_date).getTime()) / (1000 * 60 * 60 * 24)) : 0
    }))
  ].sort((a, b) => {
    // Sort overdue by days overdue (most overdue first)
    if (a.urgencyLevel === 'overdue' && b.urgencyLevel === 'overdue') {
      return b.daysSinceDue - a.daysSinceDue;
    }
    // Overdue items come before due-soon items
    if (a.urgencyLevel === 'overdue' && b.urgencyLevel === 'due-soon') return -1;
    if (a.urgencyLevel === 'due-soon' && b.urgencyLevel === 'overdue') return 1;
    // Due-soon items come before currently-rented items
    if (a.urgencyLevel === 'due-soon' && b.urgencyLevel === 'currently-rented') return -1;
    if (a.urgencyLevel === 'currently-rented' && b.urgencyLevel === 'due-soon') return 1;
    // Overdue items come before currently-rented items
    if (a.urgencyLevel === 'overdue' && b.urgencyLevel === 'currently-rented') return -1;
    if (a.urgencyLevel === 'currently-rented' && b.urgencyLevel === 'overdue') return 1;
    // For due-soon items, sort by due date (earliest first)
    if (a.urgencyLevel === 'due-soon' && b.urgencyLevel === 'due-soon' && a.due_date && b.due_date) {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    // For currently-rented items, sort by due date (earliest first)
    if (a.urgencyLevel === 'currently-rented' && b.urgencyLevel === 'currently-rented' && a.due_date && b.due_date) {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    return 0;
  }).slice(0, 12); // Show only top 12 most urgent

  const handleQuickReturn = async (rentalId: number) => {
    setProcessingReturns(prev => new Set(prev).add(rentalId));
    
    try {
      // Find the original rental
      const originalRental = rentals.find(r => r.id === rentalId);
      if (!originalRental) {
        throw new Error('Rental not found');
      }

      // Call API to mark as returned
      const response = await fetch("/api/admin/rentals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalRows: [originalRental],
          editedRows: [{
            ...originalRental,
            returned: true
          }],
          deletedRowIds: [],
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Refresh the page to update the data
        window.location.reload();
      } else {
        let errorMsg = "Failed to process return.";
        if (result.errors && Array.isArray(result.errors)) {
          errorMsg += "\n" + result.errors.join("\n");
        } else if (result.error) {
          errorMsg += "\n" + result.error;
        }
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error('Error processing return:', error);
      alert('Failed to process return: ' + (error?.message || 'Unknown error'));
    } finally {
      setProcessingReturns(prev => {
        const newSet = new Set(prev);
        newSet.delete(rentalId);
        return newSet;
      });
    }
  };

  const getUrgencyBadge = (rental: typeof urgentRentals[0]) => {
    if (rental.urgencyLevel === 'overdue') {
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {rental.daysSinceDue} day{rental.daysSinceDue !== 1 ? 's' : ''} overdue
        </Badge>
      );
    } else if (rental.urgencyLevel === 'due-soon') {
      const dueDate = rental.due_date ? new Date(rental.due_date) : null;
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      const isDueToday = dueDate && dueDate.toDateString() === new Date().toDateString();
      
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
          <Clock className="h-3 w-3 mr-1" />
          {isDueToday ? 'Due Today' : `Due ${rental.due_date ? new Date(rental.due_date).toLocaleDateString() : 'soon'}`}
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
          <Package className="h-3 w-3 mr-1" />
          Day {(rental as any).daysSinceStart + 1} of rental
        </Badge>
      );
    }
  };

  if (urgentRentals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Quick Return Rentals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-400" />
            <p className="font-medium">All rentals are up to date!</p>
            <p className="text-sm">No overdue, due soon, or currently rented items needing attention.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Quick Return Rentals
            <Badge variant="outline" className="ml-2">
              {urgentRentals.length} urgent
            </Badge>
          </CardTitle>
          <Button variant="outline" size="sm" asChild>
            <a href="/admin/rentals">
              View All <ArrowRight className="h-4 w-4 ml-1" />
            </a>
          </Button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Overdue items, rentals due today or tomorrow, and currently rented items
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {urgentRentals.map((rental) => (
            <div 
              key={rental.id}
              className={`p-4 rounded-lg border transition-all ${
                rental.urgencyLevel === 'overdue' 
                  ? 'bg-red-50 border-red-200' 
                  : rental.urgencyLevel === 'due-soon'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-green-50 border-green-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4 text-gray-600 flex-shrink-0" />
                    <span className="font-medium truncate">{rental.gearName}</span>
                    <Badge variant="outline" className="text-xs">
                      {rental.gearCategory}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span className="truncate">{rental.userName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Due: {rental.due_date ? new Date(rental.due_date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    {getUrgencyBadge(rental)}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleQuickReturn(rental.id)}
                    disabled={processingReturns.has(rental.id)}
                    className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                  >
                    {processingReturns.has(rental.id) ? (
                      <>Processing...</>
                    ) : (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Mark Returned
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {urgentRentals.length >= 12 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Showing {urgentRentals.length} most urgent items. 
              <a href="/admin/rentals" className="text-blue-600 hover:underline ml-1">
                View all rentals →
              </a>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

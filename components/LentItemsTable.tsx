"use client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import React, { useState, useMemo } from "react";

interface LentItemsTableProps {
  lentItems: any[];
  gearMap: Record<string, string>;
}

export default function LentItemsTable({
  lentItems,
  gearMap,
}: LentItemsTableProps) {
  const [showReturned, setShowReturned] = useState(false);

  // Filter items based on whether they're returned and the showReturned state
  const filteredItems = useMemo(() => {
    if (showReturned) {
      return lentItems; // Show all items
    } else {
      return lentItems.filter(item => !item.returned); // Only show non-returned items
    }
  }, [lentItems, showReturned]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {showReturned ? 
            `Showing ${filteredItems.length} of ${lentItems.length} items (all items)` : 
            `Showing ${filteredItems.length} of ${lentItems.length} items (active rentals only)`
          }
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowReturned(!showReturned)}
        >
          {showReturned ? "Hide Returned Items" : "Show Returned Items"}
        </Button>
      </div>
      
      <Card className="overflow-x-auto p-0">
        <table className="min-w-full bg-white rounded">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Item</th>
              <th className="px-4 py-2 text-left">Lent Date</th>
              <th className="px-4 py-2 text-left">Due Date</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Returned</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item: any) => {
              const lent = item.lent_date ? new Date(item.lent_date) : null;
              const due = item.due_date ? new Date(item.due_date) : null;
              const now = new Date();
              let status = "";
              
              if (item.returned) {
                status = "Returned";
              } else if (lent && lent > now) {
                status = "Reserved";
              } else if (due && due < now) {
                status = "Past Due";
              } else {
                status = "On Loan";
              }
              
              return (
                <tr
                  key={item.id}
                  className={`${status === "Past Due" ? "bg-red-100" : ""} ${item.returned ? "bg-gray-50 opacity-75" : ""}`}
                >
                  <td className="px-4 py-2 flex items-center gap-3">
                    <span>{gearMap[item.gear_id] || item.gear_id || "?"}</span>
                  </td>
                  <td className="px-4 py-2">
                    {item.lent_date
                      ? new Date(item.lent_date).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="px-4 py-2">
                    {due ? due.toLocaleDateString() : "-"}
                  </td>
                  <td className="px-4 py-2 font-semibold">
                    {status === "Past Due" ? (
                      <span className="text-red-600">Past Due</span>
                    ) : status === "Reserved" ? (
                      <span className="text-lime-600">Reserved</span>
                    ) : status === "Returned" ? (
                      <span className="text-gray-600">Returned</span>
                    ) : (
                      "On Loan"
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      item.returned ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {item.returned ? "Yes" : "No"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

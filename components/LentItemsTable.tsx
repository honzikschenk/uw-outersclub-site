"use client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import React, { useState, useMemo } from "react";
import { cancelRentalAction } from "@/app/actions";
import { useRouter } from "next/navigation";

interface LentItemsTableProps {
  lentItems: any[];
  gearMap: Record<string, string>;
}

export default function LentItemsTable({ lentItems, gearMap }: LentItemsTableProps) {
  const [showReturned, setShowReturned] = useState(false);
  const [cancelingRentals, setCancelingRentals] = useState<Set<string>>(new Set());
  const router = useRouter();

  const handleCancelRental = async (rentalId: string, gearName: string) => {
    if (cancelingRentals.has(rentalId)) return;

    // Confirm cancellation
    const confirmed = window.confirm(
      `Are you sure you want to cancel your reservation for "${gearName}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setCancelingRentals((prev) => {
      const newSet = new Set(prev);
      newSet.add(rentalId);
      return newSet;
    });

    try {
      console.log(`[handleCancelRental] Calling cancelRentalAction for rental ${rentalId}`);
      const result = await cancelRentalAction(rentalId);

      console.log(`[handleCancelRental] Result:`, result);

      if (result.error) {
        alert(`Error: ${result.error}`);
      } else if (result.success) {
        alert("Rental canceled successfully!");
        // Data should be refreshed automatically due to revalidatePath
      } else {
        alert("Unexpected response from server. Please try again.");
      }
    } catch (error) {
      console.error(`[handleCancelRental] Exception:`, error);
      alert("Failed to cancel rental. Please try again.");
    } finally {
      setCancelingRentals((prev) => {
        const newSet = new Set(prev);
        newSet.delete(rentalId);
        return newSet;
      });
    }
  };

  // Filter items based on whether they're returned and the showReturned state
  const filteredItems = useMemo(() => {
    if (showReturned) {
      return lentItems; // Show all items
    } else {
      return lentItems.filter((item) => !item.returned); // Only show non-returned items
    }
  }, [lentItems, showReturned]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {showReturned
            ? `Showing ${filteredItems.length} of ${lentItems.length} items (all items)`
            : `Showing ${filteredItems.length} of ${lentItems.length} items (active rentals only)`}
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowReturned(!showReturned)}>
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
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item: any) => {
              const lent = item.lent_date ? new Date(item.lent_date) : null;
              const due = item.due_date ? new Date(item.due_date) : null;
              const now = new Date();
              let status = "";
              let canCancel = false;

              if (item.returned) {
                status = "Returned";
              } else if (lent && lent > now) {
                status = "Reserved";
                canCancel = true; // Can cancel future reservations
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
                    {item.lent_date ? new Date(item.lent_date).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-4 py-2">{due ? due.toLocaleDateString() : "-"}</td>
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
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        item.returned
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {item.returned ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {canCancel && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleCancelRental(item.id, gearMap[item.gear_id] || "Unknown Item")
                        }
                        disabled={cancelingRentals.has(item.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {cancelingRentals.has(item.id) ? "Canceling..." : "Cancel"}
                      </Button>
                    )}
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

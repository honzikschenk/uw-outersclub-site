"use client";
import { Card } from "@/components/ui/card";
import React from "react";

interface LentItemsTableProps {
  lentItems: any[];
  gearName: string;
}

export default function LentItemsTable({
  lentItems,
  gearName,
}: LentItemsTableProps) {
  return (
    <Card className="overflow-x-auto p-0">
      <table className="min-w-full bg-white rounded">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left">Item</th>
            <th className="px-4 py-2 text-left">Lent Date</th>
            <th className="px-4 py-2 text-left">Due Date</th>
            <th className="px-4 py-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {lentItems.map((item: any) => {
            const lent = item.lent_date ? new Date(item.lent_date) : null;
            const due = item.due_date ? new Date(item.due_date) : null;
            const now = new Date();
            let status = "";
            if (lent && lent > now) {
              status = "Reserved";
            } else if (due && due < now) {
              status = "Past Due";
            } else {
              status = "On Loan";
            }
            return (
              <tr
                key={item.id}
                className={status === "Past Due" ? "bg-red-100" : ""}
              >
                <td className="px-4 py-2 flex items-center gap-3">
                  <span>{gearName}</span>
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
                  ) : (
                    "On Loan"
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

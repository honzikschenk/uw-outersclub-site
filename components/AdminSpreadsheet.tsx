"use client";
import { Card } from "@/components/ui/card";
import React, { useState, useEffect } from "react";

interface AdminSpreadsheetProps {
  title: string;
  columns: string[];
  data: any[];
  error: any;
  tableName: string;
}

export default function AdminSpreadsheet({
  title,
  columns,
  data,
  error,
  tableName,
}: AdminSpreadsheetProps) {
  const [rows, setRows] = useState<any[]>(data || []);
  const [search, setSearch] = useState("");
  const [gearMap, setGearMap] = useState<Record<string, string>>({});
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [deletedRows, setDeletedRows] = useState<Set<number>>(new Set());
  const [originalRows, setOriginalRows] = useState<any[]>(data || []);
  const [editedRowIndices, setEditedRowIndices] = useState<Set<number>>(new Set());

  // Fetch gear names and user names for mapping
  useEffect(() => {
    async function fetchMaps() {
      if (
        (tableName === "Lent" || tableName === "Membership") &&
        rows.length > 0
      ) {
        // Get unique user_ids
        const userIds = Array.from(
          new Set(rows.map((r) => r.user_id).filter(Boolean))
        );
        if (userIds.length > 0) {
          let userRes = await fetch("/api/user-names?ids=" + userIds.join(","));
          let userData = await userRes.json();
          setUserMap(userData);
        }
        // For Lent, also get gear names
        if (tableName === "Lent") {
          const gearIds = Array.from(
            new Set(rows.map((r) => r.gear_id).filter(Boolean))
          );
          if (gearIds.length > 0) {
            let gearRes = await fetch(
              "/api/gear-names?ids=" + gearIds.join(",")
            );
            let gearData = await gearRes.json();
            setGearMap(gearData);
          }
        }
      }
    }
    fetchMaps();
    // eslint-disable-next-line
  }, [rows, tableName]);

  useEffect(() => {
    setRows(data || []);
    setOriginalRows(data || []);
  }, [data]);

  // Set default sort field to the first column
  useEffect(() => {
    if (columns.length > 0 && !sortField) {
      setSortField(columns[0]);
    }
    // eslint-disable-next-line
  }, [columns]);

  const handleEdit = (rowIdx: number, col: string, value: any) => {
    let parsedValue = value;
    // Parse boolean fields
    if (columns.includes(col) && (col === "valid" || col === "admin")) {
      parsedValue = value === "true" || value === true;
    }
    // Parse date fields
    if (
      columns.includes(col) &&
      (col.includes("date") || col.includes("joined_on"))
    ) {
      parsedValue = value; // Already in YYYY-MM-DD format
    }
    const updated = rows.map((row, idx) =>
      idx === rowIdx ? { ...row, [col]: parsedValue } : row
    );
    setRows(updated);
    // Mark as edited if changed from original
    const original = originalRows[rowIdx];
    let isEdited = false;
    if (original) {
      for (const key of columns) {
        if (updated[rowIdx][key] !== original[key]) {
          isEdited = true;
          break;
        }
      }
    }
    setEditedRowIndices(prev => {
      const newSet = new Set(prev);
      if (isEdited) {
        newSet.add(rowIdx);
      } else {
        newSet.delete(rowIdx);
      }
      return newSet;
    });
  };

  const handleUndoEdit = (rowIdx: number) => {
    setRows(rows => rows.map((row, idx) =>
      idx === rowIdx ? { ...originalRows[rowIdx] } : row
    ));
    setEditedRowIndices(prev => {
      const newSet = new Set(prev);
      newSet.delete(rowIdx);
      return newSet;
    });
  };

  const handleDelete = (rowIdx: number) => {
    setDeletedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rowIdx)) {
        newSet.delete(rowIdx); // undelete
      } else {
        newSet.add(rowIdx); // mark for deletion
      }
      return newSet;
    });
  };

  const filteredRows = rows.filter((row) =>
    columns.some((col) => {
      // For Lent sheet, allow searching by gear name
      if (col === "gear_id" && tableName === "Lent") {
        const gearName = gearMap[row.gear_id] || "";
        return gearName.toLowerCase().includes(search.toLowerCase());
      }
      // For user_id, allow searching by user email
      if (
        col === "user_id" &&
        userMap &&
        (tableName === "Lent" || tableName === "Membership")
      ) {
        const userEmail = userMap[row.user_id] || "";
        return userEmail.toLowerCase().includes(search.toLowerCase());
      }
      // Default: search by raw value
      return String(row[col] ?? "")
        .toLowerCase()
        .includes(search.toLowerCase());
    })
  );

  // Sorting logic
  const sortedRows = React.useMemo(() => {
    if (!sortField) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      // For dates, compare as dates
      if (sortField.includes("date") || sortField.includes("joined_on")) {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      }
      // For booleans, sort true before false
      if (typeof aVal === "boolean" || typeof bVal === "boolean") {
        aVal = aVal ? 1 : 0;
        bVal = bVal ? 1 : 0;
      }
      // For strings, compare case-insensitive
      if (typeof aVal === "string" && typeof bVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredRows, sortField, sortDirection]);

  // Helper to render cell by type
  const renderCell = (row: any, rowIdx: number, col: string) => {
    // Lent status (computed, not editable)
    if (col === "status") {
      const lent = row.lent_date ? new Date(row.lent_date) : null;
      const due = row.due_date ? new Date(row.due_date) : null;
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
        <span
          className={
            status === "Past Due"
              ? "text-red-600 font-semibold"
              : status === "Reserved"
                ? "text-lime-600 font-semibold"
                : ""
          }
        >
          {status}
        </span>
      );
    }
    // Show gear name instead of gear_id
    if (col === "gear_id" && tableName === "Lent") {
      return <span>{gearMap[row.gear_id] || row.gear_id || "-"}</span>;
    }
    // Show user name instead of user_id in Lent or Membership
    if (
      col === "user_id" &&
      userMap &&
      (tableName === "Lent" || tableName === "Membership")
    ) {
      return <span>{userMap[row.user_id] || row.user_id || "-"}</span>;
    }
    // Boolean fields
    if (col === "valid" || col === "admin") {
      return (
        <select
          className="border rounded px-1 py-0.5 w-full text-sm"
          value={row[col] === true ? "true" : row[col] === false ? "false" : ""}
          onChange={(e) => handleEdit(rowIdx, col, e.target.value)}
          aria-label={col}
        >
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      );
    }
    // Date fields
    if (col.includes("date") || col.includes("joined_on")) {
      // Accept only date (YYYY-MM-DD)
      const val = row[col] ? new Date(row[col]).toISOString().slice(0, 10) : "";
      return (
        <input
          type="date"
          className="border rounded px-1 py-0.5 w-full text-sm"
          value={val}
          onChange={(e) => handleEdit(rowIdx, col, e.target.value)}
          aria-label={col}
        />
      );
    }
    // Default text field
    return (
      <input
        className="border rounded px-1 py-0.5 w-full text-sm"
        value={row[col] ?? ""}
        onChange={(e) => handleEdit(rowIdx, col, e.target.value)}
        placeholder={col}
        aria-label={col}
      />
    );
  };

  const handleSave = async () => {
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
      const editedRows = rows
        .map((row, idx) => ({ row, idx }))
        .filter(({ row, idx }) => {
          if (deletedRows.has(idx)) return false;
          const original = originalRows[idx];
          if (!original) return false; // new row (not supported here)
          for (const key of columns) {
            if (row[key] !== original[key]) return true;
          }
          return false;
        })
        .map(({ row, idx }) => ({ ...row, id: originalRows[idx]?.id ?? row.id ?? row.user_id }));
      const deletedRowIds = Array.from(deletedRows)
        .map(idx => originalRows[idx]?.id ?? originalRows[idx]?.user_id)
        .filter(Boolean);
      if (editedRows.length === 0 && deletedRowIds.length === 0) {
        alert("No changes to save.");
        return;
      }
      const res = await fetch("/api/admin-spreadsheet-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableName,
          originalRows,
          editedRows,
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

  return (
    <Card className="overflow-x-auto p-0">
      <div className="p-4 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <h2 className="font-bold text-lg">{title}</h2>
        <input
          className="border rounded px-2 py-1 text-sm"
          placeholder={`Search ${title}`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      {error ? (
        <div className="p-4 text-red-600">
          Error loading {title}: {error.message}
        </div>
      ) : (
        <table className="min-w-full bg-white rounded">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-2 text-left capitalize cursor-pointer select-none hover:bg-blue-100 transition-colors group"
                  onClick={() => {
                    if (sortField === col) {
                      setSortDirection(
                        sortDirection === "asc" ? "desc" : "asc"
                      );
                    } else {
                      setSortField(col);
                      setSortDirection("asc");
                    }
                  }}
                  title="Click to sort by this column"
                >
                  {col.replace("_", " ")}
                  {sortField === col && (
                    <span className="ml-1">
                      {sortDirection === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </th>
              ))}
              {/* Add status column if Lent sheet */}
              {tableName === "Lent" && (
                <th className="px-4 py-2 text-left">Status</th>
              )}
              {/* Add edit/undo column */}
              <th className="px-4 py-2 text-left">{`Undo`}</th>
              {tableName === "Lent" && (
                <th className="px-4 py-2 text-left">Delete</th>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row, rowIdx) => {
              // Find the index in the original unsorted rows
              const origIdx = rows.findIndex(r => r.id === row.id);
              const isEdited = editedRowIndices.has(origIdx);
              const isDeleted = deletedRows.has(origIdx);
              return (
                <tr
                  key={row.id || rowIdx}
                  className={`transition-colors hover:bg-gray-100 ${isDeleted ? 'bg-red-50 opacity-60 line-through' : isEdited ? 'bg-yellow-50' : ''}`}
                >
                  {columns.map(col => (
                    <td key={col} className="px-4 py-2">
                      {renderCell(row, origIdx, col)}
                    </td>
                  ))}
                  {tableName === 'Lent' && (
                    <td className="px-4 py-2">{renderCell(row, origIdx, 'status')}</td>
                  )}
                  {/* Edit/Undo button */}
                  <td className="px-4 py-2">
                    {isEdited ? (
                      <button
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-3 py-1 rounded"
                        onClick={() => handleUndoEdit(origIdx)}
                        type="button"
                        title="Undo edits to this row"
                      >
                        Undo Edit
                      </button>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  {tableName === 'Lent' && (
                    <td className="px-4 py-2">
                      <button
                        className={`font-semibold px-3 py-1 rounded ${isDeleted ? 'bg-green-100 hover:bg-green-200 text-green-700' : 'bg-red-100 hover:bg-red-200 text-red-700'}`}
                        onClick={() => handleDelete(origIdx)}
                        type="button"
                        title={isDeleted ? 'Undo delete' : 'Delete row'}
                      >
                        {isDeleted ? 'Undo' : 'Delete'}
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <div className="flex justify-end p-4">
        <button
          className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold py-2 px-6 rounded shadow"
          onClick={handleSave}
          type="button"
        >
          Submit Changes
        </button>
      </div>
    </Card>
  );
}

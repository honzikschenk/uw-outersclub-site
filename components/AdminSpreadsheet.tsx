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

export default function AdminSpreadsheet({ title, columns, data, error, tableName }: AdminSpreadsheetProps) {
  const [rows, setRows] = useState<any[]>(data || []);
  const [search, setSearch] = useState("");
  const [gearMap, setGearMap] = useState<Record<string, string>>({});
  const [userMap, setUserMap] = useState<Record<string, string>>({});

  // Fetch gear names and user names for mapping
  useEffect(() => {
    async function fetchMaps() {
      if ((tableName === "Lent" || tableName === "Membership") && rows.length > 0) {
        // Get unique user_ids
        const userIds = Array.from(new Set(rows.map(r => r.user_id).filter(Boolean)));
        if (userIds.length > 0) {
          let userRes = await fetch("/api/user-names?ids=" + userIds.join(","));
          let userData = await userRes.json();
          setUserMap(userData);
        }
        // For Lent, also get gear names
        if (tableName === "Lent") {
          const gearIds = Array.from(new Set(rows.map(r => r.gear_id).filter(Boolean)));
          if (gearIds.length > 0) {
            let gearRes = await fetch("/api/gear-names?ids=" + gearIds.join(","));
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
  }, [data]);

  const handleEdit = (rowIdx: number, col: string, value: any) => {
    let parsedValue = value;
    // Parse boolean fields
    if (columns.includes(col) && (col === 'valid' || col === 'admin')) {
      parsedValue = value === 'true' || value === true;
    }
    // Parse date fields
    if (columns.includes(col) && (col.includes('date') || col.includes('joined_on'))) {
      parsedValue = value; // Already in YYYY-MM-DD format
    }
    const updated = rows.map((row, idx) => idx === rowIdx ? { ...row, [col]: parsedValue } : row);
    setRows(updated);
    // TODO: Add backend update logic here
  };

  const handleDelete = (rowIdx: number) => {
    const updated = rows.filter((_, idx) => idx !== rowIdx);
    setRows(updated);
    // TODO: Add backend delete logic here
  };

  const filteredRows = rows.filter(row =>
    columns.some(col => {
      // For Lent sheet, allow searching by gear name
      if (col === 'gear_id' && tableName === 'Lent') {
        const gearName = gearMap[row.gear_id] || '';
        return gearName.toLowerCase().includes(search.toLowerCase());
      }
      // For user_id, allow searching by user email
      if (col === 'user_id' && userMap && (tableName === 'Lent' || tableName === 'Membership')) {
        const userEmail = userMap[row.user_id] || '';
        return userEmail.toLowerCase().includes(search.toLowerCase());
      }
      // Default: search by raw value
      return String(row[col] ?? '').toLowerCase().includes(search.toLowerCase());
    })
  );

  // Helper to render cell by type
  const renderCell = (row: any, rowIdx: number, col: string) => {
    // Lent status (computed, not editable)
    if (col === 'status') {
      const lent = row.lent_date ? new Date(row.lent_date) : null;
      const due = row.due_date ? new Date(row.due_date) : null;
      const now = new Date();
      let status = '';
      if (lent && lent > now) {
        status = 'Reserved';
      } else if (due && due < now) {
        status = 'Past Due';
      } else {
        status = 'On Loan';
      }
      return (
        <span className={status === 'Past Due' ? 'text-red-600 font-semibold' : status === 'Reserved' ? 'text-lime-600 font-semibold' : ''}>{status}</span>
      );
    }
    // Show gear name instead of gear_id
    if (col === 'gear_id' && tableName === 'Lent') {
      return <span>{gearMap[row.gear_id] || row.gear_id || '-'}</span>;
    }
    // Show user name instead of user_id in Lent or Membership
    if (col === 'user_id' && userMap && (tableName === 'Lent' || tableName === 'Membership')) {
      return <span>{userMap[row.user_id] || row.user_id || '-'}</span>;
    }
    // Boolean fields
    if (col === 'valid' || col === 'admin') {
      return (
        <select
          className="border rounded px-1 py-0.5 w-full text-sm"
          value={row[col] === true ? 'true' : row[col] === false ? 'false' : ''}
          onChange={e => handleEdit(rowIdx, col, e.target.value)}
          aria-label={col}
        >
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      );
    }
    // Date fields
    if (col.includes('date') || col.includes('joined_on')) {
      // Accept only date (YYYY-MM-DD)
      const val = row[col] ? new Date(row[col]).toISOString().slice(0, 10) : '';
      return (
        <input
          type="date"
          className="border rounded px-1 py-0.5 w-full text-sm"
          value={val}
          onChange={e => handleEdit(rowIdx, col, e.target.value)}
          aria-label={col}
        />
      );
    }
    // Default text field
    return (
      <input
        className="border rounded px-1 py-0.5 w-full text-sm"
        value={row[col] ?? ''}
        onChange={e => handleEdit(rowIdx, col, e.target.value)}
        placeholder={col}
        aria-label={col}
      />
    );
  };

  return (
    <Card className="overflow-x-auto p-0">
      <div className="p-4 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <h2 className="font-bold text-lg">{title}</h2>
        <input
          className="border rounded px-2 py-1 text-sm"
          placeholder={`Search ${title}`}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      {error ? (
        <div className="p-4 text-red-600">Error loading {title}: {error.message}</div>
      ) : (
        <table className="min-w-full bg-white rounded">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col} className="px-4 py-2 text-left capitalize">{col.replace('_', ' ')}</th>
              ))}
              {/* Add status column if Lent sheet */}
              {tableName === 'Lent' && <th className="px-4 py-2 text-left">Status</th>}
              {/* Add delete column if Lent sheet */}
              {tableName === 'Lent' && <th className="px-4 py-2 text-left">Delete</th>}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, rowIdx) => (
              <tr key={row.id || rowIdx}>
                {columns.map(col => (
                  <td key={col} className="px-4 py-2">
                    {renderCell(row, rowIdx, col)}
                  </td>
                ))}
                {/* Add status cell if Lent sheet */}
                {tableName === 'Lent' && (
                  <>
                    <td className="px-4 py-2">{renderCell(row, rowIdx, 'status')}</td>
                    <td className="px-4 py-2">
                      <button
                        className="bg-red-100 hover:bg-red-200 text-red-700 font-semibold px-3 py-1 rounded"
                        onClick={() => handleDelete(rowIdx)}
                        type="button"
                        title="Delete row"
                      >
                        Delete
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="flex justify-end p-4">
        <button
          className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold py-2 px-6 rounded shadow"
          onClick={() => {/* TODO: Implement backend update logic here */}}
          type="button"
        >
          Submit Changes
        </button>
      </div>
    </Card>
  );
}

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

  const filteredRows = rows.filter(row =>
    columns.some(col => String(row[col] ?? '').toLowerCase().includes(search.toLowerCase()))
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
                  <td className="px-4 py-2">
                    {renderCell(row, rowIdx, 'status')}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

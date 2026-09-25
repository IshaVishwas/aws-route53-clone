"use client";

import React from "react";
import { ArrowUpDown } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  width?: string;
  sortable?: boolean;
  align?: "left" | "center" | "right";
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField?: keyof T;
  selectedIds?: string[];
  onSelectRow?: (id: string) => void;
  onSelectAll?: () => void;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  className?: string;
}

export function Table<T extends object>({
  columns,
  data,
  keyField = "id" as keyof T,
  selectedIds,
  onSelectRow,
  onSelectAll,
  isLoading = false,
  emptyState,
  className = "",
}: TableProps<T>) {
  const isAllSelected =
    data.length > 0 && selectedIds && selectedIds.length === data.length;
  const isPartiallySelected =
    selectedIds &&
    selectedIds.length > 0 &&
    selectedIds.length < data.length;

  return (
    <div
      className={`border border-[#2e384d] rounded-lg bg-[#161e2e] overflow-hidden ${className}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-gray-200 border-collapse">
          {/* Table Header */}
          <thead className="bg-[#1a2333] border-b border-[#2e384d] text-gray-300 uppercase text-[11px] font-bold tracking-wider select-none">
            <tr>
              {onSelectRow && (
                <th scope="col" className="p-3 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = Boolean(isPartiallySelected);
                    }}
                    onChange={onSelectAll}
                    aria-label="Select all rows"
                    className="w-3.5 h-3.5 rounded border-[#3b4b5e] bg-[#0f172a] text-[#ec7211] focus:ring-[#ec7211] cursor-pointer"
                  />
                </th>
              )}

              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  style={{ width: col.width }}
                  className={`p-3 font-semibold text-gray-300 ${
                    col.align === "center"
                      ? "text-center"
                      : col.align === "right"
                      ? "text-right"
                      : "text-left"
                  }`}
                >
                  <div
                    className={`inline-flex items-center space-x-1 ${
                      col.align === "right" ? "justify-end" : ""
                    }`}
                  >
                    <span>{col.header}</span>
                    {col.sortable && (
                      <ArrowUpDown className="w-3 h-3 text-gray-500" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-[#232f3e]">
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length + (onSelectRow ? 1 : 0)}
                  className="p-8 text-center text-gray-400"
                >
                  <div className="inline-flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-[#ec7211] border-t-transparent rounded-full animate-spin" />
                    <span>Loading resources...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (onSelectRow ? 1 : 0)}
                  className="p-0"
                >
                  {emptyState ? (
                    emptyState
                  ) : (
                    <div className="p-8 text-center text-gray-400">
                      No records found
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              data.map((row, index) => {
                const record = row as Record<string, unknown>;
                const rowId = String(record[keyField as string] ?? index);
                const isSelected = selectedIds?.includes(rowId);

                return (
                  <tr
                    key={rowId}
                    className={`transition-colors hover:bg-[#1e2a3c] ${
                      isSelected ? "bg-[#1e3450]/60" : ""
                    }`}
                  >
                    {onSelectRow && (
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onSelectRow(rowId)}
                          aria-label={`Select row ${rowId}`}
                          className="w-3.5 h-3.5 rounded border-[#3b4b5e] bg-[#0f172a] text-[#ec7211] focus:ring-[#ec7211] cursor-pointer"
                        />
                      </td>
                    )}

                    {columns.map((col) => (
                      <td
                        key={`${rowId}-${col.key}`}
                        className={`p-3 text-gray-200 ${
                          col.align === "center"
                            ? "text-center"
                            : col.align === "right"
                            ? "text-right"
                            : "text-left"
                        }`}
                      >
                        {col.render
                          ? col.render(row, index)
                          : String(record[col.key] ?? "-")}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

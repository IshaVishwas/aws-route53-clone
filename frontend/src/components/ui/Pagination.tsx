"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemName?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
  itemName = "items",
}: PaginationProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Handle singular vs plural grammar: e.g. "1 record" vs "20 records", "1 hosted zone" vs "5 hosted zones"
  const itemLabel =
    totalItems === 1
      ? itemName.toLowerCase() === "records"
        ? "record"
        : itemName.toLowerCase() === "hosted zones"
        ? "hosted zone"
        : itemName.endsWith("s")
        ? itemName.slice(0, -1)
        : itemName
      : itemName;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-[#161e2e] border-t border-[#2e384d] text-xs text-gray-300 select-none">
      {/* Items count & page size */}
      <div className="flex items-center space-x-4">
        <span>
          Showing{" "}
          <span className="font-semibold text-white">
            {totalItems === 0 ? "0" : `${startItem}-${endItem}`}
          </span>{" "}
          of <span className="font-semibold text-white">{totalItems}</span>{" "}
          {itemLabel}
        </span>

        {onPageSizeChange && (
          <div className="flex items-center space-x-1.5 text-gray-400">
            <label htmlFor="pageSizeSelect" className="hidden sm:inline">
              Per page:
            </label>
            <select
              id="pageSizeSelect"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-[#0f172a] border border-[#3b4b5e] rounded px-1.5 py-0.5 text-xs text-gray-200 focus:outline-none focus:border-[#539fe5]"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1 || totalItems === 0}
          className="inline-flex items-center px-2 py-1 border border-[#3b4b5e] rounded bg-[#1e293b] text-gray-200 hover:bg-[#283548] active:bg-[#161e2e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
          <span>Previous</span>
        </button>

        <span className="px-2 text-gray-400 font-medium">
          Page {totalItems === 0 ? 0 : currentPage} of {totalPages || 1}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || totalItems === 0}
          className="inline-flex items-center px-2 py-1 border border-[#3b4b5e] rounded bg-[#1e293b] text-gray-200 hover:bg-[#283548] active:bg-[#161e2e] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
        </button>
      </div>
    </div>
  );
}

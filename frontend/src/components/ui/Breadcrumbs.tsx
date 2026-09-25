"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center space-x-1.5 text-xs text-gray-400 ${className}`}
    >
      <Link
        href="/"
        className="text-[#539fe5] hover:text-[#8cbcf5] hover:underline transition-colors"
      >
        Route 53
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={`${item.label}-${index}`}>
            <ChevronRight className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-[#539fe5] hover:text-[#8cbcf5] hover:underline transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={`truncate ${
                  isLast ? "font-semibold text-gray-200" : "text-gray-400"
                }`}
              >
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

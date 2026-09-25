"use client";

import React from "react";
import { Breadcrumbs, BreadcrumbItem } from "@/components/ui/Breadcrumbs";
import { ExternalLink } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  infoLink?: {
    text: string;
    href: string;
  };
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  infoLink,
}: PageHeaderProps) {
  return (
    <div className="space-y-3 pb-3 border-b border-[#2e384d]">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs items={breadcrumbs} />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {title}
            </h1>
            {infoLink && (
              <a
                href={infoLink.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-xs text-[#539fe5] hover:text-[#8cbcf5] hover:underline transition-colors"
              >
                <span>{infoLink.text}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          {description && (
            <p className="text-xs sm:text-sm text-gray-400 max-w-3xl leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center space-x-2 shrink-0">{actions}</div>
        )}
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { FolderSearch } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  actionLabel?: string;
  onAction?: () => void;
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon = FolderSearch,
  actionLabel,
  onAction,
  secondaryAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`border border-dashed border-[#2e384d] rounded-lg p-8 sm:p-12 text-center bg-[#161e2e] ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-[#1e293b] flex items-center justify-center mx-auto mb-3 text-gray-400 border border-[#2e384d]">
        <Icon className="w-6 h-6 text-gray-400" />
      </div>

      <h3 className="text-sm sm:text-base font-bold text-white mb-1">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto mb-6">
        {description}
      </p>

      {(actionLabel || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {actionLabel && onAction && (
            <Button variant="primary" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="secondary" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

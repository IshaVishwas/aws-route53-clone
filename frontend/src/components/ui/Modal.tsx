"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footerActions?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footerActions,
  maxWidth = "md",
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Dim backdrop */}
      <div
        className="fixed inset-0 bg-black/70 transition-opacity backdrop-blur-2xs"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          className={`relative w-full ${maxWidthClasses[maxWidth]} bg-[#161e2e] rounded-lg shadow-2xl border border-[#2e384d] overflow-hidden transform transition-all text-gray-200`}
        >
          {/* Header */}
          <div className="flex items-start justify-between px-6 py-4 border-b border-[#232f3e] bg-[#1a2333]">
            <div>
              <h2 className="text-base font-bold text-white">{title}</h2>
              {description && (
                <p className="text-xs text-gray-400 mt-0.5">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="text-gray-400 hover:text-white p-1 rounded hover:bg-[#283548] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="px-6 py-4 text-xs sm:text-sm text-gray-200">
            {children}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 px-6 py-3 border-t border-[#232f3e] bg-[#1a2333]">
            {footerActions ? (
              footerActions
            ) : (
              <Button variant="secondary" size="md" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

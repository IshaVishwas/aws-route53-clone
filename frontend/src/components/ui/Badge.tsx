import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "info" | "warning" | "danger" | "neutral";
  size?: "sm" | "md";
  dot?: boolean;
}

export function Badge({
  children,
  variant = "neutral",
  size = "md",
  dot = false,
}: BadgeProps) {
  const sizeClasses =
    size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs";

  const variantClasses = {
    success: "bg-emerald-950/70 text-emerald-300 border border-emerald-700/60",
    info: "bg-blue-950/70 text-blue-300 border border-blue-700/60",
    warning: "bg-amber-950/70 text-amber-300 border border-amber-700/60",
    danger: "bg-red-950/70 text-red-300 border border-red-700/60",
    neutral: "bg-slate-800/80 text-slate-300 border border-slate-700",
  };

  const dotClasses = {
    success: "bg-emerald-400",
    info: "bg-blue-400",
    warning: "bg-amber-400",
    danger: "bg-red-400",
    neutral: "bg-gray-400",
  };

  return (
    <span
      className={`inline-flex items-center space-x-1.5 font-medium rounded ${sizeClasses} ${variantClasses[variant]}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClasses[variant]}`}
        />
      )}
      <span>{children}</span>
    </span>
  );
}

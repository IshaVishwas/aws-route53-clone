import React from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "link";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  isLoading = false,
  icon,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-[#0f172a] disabled:opacity-50 disabled:cursor-not-allowed text-xs select-none cursor-pointer";

  const sizeStyles = {
    sm: "px-2.5 py-1 text-xs gap-1.5",
    md: "px-3.5 py-1.5 text-xs gap-2",
    lg: "px-4.5 py-2 text-sm gap-2",
  };

  const variantStyles = {
    primary:
      "bg-[#ec7211] hover:bg-[#eb5f07] text-white focus:ring-[#ec7211] font-semibold shadow-xs border border-transparent active:bg-[#d95304]",
    secondary:
      "bg-[#1e293b] hover:bg-[#283548] text-gray-200 border border-[#3b4b5e] focus:ring-[#539fe5] shadow-xs active:bg-[#161e2e]",
    danger:
      "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 font-semibold shadow-xs active:bg-red-850",
    ghost:
      "bg-transparent hover:bg-[#1e293b] text-gray-300 active:bg-[#283548] focus:ring-gray-600",
    link: "bg-transparent text-[#539fe5] hover:text-[#8cbcf5] hover:underline p-0 border-none shadow-none focus:ring-0",
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
}

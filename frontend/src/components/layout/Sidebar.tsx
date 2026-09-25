"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Layers,
  Activity,
  GitBranch,
  ShieldCheck,
  Server,
  LayoutDashboard,
  X,
  Radio,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  description?: string;
}

const navItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    description: "Route 53 overview & health",
  },
  {
    name: "Hosted zones",
    href: "/hosted-zones",
    icon: Layers,
    description: "Manage DNS domains & records",
  },
  {
    name: "Traffic policies",
    href: "/traffic-policies",
    icon: GitBranch,
    badge: "Soon",
    description: "Visual DNS traffic routing",
  },
  {
    name: "Health checks",
    href: "/health-checks",
    icon: Activity,
    badge: "Soon",
    description: "Endpoint uptime & failover",
  },
  {
    name: "Resolver",
    href: "/resolver",
    icon: Server,
    badge: "Soon",
    description: "VPC & hybrid recursive DNS",
  },
  {
    name: "Profiles",
    href: "/profiles",
    icon: ShieldCheck,
    badge: "Soon",
    description: "Multi-account DNS rules",
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-2xs"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-12 left-0 h-[calc(100vh-3rem)] w-64 bg-[#161e2e] border-r border-[#232f3e] z-40 md:z-10 flex flex-col shrink-0 transition-transform duration-200 ease-in-out select-none shadow-sm md:shadow-none ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-3.5 border-b border-[#232f3e] flex items-center justify-between bg-[#1a2333]/50">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-200">
              Route 53
            </h2>
            <p className="text-[11px] text-gray-400">Domain Name System</p>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="md:hidden p-1 text-gray-400 hover:text-white rounded hover:bg-[#232f3e]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="p-2 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={handleLinkClick}
                className={`group flex items-center justify-between px-3 py-2 rounded text-xs transition-colors ${
                  isActive
                    ? "bg-[#1f2a3c] text-white font-bold border-l-4 border-[#ec7211] pl-2 shadow-xs"
                    : "text-gray-300 hover:bg-[#1f2a3c] hover:text-white font-medium"
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive
                        ? "text-[#ec7211]"
                        : "text-gray-400 group-hover:text-gray-200"
                    }`}
                  />
                  <span className="truncate">{item.name}</span>
                </div>

                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#1e293b] text-gray-400 border border-[#2e384d] font-mono">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Console Region Status Footer */}
        <div className="p-3 border-t border-[#232f3e] bg-[#1a2333]/40 text-[11px] text-gray-400 space-y-1.5">
          <div className="flex items-center justify-between text-gray-300">
            <span className="font-medium flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              DNS Service Status
            </span>
            <span className="text-[10px] font-semibold text-emerald-300 px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-800">
              Active
            </span>
          </div>
          <p className="text-[10px] text-gray-400 leading-tight">
            Amazon Route 53 control plane and authoritative DNS network.
          </p>
        </div>
      </aside>
    </>
  );
}

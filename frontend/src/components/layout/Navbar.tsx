"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Globe,
  Bell,
  User,
  Search,
  HelpCircle,
  Menu,
  ChevronDown,
  LogOut,
  ExternalLink,
  Sliders,
  Building,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/auth-context";

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export function Navbar({ onToggleSidebar }: NavbarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [helpMenuOpen, setHelpMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const accountMenuRef = useRef<HTMLDivElement>(null);
  const helpMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setAccountMenuOpen(false);
      }
      if (
        helpMenuRef.current &&
        !helpMenuRef.current.contains(event.target as Node)
      ) {
        setHelpMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogoutClick = async () => {
    setAccountMenuOpen(false);
    try {
      await logout();
      showToast({
        type: "info",
        title: "Signed Out",
        message: "Your session has been terminated successfully.",
      });
      router.push("/login");
    } catch {
      router.push("/login");
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      showToast({
        type: "info",
        title: "Global Console Search",
        message: `Searching Route 53 resources for: "${searchQuery}"`,
      });
    }
  };

  const username = user?.email ? user.email.split("@")[0] : "admin";
  const userEmail = user?.email || "admin@route53.aws";

  return (
    <header className="h-12 bg-[#161e2e] text-white flex items-center justify-between px-3 sm:px-4 text-xs font-sans select-none border-b border-[#232f3e] z-30 sticky top-0 shadow-xs">
      {/* Left: Mobile hamburger + AWS Branding */}
      <div className="flex items-center space-x-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Toggle navigation menu"
            className="md:hidden p-1.5 text-gray-300 hover:text-white rounded hover:bg-[#232f3e] transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <Link
          href="/"
          className="flex items-center space-x-2.5 hover:opacity-95 transition-opacity"
        >
          {/* Authentic AWS Console Logo: White wordmark + Smile arrow, transparent background */}
          <div className="flex items-center text-white shrink-0" aria-label="AWS">
            <svg
              viewBox="0.02 102.6 511.9 306.4"
              className="h-4.5 sm:h-5 w-auto text-white fill-current"
              xmlns="http://www.w3.org/2000/svg"
              xmlSpace="preserve"
              role="img"
              aria-label="Amazon Web Services"
            >
              <path d="M144.3 214.1c0 6.3.7 11.4 1.9 15.2 1.4 3.7 3.1 7.8 5.4 12.3.9 1.4 1.2 2.7 1.2 3.9 0 1.7-1 3.4-3.2 5.1l-10.7 7.2c-1.5 1-3.1 1.5-4.4 1.5-1.7 0-3.4-.9-5.1-2.4-2.4-2.6-4.4-5.3-6.1-8-1.7-2.9-3.4-6.1-5.3-10-13.3 15.7-30 23.5-50.1 23.5-14.3 0-25.7-4.1-34.1-12.3-8.3-8.2-12.6-19.1-12.6-32.7 0-14.5 5.1-26.2 15.5-35.1S60.8 169 78.4 169c5.8 0 11.7.5 18.1 1.4s12.8 2.2 19.6 3.7v-12.4c0-12.9-2.7-22-8-27.2-5.4-5.3-14.6-7.8-27.8-7.8-6 0-12.1.7-18.4 2.2s-12.4 3.4-18.4 5.8c-2.7 1.2-4.8 1.9-6 2.2s-2 .5-2.7.5c-2.4 0-3.6-1.7-3.6-5.3v-8.3c0-2.7.3-4.8 1.2-6s2.4-2.4 4.8-3.6c6-3.1 13.1-5.6 21.5-7.7 8.3-2.2 17.2-3.2 26.6-3.2 20.3 0 35.1 4.6 44.6 13.8 9.4 9.2 14.1 23.2 14.1 41.9v55.2h.3zM75.2 240c5.6 0 11.4-1 17.5-3.1 6.1-2 11.6-5.8 16.2-10.9 2.7-3.2 4.8-6.8 5.8-10.9s1.7-9 1.7-14.8v-7.2c-4.9-1.2-10.2-2.2-15.7-2.9-5.4-.7-10.7-1-16-1-11.4 0-19.8 2.2-25.4 6.8S51 207.1 51 215.6c0 8 2 14 6.3 18.1 4.1 4.2 10 6.3 17.9 6.3m136.7 18.4c-3.1 0-5.1-.5-6.5-1.7-1.4-1-2.6-3.4-3.6-6.6l-40-131.6c-1-3.4-1.5-5.6-1.5-6.8 0-2.7 1.4-4.3 4.1-4.3h16.7c3.2 0 5.4.5 6.6 1.7 1.4 1 2.4 3.4 3.4 6.6l28.6 112.7 26.6-112.7c.9-3.4 1.9-5.6 3.2-6.6 1.4-1 3.7-1.7 6.8-1.7H270c3.2 0 5.4.5 6.8 1.7 1.4 1 2.6 3.4 3.2 6.6l26.9 114.1 29.5-114.1c1-3.4 2.2-5.6 3.4-6.6 1.4-1 3.6-1.7 6.6-1.7h15.8c2.7 0 4.3 1.4 4.3 4.3 0 .9-.2 1.7-.3 2.7-.2 1-.5 2.4-1.2 4.3l-41 131.6q-1.5 5.1-3.6 6.6c-1.4 1-3.6 1.7-6.5 1.7h-14.6c-3.2 0-5.4-.5-6.8-1.7s-2.6-3.4-3.2-6.8l-26.4-109.8L236.7 250c-.9 3.4-1.9 5.6-3.2 6.8-1.4 1.2-3.7 1.7-6.8 1.7h-14.8zm218.8 4.6c-8.9 0-17.7-1-26.2-3.1-8.5-2-15.2-4.3-19.6-6.8-2.7-1.5-4.6-3.2-5.3-4.8s-1-3.2-1-4.8v-8.7c0-3.6 1.4-5.3 3.9-5.3 1 0 2 .2 3.1.5 1 .3 2.6 1 4.3 1.7 5.8 2.6 12.1 4.6 18.7 6 6.8 1.4 13.5 2 20.3 2 10.7 0 19.1-1.9 24.9-5.6s8.9-9.2 8.9-16.2c0-4.8-1.5-8.7-4.6-11.9s-8.9-6.1-17.2-8.9l-24.7-7.7c-12.4-3.9-21.6-9.7-27.2-17.4-5.6-7.5-8.5-15.8-8.5-24.7 0-7.2 1.5-13.5 4.6-18.9s7.2-10.2 12.3-14c5.1-3.9 10.9-6.8 17.7-8.9 6.8-2 14-2.9 21.5-2.9 3.7 0 7.7.2 11.4.7 3.9.5 7.5 1.2 11.1 1.9 3.4.9 6.6 1.7 9.7 2.7s5.4 2 7.2 3.1c2.4 1.4 4.1 2.7 5.1 4.3 1 1.4 1.5 3.2 1.5 5.6v8c0 3.6-1.4 5.4-3.9 5.4-1.4 0-3.6-.7-6.5-2q-14.55-6.6-32.7-6.6c-9.7 0-17.4 1.5-22.6 4.8s-8 8.2-8 15.2c0 4.8 1.7 8.9 5.1 12.1s9.7 6.5 18.7 9.4l24.2 7.7c12.3 3.9 21.1 9.4 26.4 16.3s7.8 15 7.8 23.8c0 7.3-1.5 14-4.4 19.8-3.1 5.8-7.2 10.9-12.4 15-5.3 4.3-11.6 7.3-18.9 9.5-8 2.5-16 3.7-24.7 3.7" />
              <path d="M462.9 345.7c-56 41.4-137.4 63.3-207.4 63.3-98.1 0-186.5-36.3-253.2-96.6-5.3-4.8-.5-11.2 5.8-7.5 72.2 41.9 161.3 67.3 253.4 67.3 62.2 0 130.4-12.9 193.3-39.5 9.3-4.2 17.3 6.2 8.1 13" />
              <path d="M486.2 319.2c-7.2-9.2-47.3-4.4-65.6-2.2-5.4.7-6.3-4.1-1.4-7.7 32-22.5 84.6-16 90.8-8.5 6.1 7.7-1.7 60.3-31.7 85.5-4.6 3.9-9 1.9-7-3.2 6.9-16.9 22.1-54.9 14.9-63.9" />
            </svg>
          </div>

          {/* Subtle vertical divider between AWS branding and Route 53 service */}
          <span className="h-4 w-px bg-[#3b4b5e]" aria-hidden="true" />

          {/* Route 53 Service Identity */}
          <span className="font-semibold text-gray-100 flex items-center gap-1.5 text-sm">
            <Globe className="w-4 h-4 text-[#ff9900]" />
            Route 53
          </span>
        </Link>

        <span className="hidden sm:inline text-gray-600">|</span>
        <span className="hidden lg:inline text-xs text-gray-300 font-medium">
          DNS and Domain Management
        </span>
      </div>

      {/* Middle: Global Console Search */}
      <div className="flex-1 max-w-md mx-3 hidden sm:block">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Route 53 features, zones, and records [Alt+S]"
            className="w-full bg-[#0d141e] border border-[#3b4b5e] rounded text-xs pl-8 pr-12 py-1.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-[#539fe5] focus:ring-1 focus:ring-[#539fe5] transition-colors"
          />
          <kbd className="hidden md:inline-block absolute right-2.5 top-1.5 text-[10px] text-gray-400 bg-[#1e293b] border border-gray-700 px-1 rounded font-mono">
            Alt+S
          </kbd>
        </form>
      </div>

      {/* Right Controls: Region, Help, Notifications & Account */}
      <div className="flex items-center space-x-2 sm:space-x-3 text-xs">
        {/* Global Region Indicator */}
        <div className="hidden md:flex items-center space-x-1.5 px-2 py-1 rounded bg-[#232f3e] text-gray-300 border border-gray-700">
          <Globe className="w-3.5 h-3.5 text-[#ff9900]" />
          <span className="text-[11px]">Global</span>
        </div>

        {/* Help Menu */}
        <div className="relative" ref={helpMenuRef}>
          <button
            type="button"
            onClick={() => setHelpMenuOpen(!helpMenuOpen)}
            aria-label="Help and documentation"
            className="p-1.5 text-gray-300 hover:text-white rounded hover:bg-[#232f3e] transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {helpMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-[#161e2e] text-gray-100 rounded-lg shadow-2xl border border-[#2e384d] py-1.5 z-50 text-xs">
              <div className="px-3 py-1.5 font-bold text-gray-100 border-b border-[#232f3e]">
                Route 53 Documentation
              </div>
              <a
                href="https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/Welcome.html"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between px-3 py-2 hover:bg-[#1f2a3c] text-gray-200 transition-colors"
              >
                <span>Route 53 Developer Guide</span>
                <ExternalLink className="w-3 h-3 text-gray-400" />
              </a>
              <a
                href="https://docs.aws.amazon.com/Route53/latest/APIReference/Welcome.html"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between px-3 py-2 hover:bg-[#1f2a3c] text-gray-200 transition-colors"
              >
                <span>API Reference</span>
                <ExternalLink className="w-3 h-3 text-gray-400" />
              </a>
              <div className="border-t border-[#232f3e] my-1" />
              <div className="px-3 py-1.5 text-[11px] text-gray-400">
                Route 53 Assignment Clone v1.0
              </div>
            </div>
          )}
        </div>

        {/* Notifications Icon */}
        <button
          type="button"
          onClick={() =>
            showToast({
              type: "info",
              title: "Console Notifications",
              message: "All Route 53 control plane systems operating normally.",
            })
          }
          aria-label="Notifications"
          className="p-1.5 text-gray-300 hover:text-white rounded hover:bg-[#232f3e] transition-colors relative"
        >
          <Bell className="w-4 h-4" />
          <span className="w-1.5 h-1.5 bg-[#ff9900] rounded-full absolute top-1 right-1" />
        </button>

        {/* Authenticated Account / User Dropdown */}
        <div className="relative" ref={accountMenuRef}>
          <button
            type="button"
            onClick={() => setAccountMenuOpen(!accountMenuOpen)}
            className="flex items-center space-x-2 pl-2 pr-1 py-1 rounded hover:bg-[#232f3e] transition-colors border border-transparent hover:border-gray-700"
          >
            <div className="w-5 h-5 rounded-full bg-[#ec7211] flex items-center justify-center font-bold text-white text-[10px]">
              <User className="w-3 h-3" />
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="font-medium text-gray-200 text-xs leading-none">
                {username}
              </span>
              <span className="text-[10px] text-gray-400 leading-tight">
                1234-5678-9012
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {accountMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-[#161e2e] text-gray-100 rounded-lg shadow-2xl border border-[#2e384d] py-2 z-50 text-xs">
              <div className="px-4 py-2 border-b border-[#232f3e] bg-[#1a2333]">
                <div className="font-bold text-white text-sm truncate">
                  {userEmail}
                </div>
                <div className="flex items-center space-x-1 text-gray-400 text-[11px] mt-0.5">
                  <Building className="w-3 h-3" />
                  <span>Account ID: 1234-5678-9012</span>
                </div>
                <div className="mt-1 inline-flex items-center px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-semibold">
                  AdministratorAccess
                </div>
              </div>

              <div className="py-1">
                <div className="px-4 py-1.5 text-gray-400 text-[11px] font-semibold uppercase tracking-wider">
                  Session & Context
                </div>
                <div className="px-4 py-1.5 text-gray-300 flex justify-between">
                  <span>User ID:</span>
                  <span className="font-mono text-[10px] text-gray-400 truncate max-w-[140px]">
                    {user?.id || "admin-root"}
                  </span>
                </div>
                <div className="px-4 py-1.5 text-gray-300 flex justify-between">
                  <span>Active Service:</span>
                  <span className="font-semibold text-white">Route 53</span>
                </div>
                <div className="px-4 py-1.5 text-gray-300 flex justify-between">
                  <span>Routing Context:</span>
                  <span className="font-semibold text-white">Global DNS</span>
                </div>
              </div>

              <div className="border-t border-[#232f3e] py-1">
                <button
                  type="button"
                  onClick={() => {
                    setAccountMenuOpen(false);
                    showToast({
                      type: "info",
                      title: "Preferences",
                      message: "Account settings dialog placeholder.",
                    });
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#1f2a3c] text-gray-200 flex items-center space-x-2 transition-colors"
                >
                  <Sliders className="w-3.5 h-3.5 text-gray-400" />
                  <span>Account Settings</span>
                </button>

                <button
                  type="button"
                  onClick={handleLogoutClick}
                  className="w-full text-left px-4 py-2 hover:bg-red-950/40 text-red-400 flex items-center space-x-2 font-medium transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 text-red-400" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

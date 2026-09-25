"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthProvider, useAuth } from "@/lib/auth-context";

function AppShellContent({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLoginPage) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, isLoginPage, router]);

  // If on login page, render clean login view without console shell
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Loading state while verifying session: prevents content flashing
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f141c] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#ec7211] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-gray-300 font-semibold tracking-wide">
            Verifying AWS Route 53 session...
          </span>
        </div>
      </div>
    );
  }

  // If unauthenticated on protected page, return null while router redirects to /login
  if (!isAuthenticated) {
    return null;
  }

  // Authenticated console view
  return (
    <div className="min-h-screen flex flex-col bg-[#0f141c] text-gray-100 font-sans antialiased">
      <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
      <div className="flex flex-1 relative">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppShellContent>{children}</AppShellContent>
      </ToastProvider>
    </AuthProvider>
  );
}

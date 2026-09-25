"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Globe,
  KeyRound,
  Mail,
  AlertCircle,
  Lock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/Toast";

const DEMO_EMAIL = "admin@route53.aws";
const DEMO_PASSWORD = "AdminPassword123!";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect to dashboard immediately
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/");
    }
  }, [isLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage("Please enter your account email address.");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your account password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(cleanEmail, password);
      showToast({
        type: "success",
        title: "Authentication Successful",
        message: "Welcome to AWS Route 53 Management Console.",
      });
      router.push("/");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to sign in. Please try again.";
      setErrorMessage(msg);
      showToast({
        type: "error",
        title: "Sign in Failed",
        message: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemo = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setErrorMessage(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f141c] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#ec7211] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-gray-400 font-medium">
            Verifying AWS session...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f141c] flex flex-col justify-between font-sans text-gray-100">
      {/* AWS Minimal Sign-in Header */}
      <header className="h-12 bg-[#161e2e] text-white flex items-center px-4 sm:px-8 border-b border-[#232f3e]">
        <div className="flex items-center space-x-2.5">
          <div className="bg-[#ff9900] text-black font-black text-xs px-1.5 py-0.5 rounded tracking-wider">
            AWS
          </div>
          <span className="font-semibold text-gray-100 flex items-center gap-1 text-sm">
            <Globe className="w-4 h-4 text-[#ff9900]" />
            Route 53 Console Sign-In
          </span>
        </div>
      </header>

      {/* Center Sign-in Form Card */}
      <main className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-md bg-[#161e2e] border border-[#2e384d] rounded-lg shadow-2xl p-6 sm:p-8 space-y-6">
          {/* Card Header */}
          <div className="text-center space-y-1.5">
            <div className="w-10 h-10 rounded bg-[#ff9900]/10 text-[#ec7211] flex items-center justify-center mx-auto border border-[#ff9900]/20">
              <Lock className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Sign In to Route 53
            </h1>
            <p className="text-xs text-gray-400">
              Manage DNS hosted zones, routing policies, and domain records
            </p>
          </div>

          {/* Error Alert Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="p-3 bg-red-950/70 border border-red-800 rounded text-xs text-red-200 flex items-start space-x-2.5 animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">Authentication error</p>
                <p className="mt-0.5 text-red-300">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="emailInput"
                className="block text-xs font-bold text-gray-200 mb-1"
              >
                Root user / IAM email address
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5 pointer-events-none" />
                <input
                  id="emailInput"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                  className="w-full text-xs pl-8 pr-3 py-2 bg-[#0f172a] border border-[#3b4b5e] rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#539fe5] focus:ring-1 focus:ring-[#539fe5] transition-colors"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="passwordInput"
                className="block text-xs font-bold text-gray-200 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <KeyRound className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5 pointer-events-none" />
                <input
                  id="passwordInput"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full text-xs pl-8 pr-3 py-2 bg-[#0f172a] border border-[#3b4b5e] rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#539fe5] focus:ring-1 focus:ring-[#539fe5] transition-colors"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              className="w-full text-sm font-bold shadow-xs py-2.5"
            >
              Sign in to Route 53
            </Button>
          </form>

          {/* Demo Credentials Helper Box */}
          <div className="p-3.5 bg-[#0f172a] border border-[#2e384d] rounded-lg text-xs space-y-2">
            <div className="flex items-center justify-between text-blue-200 font-bold">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#539fe5]" />
                Demo Credentials
              </span>
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-[11px] font-semibold text-[#539fe5] hover:text-[#8cbcf5] hover:underline cursor-pointer transition-colors"
              >
                Autofill
              </button>
            </div>

            <div className="font-mono text-[11px] text-gray-300 space-y-0.5 bg-[#161e2e] p-2.5 rounded border border-[#2e384d]">
              <div>
                <span className="text-gray-500">Email: </span>
                <span className="font-semibold text-white">{DEMO_EMAIL}</span>
              </div>
              <div>
                <span className="text-gray-500">Password: </span>
                <span className="font-semibold text-white">{DEMO_PASSWORD}</span>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 leading-tight">
              Pre-seeded in SQLite database with secure PBKDF2 HMAC SHA-256 hash.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-[11px] text-gray-400 border-t border-[#232f3e] bg-[#161e2e]">
        <span>AWS Route 53 Assignment Clone • Mock Authentication System</span>
      </footer>
    </div>
  );
}

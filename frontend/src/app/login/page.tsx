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

          <span className="font-semibold text-gray-100 flex items-center gap-1.5 text-sm">
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

"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Layers,
  Activity,
  GitBranch,
  Server,
  ArrowRight,
  RefreshCw,
  Plus,
  HelpCircle,
  ShieldCheck,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import { checkBackendHealth, listHostedZones } from "@/lib/api";

interface SystemStatus {
  status?: string;
  service?: string;
  database?: string;
  timestamp?: string;
  error?: string;
  loading: boolean;
}

interface ZoneSummary {
  total: number;
  public: number;
  private: number;
  totalRecords: number;
  loading: boolean;
  error: string | null;
}

export default function DashboardPage() {
  const [backendStatus, setBackendStatus] = useState<SystemStatus>({
    loading: true,
  });
  const [zoneSummary, setZoneSummary] = useState<ZoneSummary>({
    total: 0,
    public: 0,
    private: 0,
    totalRecords: 0,
    loading: true,
    error: null,
  });

  const fetchZoneSummary = useCallback(() => {
    setZoneSummary((prev) => ({ ...prev, loading: true }));
    Promise.all([
      listHostedZones({ page_size: 100 }),
      listHostedZones({ type: "PUBLIC", page_size: 1 }),
      listHostedZones({ type: "PRIVATE", page_size: 1 }),
    ])
      .then(([allRes, pubRes, privRes]) => {
        const totalRecords = (allRes.items || []).reduce(
          (acc, z) => acc + (z.record_count || 0),
          0
        );
        setZoneSummary({
          total: allRes.total,
          public: pubRes.total,
          private: privRes.total,
          totalRecords,
          loading: false,
          error: null,
        });
      })
      .catch((err: unknown) => {
        setZoneSummary((prev) => ({
          ...prev,
          loading: false,
          error:
            err instanceof Error ? err.message : "Failed to load zone summary",
        }));
      });
  }, []);

  const verifyBackend = useCallback(() => {
    setBackendStatus((prev) => ({ ...prev, loading: true }));
    checkBackendHealth()
      .then((data) => {
        setBackendStatus({
          status: data.status,
          service: data.service,
          database: data.database,
          timestamp: data.timestamp,
          loading: false,
        });
      })
      .catch((err: unknown) => {
        setBackendStatus({
          error:
            err instanceof Error ? err.message : "Failed to reach backend",
          loading: false,
        });
      });
    fetchZoneSummary();
  }, [fetchZoneSummary]);

  useEffect(() => {
    let isMounted = true;
    checkBackendHealth()
      .then((data) => {
        if (isMounted) {
          setBackendStatus({
            status: data.status,
            service: data.service,
            database: data.database,
            timestamp: data.timestamp,
            loading: false,
          });
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setBackendStatus({
            error:
              err instanceof Error ? err.message : "Failed to reach backend",
            loading: false,
          });
        }
      });

    Promise.all([
      listHostedZones({ page_size: 100 }),
      listHostedZones({ type: "PUBLIC", page_size: 1 }),
      listHostedZones({ type: "PRIVATE", page_size: 1 }),
    ])
      .then(([allRes, pubRes, privRes]) => {
        if (isMounted) {
          const totalRecords = (allRes.items || []).reduce(
            (acc, z) => acc + (z.record_count || 0),
            0
          );
          setZoneSummary({
            total: allRes.total,
            public: pubRes.total,
            private: privRes.total,
            totalRecords,
            loading: false,
            error: null,
          });
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setZoneSummary((prev) => ({
            ...prev,
            loading: false,
            error:
              err instanceof Error
                ? err.message
                : "Failed to load zone summary",
          }));
        }
      });

    const onFocus = () => {
      fetchZoneSummary();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      isMounted = false;
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchZoneSummary]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* AWS Style Page Header */}
      <PageHeader
        title="Route 53 Dashboard"
        description="Amazon Route 53 is a highly available and scalable cloud Domain Name System (DNS) web service. It is designed to give developers and businesses an extremely reliable and cost effective way to route end users to Internet applications."
        infoLink={{
          text: "What is Route 53?",
          href: "https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/Welcome.html",
        }}
        actions={
          <div className="flex items-center space-x-2">
            <Link href="/hosted-zones">
              <Button
                variant="primary"
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Create hosted zone
              </Button>
            </Link>
          </div>
        }
      />

      {/* Main Grid: Summary & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hosted Zones Resource Summary (2 cols on large screen) */}
        <div className="lg:col-span-2 bg-[#161e2e] border border-[#2e384d] rounded-lg p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#232f3e]">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-[#ff9900]" />
                <h2 className="text-sm font-bold text-white">
                  DNS Management Summary
                </h2>
              </div>
              <span className="text-[11px] text-gray-400 font-mono">
                Scope: Global
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4">
              <div className="p-3 bg-[#0f172a] border border-[#2e384d] rounded">
                <span className="text-[11px] text-gray-400 font-semibold uppercase">
                  Total Hosted Zones
                </span>
                <div className="text-2xl font-bold text-white mt-1">
                  {zoneSummary.loading ? (
                    <span className="text-gray-500 text-lg">...</span>
                  ) : (
                    zoneSummary.total
                  )}
                </div>
                <span className="text-[10px] text-gray-400">
                  {zoneSummary.loading
                    ? "Loading..."
                    : zoneSummary.total === 0
                    ? "No zones created yet"
                    : `${zoneSummary.total} configured ${
                        zoneSummary.total === 1 ? "zone" : "zones"
                      }`}
                </span>
              </div>

              <div className="p-3 bg-[#0f172a] border border-[#2e384d] rounded">
                <span className="text-[11px] text-gray-400 font-semibold uppercase">
                  Public Zones
                </span>
                <div className="text-2xl font-bold text-white mt-1">
                  {zoneSummary.loading ? (
                    <span className="text-gray-500 text-lg">...</span>
                  ) : (
                    zoneSummary.public
                  )}
                </div>
                <span className="text-[10px] text-gray-400">
                  Internet-facing domains
                </span>
              </div>

              <div className="p-3 bg-[#0f172a] border border-[#2e384d] rounded">
                <span className="text-[11px] text-gray-400 font-semibold uppercase">
                  Private Zones
                </span>
                <div className="text-2xl font-bold text-white mt-1">
                  {zoneSummary.loading ? (
                    <span className="text-gray-500 text-lg">...</span>
                  ) : (
                    zoneSummary.private
                  )}
                </div>
                <span className="text-[10px] text-gray-400">
                  VPC internal domains
                </span>
              </div>
            </div>

            <div className="p-3 bg-[#1e3450]/40 border border-[#2563eb]/40 rounded text-xs text-blue-200 flex items-start space-x-2.5">
              <Compass className="w-4 h-4 text-[#539fe5] shrink-0 mt-0.5" />
              <div>
                {zoneSummary.total === 0 ? (
                  <>
                    <span className="font-bold text-white">Initial Setup State:</span> You
                    currently have no hosted zones in this AWS account. Create a
                    hosted zone to start managing records (A, CNAME, MX, TXT,
                    etc.) for your domain names.
                  </>
                ) : (
                  <>
                    <span className="font-bold text-white">Active Configuration:</span> You
                    currently have {zoneSummary.total} hosted{" "}
                    {zoneSummary.total === 1 ? "zone" : "zones"} configured (
                    {zoneSummary.public} public, {zoneSummary.private} private).
                    Manage your DNS routing and records from the Hosted Zones
                    console.
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#232f3e] flex items-center justify-between text-xs">
            <span className="text-gray-400">Ready to configure DNS</span>
            <Link
              href="/hosted-zones"
              className="text-[#539fe5] hover:text-[#8cbcf5] font-medium inline-flex items-center space-x-1 transition-colors"
            >
              <span>Manage Hosted Zones</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Route 53 Service Health & Status Card */}
        <div className="bg-[#161e2e] border border-[#2e384d] rounded-lg p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#232f3e]">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white">
                  Route 53 Service Status
                </h2>
              </div>
              <button
                type="button"
                onClick={verifyBackend}
                disabled={backendStatus.loading}
                title="Refresh dashboard and service status"
                aria-label="Refresh dashboard and service status"
                className="text-gray-400 hover:text-white p-1 rounded hover:bg-[#1e293b] focus:outline-none focus:ring-1 focus:ring-[#539fe5] transition-colors cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    backendStatus.loading ? "animate-spin" : ""
                  }`}
                />
              </button>
            </div>

            <div className="space-y-3 mt-4 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-[#0f172a] rounded border border-[#2e384d]">
                <span className="text-gray-300">DNS Service</span>
                <div>
                  {backendStatus.loading ? (
                    <Badge variant="neutral" size="sm">
                      Checking...
                    </Badge>
                  ) : backendStatus.status === "online" ? (
                    <Badge variant="success" size="sm" dot>
                      Operational
                    </Badge>
                  ) : (
                    <Badge variant="warning" size="sm" dot>
                      Degraded
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-[#0f172a] rounded border border-[#2e384d]">
                <span className="text-gray-300">Control Plane</span>
                <div>
                  {backendStatus.loading ? (
                    <Badge variant="neutral" size="sm">
                      Checking...
                    </Badge>
                  ) : backendStatus.status === "online" ? (
                    <Badge variant="success" size="sm" dot>
                      Operational
                    </Badge>
                  ) : (
                    <Badge variant="warning" size="sm" dot>
                      Degraded
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-[#0f172a] rounded border border-[#2e384d]">
                <span className="text-gray-300">Hosted Zones</span>
                <span className="font-mono text-[11px] text-gray-200 font-semibold">
                  {zoneSummary.loading
                    ? "Loading..."
                    : `${zoneSummary.total} configured ${
                        zoneSummary.total === 1 ? "zone" : "zones"
                      }`}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-[#0f172a] rounded border border-[#2e384d]">
                <span className="text-gray-300">DNS Records</span>
                <span className="font-mono text-[11px] text-gray-200 font-semibold">
                  {zoneSummary.loading
                    ? "Loading..."
                    : `${zoneSummary.totalRecords} configured ${
                        zoneSummary.totalRecords === 1 ? "record" : "records"
                      }`}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#232f3e] text-[11px] text-gray-400 space-y-1.5">
            <div className="flex items-center justify-between">
              <span>Global Anycast Network</span>
              <span className="text-emerald-400 font-medium flex items-center gap-1.5 text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                All Systems Normal
              </span>
            </div>
            <p className="text-[10px] text-gray-500 italic">
              Demo environment — service status is simulated
            </p>
          </div>
        </div>
      </div>

      {/* Route 53 Core Feature Areas */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider">
          Route 53 Service Areas
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Hosted Zones */}
          <div className="bg-[#161e2e] border border-[#2e384d] rounded-lg p-4 shadow-2xs flex flex-col justify-between hover:border-[#475569] transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded bg-blue-950/60 text-[#539fe5] flex items-center justify-center border border-blue-800/60">
                  <Layers className="w-4 h-4" />
                </div>
                <Badge variant="info" size="sm">
                  Active Area
                </Badge>
              </div>
              <h3 className="text-sm font-bold text-white">Hosted Zones</h3>
              <p className="text-xs text-gray-400 mt-1">
                Manage public and private hosted zones. Configure DNS records (A,
                AAAA, CNAME, MX, TXT, SRV, CAA).
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-[#232f3e]">
              <Link
                href="/hosted-zones"
                className="text-xs font-semibold text-[#539fe5] hover:text-[#8cbcf5] flex items-center justify-between transition-colors"
              >
                <span>View Hosted Zones</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 2: Traffic Policies */}
          <div className="bg-[#161e2e] border border-[#2e384d] rounded-lg p-4 shadow-2xs flex flex-col justify-between hover:border-[#475569] transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded bg-amber-950/60 text-amber-400 flex items-center justify-center border border-amber-800/60">
                  <GitBranch className="w-4 h-4" />
                </div>
                <Badge variant="warning" size="sm">
                  Coming Soon
                </Badge>
              </div>
              <h3 className="text-sm font-bold text-white">
                Traffic Policies
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Visual policy records for complex routing rules including
                weighted, latency, geolocation, and failover.
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-[#232f3e]">
              <Link
                href="/traffic-policies"
                className="text-xs font-medium text-gray-400 hover:text-white flex items-center justify-between transition-colors"
              >
                <span>Preview Policy Area</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 3: Health Checks */}
          <div className="bg-[#161e2e] border border-[#2e384d] rounded-lg p-4 shadow-2xs flex flex-col justify-between hover:border-[#475569] transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded bg-purple-950/60 text-purple-400 flex items-center justify-center border border-purple-800/60">
                  <Activity className="w-4 h-4" />
                </div>
                <Badge variant="warning" size="sm">
                  Coming Soon
                </Badge>
              </div>
              <h3 className="text-sm font-bold text-white">
                Health Checks
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Monitor resource endpoints, track health metrics, and route
                traffic around failed servers automatically.
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-[#232f3e]">
              <Link
                href="/health-checks"
                className="text-xs font-medium text-gray-400 hover:text-white flex items-center justify-between transition-colors"
              >
                <span>Preview Health Checks</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 4: Resolver */}
          <div className="bg-[#161e2e] border border-[#2e384d] rounded-lg p-4 shadow-2xs flex flex-col justify-between hover:border-[#475569] transition-colors">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded bg-teal-950/60 text-teal-400 flex items-center justify-center border border-teal-800/60">
                  <Server className="w-4 h-4" />
                </div>
                <Badge variant="warning" size="sm">
                  Coming Soon
                </Badge>
              </div>
              <h3 className="text-sm font-bold text-white">
                Route 53 Resolver
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Recursive DNS queries between VPCs and on-premises networks
                with rule-based forwarding endpoints.
              </p>
            </div>
            <div className="pt-3 mt-3 border-t border-[#232f3e]">
              <Link
                href="/resolver"
                className="text-xs font-medium text-gray-400 hover:text-white flex items-center justify-between transition-colors"
              >
                <span>Preview Resolver</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Getting Started Guide Banner */}
      <div className="bg-[#161e2e] border border-[#2e384d] rounded-lg p-5 shadow-2xs">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
          <HelpCircle className="w-4 h-4 text-gray-400" />
          <span>Getting started with Amazon Route 53</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-300">
          <div className="p-3 bg-[#0f172a] border border-[#2e384d] rounded">
            <div className="font-bold text-white mb-1">
              1. Create a hosted zone
            </div>
            <p className="text-gray-400">
              Create a public hosted zone for internet-accessible domains, or a
              private hosted zone for VPC-internal domains.
            </p>
          </div>

          <div className="p-3 bg-[#0f172a] border border-[#2e384d] rounded">
            <div className="font-bold text-white mb-1">
              2. Add DNS records
            </div>
            <p className="text-gray-400">
              Create records such as A records for IPv4 addresses, CNAME for
              aliases, MX for mail servers, and TXT for domain verification.
            </p>
          </div>

          <div className="p-3 bg-[#0f172a] border border-[#2e384d] rounded">
            <div className="font-bold text-white mb-1">
              3. Configure routing
            </div>
            <p className="text-gray-400">
              Define TTL values and routing strategies to ensure resilient and
              performant traffic delivery worldwide.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

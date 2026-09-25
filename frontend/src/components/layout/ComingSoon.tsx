"use client";

import React from "react";
import Link from "next/link";
import { Clock, ArrowLeft, Layers, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";

interface ComingSoonProps {
  featureName: string;
  description: string;
  category?: string;
  docsUrl?: string;
  plannedFeatures?: string[];
}

export function ComingSoon({
  featureName,
  description,
  category = "Route 53",
  docsUrl,
  plannedFeatures = [],
}: ComingSoonProps) {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* AWS Style PageHeader with Breadcrumbs */}
      <PageHeader
        title={featureName}
        description={description}
        breadcrumbs={[{ label: category, href: "/" }, { label: featureName }]}
        infoLink={
          docsUrl
            ? {
                text: "Documentation",
                href: docsUrl,
              }
            : undefined
        }
      />

      {/* Main Coming Soon Container */}
      <div className="bg-[#161e2e] border border-[#2e384d] rounded-lg p-8 sm:p-10 shadow-xs">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <div className="w-12 h-12 bg-amber-950/50 text-amber-400 rounded-full flex items-center justify-center mx-auto border border-amber-700/60 shadow-2xs">
            <Clock className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2">
              <h2 className="text-lg font-bold text-white">{featureName}</h2>
              <Badge variant="warning" size="sm" dot>
                Coming Soon
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
              {description}
            </p>
          </div>

          <div className="p-3 bg-[#0f172a] border border-[#2e384d] rounded text-xs text-gray-300 text-left space-y-2">
            <span className="font-bold text-gray-200 uppercase text-[10px] tracking-wider block">
              Planned Route 53 Capabilities
            </span>
            {plannedFeatures.length > 0 ? (
              <ul className="list-disc list-inside space-y-1 text-gray-400 text-xs">
                {plannedFeatures.map((feat, idx) => (
                  <li key={idx}>{feat}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 text-xs">
                This module is designated as a placeholder page in the assignment
                specification. Primary focus is on Hosted Zones and DNS Record
                management.
              </p>
            )}
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <Link href="/">
              <Button
                variant="secondary"
                icon={<ArrowLeft className="w-3.5 h-3.5" />}
              >
                Return to Dashboard
              </Button>
            </Link>

            <Link href="/hosted-zones">
              <Button
                variant="primary"
                icon={<Layers className="w-3.5 h-3.5" />}
              >
                Go to Hosted Zones
              </Button>
            </Link>

            {docsUrl && (
              <a
                href={docsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1 text-xs text-[#539fe5] hover:text-[#8cbcf5] hover:underline px-2 py-1 transition-colors"
              >
                <span>Read AWS Docs</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

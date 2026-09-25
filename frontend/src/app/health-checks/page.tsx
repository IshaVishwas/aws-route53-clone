import { ComingSoon } from "@/components/layout/ComingSoon";

export default function HealthChecksPage() {
  return (
    <ComingSoon
      featureName="Health Checks"
      description="Amazon Route 53 health checks monitor the health and performance of your web applications, web servers, and other resources to configure active-passive or active-active failover."
      docsUrl="https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/dns-failover.html"
      plannedFeatures={[
        "HTTP, HTTPS, and TCP endpoint uptime monitoring",
        "Calculated health checks aggregating multiple metrics",
        "CloudWatch alarm integration and automatic DNS failover triggers",
      ]}
    />
  );
}

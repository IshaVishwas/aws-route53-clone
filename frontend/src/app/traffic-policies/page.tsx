import { ComingSoon } from "@/components/layout/ComingSoon";

export default function TrafficPoliciesPage() {
  return (
    <ComingSoon
      featureName="Traffic Policies"
      description="Traffic flow visual policy editor for configuring complex multi-region DNS routing, weighted distribution, latency-based routing, and automated failover rules."
      docsUrl="https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/traffic-flow.html"
      plannedFeatures={[
        "Visual policy versioning and policy records creation",
        "Weighted, Geolocation, Latency, and Failover routing rules",
        "Endpoints mapping to CloudFront, ALB, and EC2 resources",
      ]}
    />
  );
}

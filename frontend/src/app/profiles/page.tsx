import { ComingSoon } from "@/components/layout/ComingSoon";

export default function ProfilesPage() {
  return (
    <ComingSoon
      featureName="Route 53 Profiles"
      description="Route 53 Profiles lets you create and manage collections of DNS rules and configurations, and associate them with multiple VPCs across AWS accounts in your AWS Organization."
      docsUrl="https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/profiles.html"
      plannedFeatures={[
        "Organization-wide DNS profile bundles and rule sharing",
        "Multi-VPC association and inheritance rules",
        "Resource access manager (RAM) permission policies",
      ]}
    />
  );
}

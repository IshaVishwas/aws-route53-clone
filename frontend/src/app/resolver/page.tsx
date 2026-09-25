import { ComingSoon } from "@/components/layout/ComingSoon";

export default function ResolverPage() {
  return (
    <ComingSoon
      featureName="Route 53 Resolver"
      description="Amazon Route 53 Resolver provides a recursive DNS server that resolves DNS queries for your Amazon VPCs, as well as hybrid cloud DNS forwarding between on-premises and AWS."
      docsUrl="https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/resolver.html"
      plannedFeatures={[
        "Inbound and Outbound DNS query forwarding endpoints",
        "VPC network DNS resolution rules and target IP configurations",
        "DNS Firewall rule groups for domain filtering and malware protection",
      ]}
    />
  );
}

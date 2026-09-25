// AWS Route 53 Record Types
export type DNSRecordType =
  | "A"
  | "AAAA"
  | "CNAME"
  | "TXT"
  | "MX"
  | "NS"
  | "PTR"
  | "SRV"
  | "CAA";

export type RoutingPolicy =
  | "SIMPLE"
  | "WEIGHTED"
  | "GEOLOCATION"
  | "FAILOVER"
  | "LATENCY"
  | "MULTIVALUE";

export interface AuthUser {
  id: string;
  email: string;
  created_at: string;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
  expires_at: string;
}

export interface HostedZone {
  id: string;
  zone_id: string;
  name: string;
  type: "PUBLIC" | "PRIVATE";
  comment?: string | null;
  private_zone: boolean;
  record_count: number;
  created_at: string;
  updated_at: string;
}

export interface HostedZoneListResponse {
  items: HostedZone[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface HostedZoneCreateInput {
  name: string;
  type?: "PUBLIC" | "PRIVATE";
  comment?: string;
  private_zone?: boolean;
}

export interface HostedZoneUpdateInput {
  comment?: string;
}

export interface HostedZoneFilterParams {
  search?: string;
  type?: string;
  page?: number;
  page_size?: number;
}

export interface DNSRecord {
  id: string;
  hosted_zone_id: string;
  name: string;
  type: DNSRecordType;
  ttl: number;
  value: string;
  priority?: number | null;
  created_at: string;
  updated_at: string;
}

export interface DNSRecordListResponse {
  items: DNSRecord[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface DNSRecordCreateInput {
  name: string;
  type: DNSRecordType;
  ttl: number;
  value: string;
  priority?: number | null;
}

export interface DNSRecordUpdateInput {
  name?: string;
  ttl?: number;
  value?: string;
  priority?: number | null;
}

export interface DNSRecordFilterParams {
  search?: string;
  type?: string;
  page?: number;
  page_size?: number;
}

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

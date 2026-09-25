import {
  AuthSession,
  HostedZone,
  HostedZoneListResponse,
  HostedZoneCreateInput,
  HostedZoneUpdateInput,
  HostedZoneFilterParams,
  DNSRecord,
  DNSRecordListResponse,
  DNSRecordCreateInput,
  DNSRecordUpdateInput,
  DNSRecordFilterParams,
} from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://aws-route53-backend-hz3g.onrender.com/api/v1";

const TOKEN_STORAGE_KEY = "route53_session_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${
    endpoint.startsWith("/") ? endpoint : `/${endpoint}`
  }`;

  const token = getStoredToken();
  const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers as Record<string, string> | undefined),
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorBody = await response.json();
        if (errorBody && errorBody.detail) {
          errorMessage =
            typeof errorBody.detail === "string"
              ? errorBody.detail
              : JSON.stringify(errorBody.detail);
        }
      } catch {
        // Keep standard message
      }

      const err = new Error(errorMessage) as Error & { status?: number };
      err.status = response.status;
      throw err;
    }

    if (response.status === 204) {
      return undefined as unknown as T;
    }

    return response.json();
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Network error or server unreachable");
  }
}

// ---------------------------------------------------------------------------
// Authentication API methods
// ---------------------------------------------------------------------------
export async function loginApi(
  email: string,
  password: string
): Promise<AuthSession> {
  const data = await fetchApi<AuthSession>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (data.token) {
    setStoredToken(data.token);
  }
  return data;
}

export async function logoutApi(): Promise<{ message: string }> {
  try {
    const result = await fetchApi<{ message: string }>("/auth/logout", {
      method: "POST",
    });
    return result;
  } finally {
    clearStoredToken();
  }
}

export async function getSessionApi(): Promise<AuthSession> {
  return fetchApi<AuthSession>("/auth/session");
}

// ---------------------------------------------------------------------------
// Hosted Zones API methods
// ---------------------------------------------------------------------------
export async function listHostedZones(
  params: HostedZoneFilterParams = {}
): Promise<HostedZoneListResponse> {
  const query = new URLSearchParams();
  if (params.search && params.search.trim()) {
    query.set("search", params.search.trim());
  }
  if (params.type && params.type !== "ALL") {
    query.set("type", params.type.toUpperCase());
  }
  if (params.page && params.page > 0) {
    query.set("page", params.page.toString());
  }
  if (params.page_size && params.page_size > 0) {
    query.set("page_size", params.page_size.toString());
  }

  const qs = query.toString();
  const endpoint = qs ? `/hosted-zones?${qs}` : "/hosted-zones";
  return fetchApi<HostedZoneListResponse>(endpoint);
}

export async function getHostedZone(zoneId: string): Promise<HostedZone> {
  return fetchApi<HostedZone>(`/hosted-zones/${encodeURIComponent(zoneId)}`);
}

export async function createHostedZone(
  payload: HostedZoneCreateInput
): Promise<HostedZone> {
  return fetchApi<HostedZone>("/hosted-zones", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateHostedZone(
  zoneId: string,
  payload: HostedZoneUpdateInput
): Promise<HostedZone> {
  return fetchApi<HostedZone>(`/hosted-zones/${encodeURIComponent(zoneId)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteHostedZone(zoneId: string): Promise<void> {
  return fetchApi<void>(`/hosted-zones/${encodeURIComponent(zoneId)}`, {
    method: "DELETE",
  });
}

// ---------------------------------------------------------------------------
// DNS Records API methods
// ---------------------------------------------------------------------------
export async function listRecordsForZone(
  zoneId: string,
  params: DNSRecordFilterParams = {}
): Promise<DNSRecordListResponse> {
  const query = new URLSearchParams();
  if (params.search && params.search.trim()) {
    query.set("search", params.search.trim());
  }
  if (params.type && params.type !== "ALL") {
    query.set("type", params.type.toUpperCase());
  }
  if (params.page && params.page > 0) {
    query.set("page", params.page.toString());
  }
  if (params.page_size && params.page_size > 0) {
    query.set("page_size", params.page_size.toString());
  }

  const qs = query.toString();
  const endpoint = qs
    ? `/hosted-zones/${encodeURIComponent(zoneId)}/records?${qs}`
    : `/hosted-zones/${encodeURIComponent(zoneId)}/records`;
  return fetchApi<DNSRecordListResponse>(endpoint);
}

export async function createRecordForZone(
  zoneId: string,
  payload: DNSRecordCreateInput
): Promise<DNSRecord> {
  return fetchApi<DNSRecord>(
    `/hosted-zones/${encodeURIComponent(zoneId)}/records`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function getRecord(recordId: string): Promise<DNSRecord> {
  return fetchApi<DNSRecord>(`/records/${encodeURIComponent(recordId)}`);
}

export async function updateRecord(
  recordId: string,
  payload: DNSRecordUpdateInput
): Promise<DNSRecord> {
  return fetchApi<DNSRecord>(`/records/${encodeURIComponent(recordId)}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteRecord(recordId: string): Promise<void> {
  return fetchApi<void>(`/records/${encodeURIComponent(recordId)}`, {
    method: "DELETE",
  });
}

// ---------------------------------------------------------------------------
// System Health API method
// ---------------------------------------------------------------------------
export async function checkBackendHealth() {
  return fetchApi<{
    status: string;
    service: string;
    database: string;
    timestamp: string;
  }>("/health");
}

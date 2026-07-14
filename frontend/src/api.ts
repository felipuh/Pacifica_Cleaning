export type LeadPayload = {
  full_name: string;
  email: string;
  phone: string;
  preferred_language: "es" | "en";
  requested_service: string;
  message: string;
  consent_data_processing: boolean;
  consent_marketing: boolean;
  source: string;
  website?: string;
};

export type SessionUser = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(path, {
    credentials: "include",
    ...options,
    headers
  });
  if (!response.ok) {
    const details = await response.json().catch(() => ({ detail: "Error inesperado" }));
    if (
      (response.status === 401 || response.status === 403) &&
      typeof details.detail === "string" &&
      /authentication credentials|not authenticated/i.test(details.detail)
    ) {
      window.dispatchEvent(new Event("pacifica:session-expired"));
    }
    throw new Error(JSON.stringify(details));
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export async function ensureCsrf(): Promise<string> {
  const data = await request<{ csrfToken: string }>("/api/auth/csrf/");
  return data.csrfToken;
}

export async function createLead(payload: LeadPayload): Promise<unknown> {
  const csrf = await ensureCsrf();
  return request("/api/v1/leads/", {
    method: "POST",
    headers: { "X-CSRFToken": csrf },
    body: JSON.stringify(payload)
  });
}

export async function login(email: string, password: string): Promise<SessionUser | { mfaRequired: true }> {
  const csrf = await ensureCsrf();
  return request("/api/auth/login/", {
    method: "POST",
    headers: { "X-CSRFToken": csrf },
    body: JSON.stringify({ email, password })
  });
}

export async function getMe(): Promise<SessionUser> {
  return request("/api/auth/me/");
}

export async function logout(): Promise<void> {
  const csrf = await ensureCsrf();
  return request("/api/auth/logout/", {
    method: "POST",
    headers: { "X-CSRFToken": csrf }
  });
}

export async function requestPasswordReset(email: string): Promise<{ detail: string }> {
  const csrf = await ensureCsrf();
  return request("/api/auth/password/reset/request/", {
    method: "POST",
    headers: { "X-CSRFToken": csrf },
    body: JSON.stringify({ email })
  });
}

export async function listResource<T>(resource: string): Promise<{ results: T[] }> {
  return request(`/api/v1/${resource}/`);
}

export async function queryResource<T>(resource: string, params: URLSearchParams): Promise<{ count: number; results: T[] }> {
  return request(`/api/v1/${resource}/?${params.toString()}`);
}

export async function createResource<T>(resource: string, payload: unknown): Promise<T> {
  const csrf = await ensureCsrf();
  return request(`/api/v1/${resource}/`, {
    method: "POST",
    headers: { "X-CSRFToken": csrf },
    body: JSON.stringify(payload)
  });
}

export async function updateResource<T>(resource: string, id: string, payload: unknown): Promise<T> {
  const csrf = await ensureCsrf();
  return request(`/api/v1/${resource}/${id}/`, {
    method: "PATCH",
    headers: { "X-CSRFToken": csrf },
    body: JSON.stringify(payload)
  });
}

export async function resourceAction<T>(resource: string, id: string, action: string, payload: unknown = {}): Promise<T> {
  const csrf = await ensureCsrf();
  return request(`/api/v1/${resource}/${id}/${action}/`, {
    method: "POST",
    headers: { "X-CSRFToken": csrf },
    body: JSON.stringify(payload)
  });
}

export type DashboardMetrics = {
  leads_new: number;
  leads_pending: number;
  quotes_pending: number;
  quotes_sent: number;
  quotes_accepted: number;
  services_upcoming: number;
  services_completed: number;
  recurrent_customers: number;
  estimated_revenue: string;
  confirmed_revenue: string;
  conversion_rate: number;
  recent_activity: Array<{ type: string; id: string; label: string; status: string; at: string }>;
};

export async function getDashboard(): Promise<DashboardMetrics> {
  return request("/api/v1/dashboard/");
}

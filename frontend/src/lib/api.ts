import type {
  BusinessConfig,
  BusinessHours,
  Service,
  AvailabilityResponse,
  BookingCreate,
  BookingRead,
} from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const ADMIN_CREDS_KEY = "autowha_admin";

// ── Credenciales admin ────────────────────────────────────────────────────────

export function setAdminPassword(password: string): void {
  sessionStorage.setItem(ADMIN_CREDS_KEY, btoa(`admin:${password}`));
}

export function clearAdminPassword(): void {
  sessionStorage.removeItem(ADMIN_CREDS_KEY);
}

export function hasAdminPassword(): boolean {
  if (typeof window === "undefined") return false;
  return !!sessionStorage.getItem(ADMIN_CREDS_KEY);
}

function getAdminAuthHeader(): string | null {
  if (typeof window === "undefined") return null;
  const creds = sessionStorage.getItem(ADMIN_CREDS_KEY);
  return creds ? `Basic ${creds}` : null;
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.detail ?? `Error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function adminApiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const auth = getAdminAuthHeader();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(auth ? { Authorization: auth } : {}),
    },
  });
  if (res.status === 401) {
    clearAdminPassword();
    throw new Error("UNAUTHORIZED");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.detail ?? `Error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Público ───────────────────────────────────────────────────────────────────

export const getBusinessConfig = () =>
  apiFetch<BusinessConfig>("/business-config");

export const getServices = () =>
  apiFetch<Service[]>("/services");

export const getAvailability = (date: string, serviceId: number) =>
  apiFetch<AvailabilityResponse>(`/availability?date=${date}&service_id=${serviceId}`);

export const createBooking = (data: BookingCreate) =>
  apiFetch<BookingRead>("/bookings", {
    method: "POST",
    body: JSON.stringify(data),
  });

// ── Admin ─────────────────────────────────────────────────────────────────────

export const adminGetBookings = (date?: string) => {
  const qs = date ? `?date=${date}` : "";
  return adminApiFetch<BookingRead[]>(`/admin/bookings${qs}`);
};

export const adminUpdateConfig = (data: Omit<BusinessConfig, "id">) =>
  adminApiFetch<BusinessConfig>("/admin/business-config", {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const adminGetServices = () =>
  adminApiFetch<Service[]>("/admin/services");

export const adminCreateService = (data: Omit<Service, "id">) =>
  adminApiFetch<Service>("/admin/services", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const adminUpdateService = (id: number, data: Omit<Service, "id">) =>
  adminApiFetch<Service>(`/admin/services/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const adminCancelBooking = (id: number) =>
  adminApiFetch<BookingRead>(`/admin/bookings/${id}/cancel`, { method: "PATCH" });

export const adminGetBusinessHours = () =>
  adminApiFetch<BusinessHours[]>("/admin/business-hours");

export const adminUpdateBusinessHours = (
  id: number,
  data: Omit<BusinessHours, "id" | "day_name">,
) =>
  adminApiFetch<BusinessHours>(`/admin/business-hours/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

import type {
  BusinessConfig,
  Service,
  AvailabilityResponse,
  BookingCreate,
  BookingRead,
} from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

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

// ── Público ─────────────────────────────────────────────────────────────────

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

// ── Admin ────────────────────────────────────────────────────────────────────

export const adminGetBookings = (date?: string) => {
  const qs = date ? `?date=${date}` : "";
  return apiFetch<BookingRead[]>(`/admin/bookings${qs}`);
};

export const adminUpdateConfig = (data: Omit<BusinessConfig, "id">) =>
  apiFetch<BusinessConfig>("/admin/business-config", {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const adminGetServices = () =>
  apiFetch<Service[]>("/admin/services");

export const adminCreateService = (data: Omit<Service, "id">) =>
  apiFetch<Service>("/admin/services", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const adminUpdateService = (id: number, data: Omit<Service, "id">) =>
  apiFetch<Service>(`/admin/services/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const adminCancelBooking = (id: number) =>
  apiFetch<BookingRead>(`/admin/bookings/${id}/cancel`, { method: "PATCH" });

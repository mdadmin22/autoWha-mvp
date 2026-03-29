export type BusinessType = "HOME_SERVICE" | "FIXED_LOCATION";

export interface BusinessConfig {
  id: number;
  name: string;
  business_type: BusinessType;
  description: string | null;
  whatsapp: string | null;
  instagram: string | null;
  landing_text: string | null;
  slot_duration_minutes: number;
  buffer_minutes: number;
}

export interface Service {
  id: number;
  name: string;
  duration_minutes: number;
  price: number | null;
  is_active: boolean;
}

export interface TimeSlot {
  start_time: string; // "HH:MM:SS"
  end_time: string;
}

export interface AvailabilityResponse {
  date: string;
  service_id: number;
  slots: TimeSlot[];
}

export interface BookingCreate {
  service_id: number;
  date: string;
  start_time: string;
  client_name: string;
  client_phone: string;
  client_address?: string;
  notes?: string;
}

export interface BookingRead {
  id: number;
  service: Service;
  date: string;
  start_time: string;
  end_time: string;
  client_name: string;
  client_phone: string;
  client_address: string | null;
  notes: string | null;
  status: "confirmed" | "cancelled";
  created_at: string;
}

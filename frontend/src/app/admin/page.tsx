"use client";

import { useEffect, useState } from "react";
import {
  setAdminPassword,
  clearAdminPassword,
  hasAdminPassword,
  adminGetBookings,
  adminCancelBooking,
  adminGetServices,
  adminCreateService,
  adminUpdateService,
  adminUpdateConfig,
  adminGetBusinessHours,
  adminUpdateBusinessHours,
  getBusinessConfig,
} from "@/lib/api";
import type { BookingRead, Service, BusinessConfig, BusinessHours } from "@/types";

type Tab = "bookings" | "services" | "config" | "hours";

const DAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

// ── Auth gate ─────────────────────────────────────────────────────────────────

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setAdminPassword(password);
    try {
      await adminGetBookings();
      onSuccess();
    } catch (err: unknown) {
      clearAdminPassword();
      const msg = err instanceof Error ? err.message : "";
      setError(msg === "UNAUTHORIZED" ? "Contraseña incorrecta" : "Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-sm mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-gray-900 mb-8 text-center">Administración</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm"
            placeholder="Ingresá la contraseña"
            autoFocus
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading || !password}
          className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg"
        >
          {loading ? "Verificando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("bookings");

  useEffect(() => {
    setIsAuthenticated(hasAdminPassword());
  }, []);

  function handleUnauthorized() {
    clearAdminPassword();
    setIsAuthenticated(false);
  }

  // SSR safety: no renderizar hasta saber el estado de auth
  if (isAuthenticated === null) return null;

  if (!isAuthenticated) {
    return <LoginForm onSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Administración</h1>
        <button
          onClick={handleUnauthorized}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          Salir
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {(["bookings", "services", "config", "hours"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? "border-rose-500 text-rose-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "bookings"
              ? "Reservas"
              : t === "services"
              ? "Servicios"
              : t === "config"
              ? "Configuración"
              : "Horarios"}
          </button>
        ))}
      </div>

      {tab === "bookings" && <BookingsTab onUnauthorized={handleUnauthorized} />}
      {tab === "services" && <ServicesTab onUnauthorized={handleUnauthorized} />}
      {tab === "config" && <ConfigTab onUnauthorized={handleUnauthorized} />}
      {tab === "hours" && <HoursTab onUnauthorized={handleUnauthorized} />}
    </main>
  );
}

// ── Tab: Reservas ─────────────────────────────────────────────────────────────

function BookingsTab({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [bookings, setBookings] = useState<BookingRead[]>([]);
  const [dateFilter, setDateFilter] = useState("");
  const [loading, setLoading] = useState(false);

  function load() {
    setLoading(true);
    adminGetBookings(dateFilter || undefined)
      .then(setBookings)
      .catch((e: Error) => { if (e.message === "UNAUTHORIZED") onUnauthorized(); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [dateFilter]);

  async function handleCancel(id: number) {
    if (!confirm("¿Cancelar esta reserva?")) return;
    try {
      await adminCancelBooking(id);
      load();
    } catch (e: unknown) {
      if (e instanceof Error && e.message === "UNAUTHORIZED") onUnauthorized();
    }
  }

  function formatTime(t: string) { return t.slice(0, 5); }

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        {dateFilter && (
          <button onClick={() => setDateFilter("")} className="text-sm text-gray-500 hover:text-gray-700">
            Limpiar filtro
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Cargando...</p>
      ) : bookings.length === 0 ? (
        <p className="text-gray-400 text-sm">No hay reservas.</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div
              key={b.id}
              className={`bg-white border rounded-xl p-4 ${
                b.status === "cancelled" ? "opacity-50 border-gray-200" : "border-gray-200"
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900">
                    {b.client_name} — {b.service.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {b.date} · {formatTime(b.start_time)}–{formatTime(b.end_time)}
                  </p>
                  <p className="text-sm text-gray-500">{b.client_phone}</p>
                  {b.client_address && (
                    <p className="text-sm text-gray-400">{b.client_address}</p>
                  )}
                  {b.notes && (
                    <p className="text-xs text-gray-400 mt-1 italic">{b.notes}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      b.status === "confirmed"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {b.status === "confirmed" ? "Confirmada" : "Cancelada"}
                  </span>
                  {b.status === "confirmed" && (
                    <button
                      onClick={() => handleCancel(b.id)}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tab: Servicios ────────────────────────────────────────────────────────────

function ServicesTab({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [services, setServices] = useState<Service[]>([]);
  const [editing, setEditing] = useState<Service | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", duration_minutes: 60, price: "", is_active: true });

  useEffect(() => {
    adminGetServices()
      .then(setServices)
      .catch((e: Error) => { if (e.message === "UNAUTHORIZED") onUnauthorized(); });
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", duration_minutes: 60, price: "", is_active: true });
    setCreating(true);
  }

  function openEdit(s: Service) {
    setCreating(false);
    setForm({
      name: s.name,
      duration_minutes: s.duration_minutes,
      price: s.price?.toString() ?? "",
      is_active: s.is_active,
    });
    setEditing(s);
  }

  async function handleSave() {
    const data = {
      name: form.name,
      duration_minutes: form.duration_minutes,
      price: form.price ? parseFloat(form.price) : null,
      is_active: form.is_active,
    };
    try {
      if (editing) {
        await adminUpdateService(editing.id, data);
      } else {
        await adminCreateService(data);
      }
    } catch (e: unknown) {
      if (e instanceof Error && e.message === "UNAUTHORIZED") { onUnauthorized(); return; }
    }
    setEditing(null);
    setCreating(false);
    adminGetServices().then(setServices);
  }

  return (
    <div>
      <button
        onClick={openCreate}
        className="mb-4 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium px-4 py-2 rounded-lg"
      >
        + Nuevo servicio
      </button>

      {(creating || editing) && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 space-y-3">
          <h3 className="font-medium text-gray-800">{editing ? "Editar servicio" : "Nuevo servicio"}</h3>
          <input
            className="input w-full"
            placeholder="Nombre"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <div className="flex gap-3">
            <input
              className="input flex-1"
              type="number"
              placeholder="Duración (min)"
              value={form.duration_minutes}
              onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) })}
            />
            <input
              className="input flex-1"
              type="number"
              placeholder="Precio (opcional)"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            Activo
          </label>
          <div className="flex gap-2">
            <button onClick={handleSave} className="bg-rose-500 text-white text-sm px-4 py-2 rounded-lg hover:bg-rose-600">
              Guardar
            </button>
            <button onClick={() => { setEditing(null); setCreating(false); }} className="text-gray-500 text-sm">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {services.map((s) => (
          <div key={s.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex justify-between items-center">
            <div>
              <p className={`font-medium ${s.is_active ? "text-gray-900" : "text-gray-400 line-through"}`}>
                {s.name}
              </p>
              <p className="text-xs text-gray-400">
                {s.duration_minutes} min{s.price != null ? ` · $${s.price.toLocaleString("es-AR")}` : ""}
              </p>
            </div>
            <button onClick={() => openEdit(s)} className="text-xs text-rose-500 hover:underline">
              Editar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab: Configuración ────────────────────────────────────────────────────────

function ConfigTab({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [config, setConfig] = useState<BusinessConfig | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getBusinessConfig().then(setConfig);
  }, []);

  async function handleSave() {
    if (!config) return;
    const { id, ...data } = config;
    try {
      await adminUpdateConfig(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: unknown) {
      if (e instanceof Error && e.message === "UNAUTHORIZED") onUnauthorized();
    }
  }

  if (!config) return <p className="text-gray-400 text-sm">Cargando...</p>;

  return (
    <div className="space-y-4">
      <Field label="Nombre del negocio">
        <input className="input w-full" value={config.name} onChange={(e) => setConfig({ ...config, name: e.target.value })} />
      </Field>

      <Field label="Tipo de negocio">
        <select
          className="input w-full"
          value={config.business_type}
          onChange={(e) => setConfig({ ...config, business_type: e.target.value as "HOME_SERVICE" | "FIXED_LOCATION" })}
        >
          <option value="HOME_SERVICE">A domicilio (HOME_SERVICE)</option>
          <option value="FIXED_LOCATION">Local fijo (FIXED_LOCATION)</option>
        </select>
      </Field>

      <Field label="Descripción">
        <textarea className="input w-full resize-none" rows={2} value={config.description ?? ""} onChange={(e) => setConfig({ ...config, description: e.target.value })} />
      </Field>

      <Field label="Texto de landing">
        <textarea className="input w-full resize-none" rows={2} value={config.landing_text ?? ""} onChange={(e) => setConfig({ ...config, landing_text: e.target.value })} />
      </Field>

      <div className="flex gap-4">
        <Field label="WhatsApp">
          <input className="input" value={config.whatsapp ?? ""} onChange={(e) => setConfig({ ...config, whatsapp: e.target.value })} />
        </Field>
        <Field label="Instagram">
          <input className="input" value={config.instagram ?? ""} onChange={(e) => setConfig({ ...config, instagram: e.target.value })} />
        </Field>
      </div>

      <div className="flex gap-4">
        <Field label="Duración slot (min)">
          <input type="number" className="input w-full" value={config.slot_duration_minutes} onChange={(e) => setConfig({ ...config, slot_duration_minutes: parseInt(e.target.value) })} />
        </Field>
        <Field label="Buffer entre turnos (min)">
          <input type="number" className="input w-full" value={config.buffer_minutes} onChange={(e) => setConfig({ ...config, buffer_minutes: parseInt(e.target.value) })} />
        </Field>
      </div>

      <button onClick={handleSave} className="bg-rose-500 hover:bg-rose-600 text-white font-medium px-6 py-2 rounded-lg">
        {saved ? "¡Guardado!" : "Guardar cambios"}
      </button>
    </div>
  );
}

// ── Tab: Horarios ─────────────────────────────────────────────────────────────

function HoursTab({ onUnauthorized }: { onUnauthorized: () => void }) {
  const [hours, setHours] = useState<BusinessHours[]>([]);
  const [saving, setSaving] = useState<number | null>(null);

  useEffect(() => {
    adminGetBusinessHours()
      .then(setHours)
      .catch((e: Error) => { if (e.message === "UNAUTHORIZED") onUnauthorized(); });
  }, []);

  function toTimeInput(t: string) { return t.slice(0, 5); }    // "HH:MM:SS" → "HH:MM"
  function fromTimeInput(t: string) { return `${t}:00`; }      // "HH:MM" → "HH:MM:00"

  function updateLocal(id: number, field: keyof BusinessHours, value: string | boolean) {
    setHours((prev) => prev.map((h) => (h.id === id ? { ...h, [field]: value } : h)));
  }

  async function handleSave(h: BusinessHours) {
    setSaving(h.id);
    try {
      await adminUpdateBusinessHours(h.id, {
        day_of_week: h.day_of_week,
        start_time: h.start_time,
        end_time: h.end_time,
        is_active: h.is_active,
      });
    } catch (e: unknown) {
      if (e instanceof Error && e.message === "UNAUTHORIZED") onUnauthorized();
    } finally {
      setSaving(null);
    }
  }

  if (hours.length === 0) return <p className="text-gray-400 text-sm">Cargando...</p>;

  return (
    <div className="space-y-3">
      {hours.map((h) => (
        <div key={h.id} className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="w-24 font-medium text-gray-800 text-sm">
              {DAY_NAMES[h.day_of_week] ?? `Día ${h.day_of_week}`}
            </span>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={h.is_active}
                onChange={(e) => updateLocal(h.id, "is_active", e.target.checked)}
              />
              Activo
            </label>
            <input
              type="time"
              value={toTimeInput(h.start_time)}
              disabled={!h.is_active}
              onChange={(e) => updateLocal(h.id, "start_time", fromTimeInput(e.target.value))}
              className="border border-gray-300 rounded-lg px-2 py-1 text-sm disabled:opacity-40"
            />
            <span className="text-gray-400 text-sm">–</span>
            <input
              type="time"
              value={toTimeInput(h.end_time)}
              disabled={!h.is_active}
              onChange={(e) => updateLocal(h.id, "end_time", fromTimeInput(e.target.value))}
              className="border border-gray-300 rounded-lg px-2 py-1 text-sm disabled:opacity-40"
            />
            <button
              onClick={() => handleSave(h)}
              disabled={saving === h.id}
              className="ml-auto text-sm bg-rose-500 text-white px-3 py-1 rounded-lg hover:bg-rose-600 disabled:opacity-50"
            >
              {saving === h.id ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

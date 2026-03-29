"use client";

/**
 * Panel de administración básico.
 * MVP: sin autenticación real. Agregar auth en versión siguiente.
 */
import { useEffect, useState } from "react";
import {
  adminGetBookings,
  adminCancelBooking,
  adminGetServices,
  adminCreateService,
  adminUpdateService,
  adminUpdateConfig,
  getBusinessConfig,
} from "@/lib/api";
import type { BookingRead, Service, BusinessConfig } from "@/types";

type Tab = "bookings" | "services" | "config";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("bookings");

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Administración</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {(["bookings", "services", "config"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? "border-rose-500 text-rose-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "bookings" ? "Reservas" : t === "services" ? "Servicios" : "Configuración"}
          </button>
        ))}
      </div>

      {tab === "bookings" && <BookingsTab />}
      {tab === "services" && <ServicesTab />}
      {tab === "config" && <ConfigTab />}
    </main>
  );
}

// ── Tab: Reservas ─────────────────────────────────────────────────────────────

function BookingsTab() {
  const [bookings, setBookings] = useState<BookingRead[]>([]);
  const [dateFilter, setDateFilter] = useState("");
  const [loading, setLoading] = useState(false);

  function load() {
    setLoading(true);
    adminGetBookings(dateFilter || undefined)
      .then(setBookings)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [dateFilter]);

  async function handleCancel(id: number) {
    if (!confirm("¿Cancelar esta reserva?")) return;
    await adminCancelBooking(id);
    load();
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

function ServicesTab() {
  const [services, setServices] = useState<Service[]>([]);
  const [editing, setEditing] = useState<Service | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", duration_minutes: 60, price: "", is_active: true });

  useEffect(() => {
    adminGetServices().then(setServices);
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
    if (editing) {
      await adminUpdateService(editing.id, data);
    } else {
      await adminCreateService(data);
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

function ConfigTab() {
  const [config, setConfig] = useState<BusinessConfig | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getBusinessConfig().then(setConfig);
  }, []);

  async function handleSave() {
    if (!config) return;
    const { id, ...data } = config;
    await adminUpdateConfig(data);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

"use client";

/**
 * Página de reserva de turno.
 * Flujo progresivo: servicio → fecha → horario → datos → confirmar.
 */
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ServiceCard from "@/components/ServiceCard";
import TimeSlotPicker from "@/components/TimeSlotPicker";
import {
  getServices,
  getAvailability,
  createBooking,
  getBusinessConfig,
} from "@/lib/api";
import type { Service, TimeSlot, BusinessConfig } from "@/types";

type Step = "service" | "datetime" | "info" | "confirm";

// Fecha mínima seleccionable = hoy
function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export default function BookPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("service");
  const [config, setConfig] = useState<BusinessConfig | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Datos del cliente
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getServices(), getBusinessConfig()]).then(([svcs, cfg]) => {
      setServices(svcs);
      setConfig(cfg);
    });
  }, []);

  // Cada vez que cambia servicio o fecha, recargar disponibilidad
  useEffect(() => {
    if (!selectedService || !selectedDate) return;
    setSlotsLoading(true);
    setSelectedSlot(null);
    getAvailability(selectedDate, selectedService.id)
      .then((r) => setSlots(r.slots))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [selectedService, selectedDate]);

  const isHomeService = config?.business_type === "HOME_SERVICE";

  async function handleSubmit() {
    if (!selectedService || !selectedSlot) return;
    setError(null);
    setSubmitting(true);
    try {
      const booking = await createBooking({
        service_id: selectedService.id,
        date: selectedDate,
        start_time: selectedSlot,
        client_name: clientName.trim(),
        client_phone: clientPhone.trim(),
        client_address: clientAddress.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      // Guardar en sessionStorage para la pantalla de confirmación
      sessionStorage.setItem("lastBooking", JSON.stringify(booking));
      router.push("/booking-confirmed");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al confirmar la reserva");
    } finally {
      setSubmitting(false);
    }
  }

  function formatTime(t: string) {
    return t.slice(0, 5);
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8 text-center">
        Reservar turno
      </h1>

      {/* ── Paso 1: Elegir servicio ──────────────── */}
      <Section
        number={1}
        title="Elegí el servicio"
        open={step === "service"}
        done={step !== "service"}
        summary={selectedService ? selectedService.name : undefined}
        onEdit={() => setStep("service")}
      >
        <div className="space-y-3 mt-3">
          {services.map((s) => (
            <ServiceCard
              key={s.id}
              service={s}
              selected={selectedService?.id === s.id}
              onClick={() => {
                setSelectedService(s);
                setStep("datetime");
              }}
            />
          ))}
        </div>
      </Section>

      {/* ── Paso 2: Fecha y horario ───────────────── */}
      <Section
        number={2}
        title="Elegí fecha y horario"
        open={step === "datetime"}
        done={step === "info" || step === "confirm"}
        summary={
          selectedSlot
            ? `${selectedDate} a las ${formatTime(selectedSlot)}`
            : undefined
        }
        onEdit={() => setStep("datetime")}
      >
        <div className="mt-3 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha
            </label>
            <input
              type="date"
              min={todayISO()}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Horarios disponibles
            </label>
            {slotsLoading ? (
              <p className="text-sm text-gray-400">Cargando horarios...</p>
            ) : (
              <TimeSlotPicker
                slots={slots}
                selected={selectedSlot}
                onSelect={(t) => {
                  setSelectedSlot(t);
                  setStep("info");
                }}
              />
            )}
          </div>
        </div>
      </Section>

      {/* ── Paso 3: Datos del cliente ─────────────── */}
      <Section
        number={3}
        title="Tus datos"
        open={step === "info"}
        done={step === "confirm"}
        summary={clientName || undefined}
        onEdit={() => setStep("info")}
      >
        <div className="mt-3 space-y-3">
          <Field label="Nombre completo *">
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="input"
              placeholder="Tu nombre"
            />
          </Field>

          <Field label="Teléfono *">
            <input
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              className="input"
              placeholder="+54 9 11 ..."
              type="tel"
            />
          </Field>

          {isHomeService && (
            <Field label="Dirección *">
              <input
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                className="input"
                placeholder="Calle, número, piso, ciudad"
              />
            </Field>
          )}

          <Field label="Notas opcionales">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input resize-none"
              rows={2}
              placeholder="Diseño, alergias, indicaciones de acceso..."
            />
          </Field>

          <button
            onClick={() => {
              if (!clientName.trim() || !clientPhone.trim()) {
                setError("Nombre y teléfono son obligatorios");
                return;
              }
              if (isHomeService && !clientAddress.trim()) {
                setError("La dirección es obligatoria para servicio a domicilio");
                return;
              }
              setError(null);
              setStep("confirm");
            }}
            className="w-full bg-rose-500 hover:bg-rose-600 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Continuar
          </button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
      </Section>

      {/* ── Paso 4: Confirmación ─────────────────── */}
      {step === "confirm" && selectedService && selectedSlot && (
        <div className="mt-4 bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Resumen del turno</h2>
          <dl className="space-y-2 text-sm">
            <Row label="Servicio" value={selectedService.name} />
            <Row label="Fecha" value={selectedDate} />
            <Row label="Hora" value={formatTime(selectedSlot)} />
            <Row label="Nombre" value={clientName} />
            <Row label="Teléfono" value={clientPhone} />
            {clientAddress && <Row label="Dirección" value={clientAddress} />}
            {notes && <Row label="Notas" value={notes} />}
          </dl>
          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-5 w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {submitting ? "Confirmando..." : "Confirmar reserva"}
          </button>
        </div>
      )}
    </main>
  );
}

// ── Helpers de UI ─────────────────────────────────────────────────────────────

function Section({
  number,
  title,
  open,
  done,
  summary,
  onEdit,
  children,
}: {
  number: number;
  title: string;
  open: boolean;
  done: boolean;
  summary?: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`mb-4 bg-white border rounded-xl px-5 py-4 transition-all ${
        open ? "border-rose-300 shadow-sm" : "border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              done
                ? "bg-rose-500 text-white"
                : open
                ? "bg-rose-100 text-rose-600"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {done ? "✓" : number}
          </span>
          <span className="font-medium text-gray-800">{title}</span>
        </div>
        {done && summary && (
          <button onClick={onEdit} className="text-xs text-rose-500 hover:underline">
            Editar
          </button>
        )}
      </div>
      {done && summary && (
        <p className="mt-1 ml-8 text-sm text-gray-500">{summary}</p>
      )}
      {open && children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-gray-900 font-medium">{value}</dd>
    </div>
  );
}

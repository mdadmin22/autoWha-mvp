"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { BookingRead } from "@/types";

export default function BookingConfirmedPage() {
  const [booking, setBooking] = useState<BookingRead | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("lastBooking");
    if (raw) {
      setBooking(JSON.parse(raw));
      sessionStorage.removeItem("lastBooking");
    }
  }, []);

  function formatTime(t: string) {
    return t.slice(0, 5);
  }

  function formatDate(d: string) {
    const [year, month, day] = d.split("-");
    return `${day}/${month}/${year}`;
  }

  return (
    <main className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="text-5xl mb-4">🎉</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        ¡Turno confirmado!
      </h1>
      <p className="text-gray-500 mb-8">
        Guardá este comprobante. Si necesitás cancelar o cambiar, contactanos por WhatsApp.
      </p>

      {booking && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-8 text-left shadow-sm">

          {/* Código de reserva — sección destacada */}
          <div className="bg-rose-50 border-b border-rose-100 px-5 py-4 text-center">
            <p className="text-xs font-semibold text-rose-400 uppercase tracking-widest mb-1">
              Código de reserva
            </p>
            <p className="text-3xl font-bold text-rose-600 tracking-widest font-mono">
              {booking.booking_code}
            </p>
            <p className="text-xs text-rose-400 mt-1">
              Mencionalo si necesitás modificar o cancelar
            </p>
          </div>

          {/* Detalle del turno */}
          <div className="px-5 py-4">
            <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">
              Detalle del turno
            </h2>
            <dl className="space-y-2 text-sm">
              <Row label="Servicio" value={booking.service.name} />
              <Row label="Fecha" value={formatDate(booking.date)} />
              <Row
                label="Hora"
                value={`${formatTime(booking.start_time)} — ${formatTime(booking.end_time)}`}
              />
              <Row label="Nombre" value={booking.client_name} />
              <Row label="Teléfono" value={booking.client_phone} />
              {booking.client_address && (
                <Row label="Dirección" value={booking.client_address} />
              )}
              {booking.notes && <Row label="Notas" value={booking.notes} />}
            </dl>
          </div>

          {/* Footer del comprobante */}
          <div className="border-t border-gray-100 px-5 py-3 bg-gray-50">
            <p className="text-xs text-gray-400 text-center">
              Estado: <span className="font-semibold text-green-600">Confirmado</span>
              {" · "}
              Reservado el{" "}
              {new Date(booking.created_at).toLocaleDateString("es-AR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      )}

      <Link href="/" className="text-rose-500 hover:underline text-sm">
        Volver al inicio
      </Link>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-500 shrink-0">{label}</dt>
      <dd className="text-gray-900 font-medium text-right">{value}</dd>
    </div>
  );
}

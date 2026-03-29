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

  return (
    <main className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="text-5xl mb-4">🎉</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        ¡Turno confirmado!
      </h1>
      <p className="text-gray-500 mb-8">
        Te esperamos. Si necesitás cancelar o cambiar, contactanos por WhatsApp.
      </p>

      {booking && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 text-left mb-8">
          <h2 className="font-semibold text-gray-800 mb-3">Detalle del turno</h2>
          <dl className="space-y-2 text-sm">
            <Row label="Servicio" value={booking.service.name} />
            <Row label="Fecha" value={booking.date} />
            <Row
              label="Hora"
              value={`${formatTime(booking.start_time)} — ${formatTime(booking.end_time)}`}
            />
            <Row label="Nombre" value={booking.client_name} />
            {booking.client_address && (
              <Row label="Dirección" value={booking.client_address} />
            )}
            {booking.notes && <Row label="Notas" value={booking.notes} />}
          </dl>
        </div>
      )}

      <Link
        href="/"
        className="text-rose-500 hover:underline text-sm"
      >
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

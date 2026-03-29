/**
 * Landing pública del negocio.
 * Muestra nombre, descripción, servicios activos y botón de reserva.
 */
import Link from "next/link";
import { getBusinessConfig, getServices } from "@/lib/api";
import type { BusinessConfig, Service } from "@/types";

export const revalidate = 60; // ISR: revalidar cada 60 seg

export default async function HomePage() {
  let config: BusinessConfig | null = null;
  let services: Service[] = [];

  try {
    [config, services] = await Promise.all([getBusinessConfig(), getServices()]);
  } catch {
    // Si el backend no está disponible, mostrar pantalla de error amigable
  }

  if (!config) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">El sistema no está disponible en este momento.</p>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      {/* Header del negocio */}
      <header className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">{config.name}</h1>
        {config.description && (
          <p className="text-lg text-gray-600">{config.description}</p>
        )}
        {config.landing_text && (
          <p className="mt-4 text-gray-500 italic">{config.landing_text}</p>
        )}
        <div className="flex justify-center gap-4 mt-4 text-sm text-gray-500">
          {config.whatsapp && (
            <a
              href={`https://wa.me/${config.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-green-600"
            >
              WhatsApp
            </a>
          )}
          {config.instagram && (
            <a
              href={`https://instagram.com/${config.instagram.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-rose-500"
            >
              {config.instagram}
            </a>
          )}
        </div>
      </header>

      {/* Servicios */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Servicios</h2>
        <div className="space-y-3">
          {services.map((s) => (
            <div
              key={s.id}
              className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-center"
            >
              <div>
                <p className="font-medium text-gray-900">{s.name}</p>
                <p className="text-sm text-gray-500">{s.duration_minutes} min</p>
              </div>
              {s.price != null && (
                <span className="text-rose-600 font-semibold">
                  ${s.price.toLocaleString("es-AR")}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="text-center">
        <Link
          href="/book"
          className="inline-block bg-rose-500 hover:bg-rose-600 text-white font-semibold py-3 px-8 rounded-xl transition-colors text-lg"
        >
          Reservar turno
        </Link>
      </div>
    </main>
  );
}

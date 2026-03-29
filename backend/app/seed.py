"""
Seed de datos demo para desarrollo.

El seed es IDEMPOTENTE: si ya existen datos en la base, no hace nada.
Solo inserta datos en una base de datos completamente vacía.
Las reservas (Booking) nunca se tocan.

Ejecutar con:
    python -m app.seed
"""
from datetime import time
from app.database import SessionLocal, engine, Base
import app.models  # noqa — registra los modelos

from app.models.business import BusinessConfig
from app.models.service import Service
from app.models.business_hours import BusinessHours


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Si ya hay configuración, el sistema ya fue inicializado → no tocar nada.
        existing = db.query(BusinessConfig).first()
        if existing:
            print(f"ℹ️  Seed omitido: ya existe configuración para '{existing.name}'. "
                  "Los datos actuales no fueron modificados.")
            return

        # ── Primera vez: insertar datos demo ──────────────────────────────

        # Negocio
        config = BusinessConfig(
            name="Noelia Nails",
            business_type="HOME_SERVICE",
            description="Servicio profesional de uñas a domicilio. Diseños únicos para vos.",
            whatsapp="+5491123456789",
            instagram="@noelianails",
            landing_text="Reservá tu turno y te visito donde estés. Sin cola, sin esperas.",
            slot_duration_minutes=30,
            buffer_minutes=15,
        )
        db.add(config)

        # Servicios
        services = [
            Service(name="Esmaltado semipermanente", duration_minutes=60, price=4500.0, is_active=True),
            Service(name="Esculpidas acrílicas",     duration_minutes=90, price=7000.0, is_active=True),
            Service(name="Kapping (uñas blandas)",   duration_minutes=75, price=6000.0, is_active=True),
            Service(name="Retoque / mantenimiento",  duration_minutes=45, price=3500.0, is_active=True),
            Service(name="Manicura express",         duration_minutes=30, price=2500.0, is_active=True),
        ]
        db.add_all(services)

        # Horarios laborales
        # Lunes–Viernes: 9:00–19:00 · Sábado: 9:00–14:00 · Domingo: cerrado
        hours = [
            BusinessHours(day_of_week=0, start_time=time(9, 0), end_time=time(19, 0), is_active=True),
            BusinessHours(day_of_week=1, start_time=time(9, 0), end_time=time(19, 0), is_active=True),
            BusinessHours(day_of_week=2, start_time=time(9, 0), end_time=time(19, 0), is_active=True),
            BusinessHours(day_of_week=3, start_time=time(9, 0), end_time=time(19, 0), is_active=True),
            BusinessHours(day_of_week=4, start_time=time(9, 0), end_time=time(19, 0), is_active=True),
            BusinessHours(day_of_week=5, start_time=time(9, 0), end_time=time(14, 0), is_active=True),
            BusinessHours(day_of_week=6, start_time=time(9, 0), end_time=time(13, 0), is_active=False),
        ]
        db.add_all(hours)

        db.commit()
        print("✅ Seed completado: 'Noelia Nails' con 5 servicios y horarios demo.")

    finally:
        db.close()


if __name__ == "__main__":
    seed()

"""
Lógica de disponibilidad de turnos.

Dado un día y un servicio, genera todos los slots posibles dentro del horario
laboral y filtra los que colisionan con reservas existentes (considerando
duración del servicio + buffer entre turnos).
"""
from datetime import date, time, datetime, timedelta
from typing import List
from sqlalchemy.orm import Session

from app.models.booking import Booking
from app.models.business_hours import BusinessHours
from app.models.service import Service
from app.models.business import BusinessConfig
from app.schemas.availability import AvailableSlot


def get_available_slots(
    db: Session,
    target_date: date,
    service_id: int,
) -> List[AvailableSlot]:
    """
    Retorna la lista de horarios disponibles para un servicio en una fecha.
    """
    # --- 1. Cargar datos base ---
    service = db.query(Service).filter(Service.id == service_id, Service.is_active == True).first()
    if not service:
        return []

    config = db.query(BusinessConfig).first()
    if not config:
        return []

    # --- 2. Horario laboral del día ---
    day_of_week = target_date.weekday()  # 0=Lunes
    hours = db.query(BusinessHours).filter(
        BusinessHours.day_of_week == day_of_week,
        BusinessHours.is_active == True,
    ).first()
    if not hours:
        return []

    # --- 3. No mostrar slots en el pasado ---
    now = datetime.now()
    is_today = (target_date == now.date())

    # --- 4. Generar grilla de posibles inicios ---
    slot_step = timedelta(minutes=config.slot_duration_minutes)
    service_duration = timedelta(minutes=service.duration_minutes)
    buffer = timedelta(minutes=config.buffer_minutes)

    day_start = datetime.combine(target_date, hours.start_time)
    day_end = datetime.combine(target_date, hours.end_time)

    potential_starts = []
    cursor = day_start
    while cursor + service_duration <= day_end:
        # No ofrecer slots pasados si es hoy
        if not is_today or cursor > now:
            potential_starts.append(cursor)
        cursor += slot_step

    if not potential_starts:
        return []

    # --- 5. Reservas confirmadas del día ---
    existing_bookings = db.query(Booking).filter(
        Booking.date == target_date,
        Booking.status == "confirmed",
    ).all()

    # --- 6. Filtrar slots que colisionan ---
    available: List[AvailableSlot] = []

    for slot_start in potential_starts:
        slot_end = slot_start + service_duration

        conflict = False
        for booking in existing_bookings:
            b_start = datetime.combine(target_date, booking.start_time)
            b_end = datetime.combine(target_date, booking.end_time)

            # Ventana ocupada: [b_start, b_end + buffer)
            # Ventana del slot: [slot_start, slot_end + buffer)
            # Hay conflicto si las ventanas se superponen
            if slot_start < (b_end + buffer) and b_start < (slot_end + buffer):
                conflict = True
                break

        if not conflict:
            available.append(AvailableSlot(
                start_time=slot_start.time(),
                end_time=slot_end.time(),
            ))

    return available

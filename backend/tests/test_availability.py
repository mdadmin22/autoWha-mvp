"""
Tests del servicio de disponibilidad (get_available_slots).

Se testea la función directamente usando una sesión de DB en memoria,
sin pasar por HTTP. Cubre los casos críticos del núcleo del sistema.
"""
from datetime import date, time, timedelta

import pytest

from app.models.booking import Booking
from app.models.business import BusinessConfig
from app.models.business_hours import BusinessHours
from app.models.service import Service
from app.services.availability import get_available_slots


def next_weekday(weekday: int) -> date:
    """Retorna la próxima fecha del día de semana dado (0=Lunes), nunca hoy."""
    today = date.today()
    days_ahead = weekday - today.weekday()
    if days_ahead <= 0:
        days_ahead += 7
    return today + timedelta(days=days_ahead)


@pytest.fixture
def base_data(db):
    """
    Config: slot=30min, buffer=0, servicio=60min, horario lunes 09:00-19:00.
    """
    config = BusinessConfig(
        name="Test",
        business_type="HOME_SERVICE",
        slot_duration_minutes=30,
        buffer_minutes=0,
    )
    service = Service(name="Servicio Test", duration_minutes=60, is_active=True)
    # Solo hay horario para Lunes (0); cualquier otro día devolverá vacío
    hours = BusinessHours(
        day_of_week=0,
        start_time=time(9, 0),
        end_time=time(19, 0),
        is_active=True,
    )
    db.add_all([config, service, hours])
    db.commit()
    return {"config": config, "service": service, "hours": hours}


# ── Fechas pasadas ────────────────────────────────────────────────────────────

class TestFechaPasada:
    def test_ayer_retorna_vacio(self, db, base_data):
        yesterday = date.today() - timedelta(days=1)
        slots = get_available_slots(db, yesterday, base_data["service"].id)
        assert slots == []

    def test_hace_una_semana_retorna_vacio(self, db, base_data):
        last_week = date.today() - timedelta(days=7)
        slots = get_available_slots(db, last_week, base_data["service"].id)
        assert slots == []


# ── Días sin horario laboral ──────────────────────────────────────────────────

class TestDiaSinHorario:
    def test_dia_sin_registro_retorna_vacio(self, db, base_data):
        # Solo hay horario para Lunes; pedimos Martes
        next_tuesday = next_weekday(1)
        slots = get_available_slots(db, next_tuesday, base_data["service"].id)
        assert slots == []

    def test_dia_inactivo_retorna_vacio(self, db, base_data):
        inactive = BusinessHours(
            day_of_week=1,
            start_time=time(9, 0),
            end_time=time(19, 0),
            is_active=False,
        )
        db.add(inactive)
        db.commit()
        next_tuesday = next_weekday(1)
        slots = get_available_slots(db, next_tuesday, base_data["service"].id)
        assert slots == []


# ── Slots ocupados ────────────────────────────────────────────────────────────

class TestSlotOcupado:
    def test_slot_con_reserva_confirmada_no_aparece(self, db, base_data):
        next_monday = next_weekday(0)
        service = base_data["service"]
        booking = Booking(
            service_id=service.id,
            date=next_monday,
            start_time=time(9, 0),
            end_time=time(10, 0),
            client_name="Ana",
            client_phone="123",
            status="confirmed",
        )
        db.add(booking)
        db.commit()

        slots = get_available_slots(db, next_monday, service.id)
        slot_times = [s.start_time for s in slots]
        assert time(9, 0) not in slot_times

    def test_slot_con_reserva_cancelada_aparece(self, db, base_data):
        next_monday = next_weekday(0)
        service = base_data["service"]
        booking = Booking(
            service_id=service.id,
            date=next_monday,
            start_time=time(9, 0),
            end_time=time(10, 0),
            client_name="Ana",
            client_phone="123",
            status="cancelled",
        )
        db.add(booking)
        db.commit()

        slots = get_available_slots(db, next_monday, service.id)
        slot_times = [s.start_time for s in slots]
        assert time(9, 0) in slot_times


# ── Buffer entre turnos ───────────────────────────────────────────────────────

class TestBuffer:
    def test_buffer_bloquea_slots_adyacentes(self, db, base_data):
        """
        Reserva 09:00-10:00, buffer=15min.
        Ventana bloqueada efectiva: hasta 10:15.
        - 09:30 bloqueado (dentro de ventana)
        - 10:00 bloqueado (dentro de ventana)
        - 10:30 disponible (fuera de ventana)
        """
        base_data["config"].buffer_minutes = 15
        db.commit()

        next_monday = next_weekday(0)
        service = base_data["service"]
        booking = Booking(
            service_id=service.id,
            date=next_monday,
            start_time=time(9, 0),
            end_time=time(10, 0),
            client_name="Ana",
            client_phone="123",
            status="confirmed",
        )
        db.add(booking)
        db.commit()

        slots = get_available_slots(db, next_monday, service.id)
        slot_times = [s.start_time for s in slots]

        assert time(9, 30) not in slot_times, "09:30 debe estar bloqueado por buffer"
        assert time(10, 0) not in slot_times, "10:00 debe estar bloqueado por buffer"
        assert time(10, 30) in slot_times, "10:30 debe estar disponible"


# ── Rango horario ─────────────────────────────────────────────────────────────

class TestRangoHorario:
    def test_slots_dentro_del_horario_laboral(self, db, base_data):
        """Ningún slot debe empezar antes de las 09:00 ni terminar después de 19:00."""
        next_monday = next_weekday(0)
        service = base_data["service"]  # 60 min
        slots = get_available_slots(db, next_monday, service.id)

        assert len(slots) > 0, "Debe haber slots disponibles"
        for slot in slots:
            assert slot.start_time >= time(9, 0), f"Slot {slot.start_time} empieza antes del horario"
            assert slot.end_time <= time(19, 0), f"Slot {slot.end_time} termina después del horario"

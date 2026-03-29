"""
Tests de integración para los endpoints públicos de reservas.

Usa TestClient con DB en memoria. Cubre validaciones críticas del endpoint
POST /bookings y GET /availability.
"""
from datetime import date, time, timedelta

import pytest

from app.models.business import BusinessConfig
from app.models.business_hours import BusinessHours
from app.models.service import Service


def next_weekday(weekday: int) -> date:
    """Retorna la próxima fecha del día de semana dado (0=Lunes), nunca hoy."""
    today = date.today()
    days_ahead = weekday - today.weekday()
    if days_ahead <= 0:
        days_ahead += 7
    return today + timedelta(days=days_ahead)


@pytest.fixture
def seed(db):
    """Datos mínimos: negocio HOME_SERVICE, 1 servicio, horario para Lunes."""
    config = BusinessConfig(
        name="Noelia Nails",
        business_type="HOME_SERVICE",
        slot_duration_minutes=30,
        buffer_minutes=0,
    )
    service = Service(name="Esmaltado", duration_minutes=60, is_active=True)
    hours = BusinessHours(
        day_of_week=0,
        start_time=time(9, 0),
        end_time=time(19, 0),
        is_active=True,
    )
    db.add_all([config, service, hours])
    db.commit()
    return {"config": config, "service": service}


class TestCrearReserva:
    def test_home_service_sin_direccion_da_422(self, client, seed):
        next_monday = next_weekday(0)
        res = client.post("/bookings", json={
            "service_id": seed["service"].id,
            "date": str(next_monday),
            "start_time": "09:00:00",
            "client_name": "Ana",
            "client_phone": "1123456789",
            # sin client_address — debe fallar para HOME_SERVICE
        })
        assert res.status_code == 422

    def test_fecha_pasada_da_422(self, client, seed):
        yesterday = str(date.today() - timedelta(days=1))
        res = client.post("/bookings", json={
            "service_id": seed["service"].id,
            "date": yesterday,
            "start_time": "09:00:00",
            "client_name": "Ana",
            "client_phone": "1123456789",
            "client_address": "Calle Falsa 123",
        })
        assert res.status_code == 422

    def test_reserva_exitosa_retorna_201(self, client, seed):
        next_monday = next_weekday(0)
        res = client.post("/bookings", json={
            "service_id": seed["service"].id,
            "date": str(next_monday),
            "start_time": "09:00:00",
            "client_name": "Ana",
            "client_phone": "1123456789",
            "client_address": "Calle Falsa 123",
        })
        assert res.status_code == 201
        data = res.json()
        assert data["status"] == "confirmed"
        assert data["client_name"] == "Ana"

    def test_reserva_duplicada_da_409(self, client, seed):
        next_monday = next_weekday(0)
        payload = {
            "service_id": seed["service"].id,
            "date": str(next_monday),
            "start_time": "09:00:00",
            "client_name": "Ana",
            "client_phone": "1123456789",
            "client_address": "Calle Falsa 123",
        }
        res1 = client.post("/bookings", json=payload)
        assert res1.status_code == 201

        res2 = client.post("/bookings", json=payload)
        assert res2.status_code == 409


class TestDisponibilidad:
    def test_fecha_pasada_retorna_slots_vacios(self, client, seed):
        yesterday = str(date.today() - timedelta(days=1))
        res = client.get(f"/availability?date={yesterday}&service_id={seed['service'].id}")
        assert res.status_code == 200
        assert res.json()["slots"] == []

    def test_dia_con_horario_retorna_slots(self, client, seed):
        next_monday = next_weekday(0)
        res = client.get(f"/availability?date={next_monday}&service_id={seed['service'].id}")
        assert res.status_code == 200
        assert len(res.json()["slots"]) > 0

"""
Endpoints públicos — accesibles desde el frontend sin autenticación.
"""
from datetime import date, time, datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.business import BusinessConfig
from app.models.service import Service
from app.models.booking import Booking
from app.schemas.business import BusinessConfigRead
from app.schemas.service import ServiceRead
from app.schemas.booking import BookingCreate, BookingRead
from app.schemas.availability import AvailabilityResponse
from app.services.availability import get_available_slots

router = APIRouter()


@router.get("/business-config", response_model=BusinessConfigRead)
def get_business_config(db: Session = Depends(get_db)):
    config = db.query(BusinessConfig).first()
    if not config:
        raise HTTPException(status_code=404, detail="Configuración no encontrada")
    return config


@router.get("/services", response_model=List[ServiceRead])
def list_services(db: Session = Depends(get_db)):
    """Devuelve solo servicios activos (para la landing y el formulario de reserva)."""
    return db.query(Service).filter(Service.is_active == True).all()


@router.get("/availability", response_model=AvailabilityResponse)
def get_availability(
    date: date = Query(..., description="Fecha en formato YYYY-MM-DD"),
    service_id: int = Query(..., description="ID del servicio"),
    db: Session = Depends(get_db),
):
    """
    Devuelve los horarios disponibles para un servicio en una fecha.
    Solo muestra slots libres; nunca expone horarios ocupados.
    """
    slots = get_available_slots(db, date, service_id)
    return AvailabilityResponse(date=date, service_id=service_id, slots=slots)


@router.post("/bookings", response_model=BookingRead, status_code=201)
def create_booking(payload: BookingCreate, db: Session = Depends(get_db)):
    """
    Crea una reserva validando:
    - Que el servicio exista y esté activo
    - Que el horario esté disponible (sin superposición)
    - Que se informe dirección si el negocio es HOME_SERVICE
    """
    # Validar servicio
    service = db.query(Service).filter(Service.id == payload.service_id, Service.is_active == True).first()
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado o inactivo")

    # Validar dirección obligatoria para HOME_SERVICE
    config = db.query(BusinessConfig).first()
    if config and config.business_type == "HOME_SERVICE":
        if not payload.client_address or not payload.client_address.strip():
            raise HTTPException(
                status_code=422,
                detail="La dirección es obligatoria para servicios a domicilio"
            )

    # Rechazar fechas pasadas
    if payload.date < date.today():
        raise HTTPException(status_code=422, detail="No se pueden crear reservas en fechas pasadas")

    # Calcular end_time
    start_dt = datetime.combine(payload.date, payload.start_time)
    end_dt = start_dt + timedelta(minutes=service.duration_minutes)

    # Verificar disponibilidad (doble check server-side)
    available_slots = get_available_slots(db, payload.date, payload.service_id)
    slot_times = [s.start_time for s in available_slots]
    if payload.start_time not in slot_times:
        raise HTTPException(
            status_code=409,
            detail="El horario seleccionado ya no está disponible"
        )

    booking = Booking(
        service_id=payload.service_id,
        date=payload.date,
        start_time=payload.start_time,
        end_time=end_dt.time(),
        client_name=payload.client_name,
        client_phone=payload.client_phone,
        client_address=payload.client_address,
        notes=payload.notes,
        status="confirmed",
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking

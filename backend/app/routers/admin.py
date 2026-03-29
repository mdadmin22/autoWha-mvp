"""
Endpoints de administración.
Protegidos con HTTP Basic Auth via ADMIN_PASSWORD (ver .env).
"""
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.auth import verify_admin
from app.database import get_db
from app.models.business import BusinessConfig
from app.models.service import Service
from app.models.booking import Booking
from app.models.business_hours import BusinessHours
from app.schemas.business import BusinessConfigRead, BusinessConfigUpdate
from app.schemas.service import ServiceRead, ServiceCreate, ServiceUpdate
from app.schemas.booking import BookingRead
from app.schemas.business_hours import BusinessHoursRead, BusinessHoursCreate

router = APIRouter(prefix="/admin", dependencies=[Depends(verify_admin)])


# ──────────────────────────────────────────────
# Configuración del negocio
# ──────────────────────────────────────────────

@router.get("/business-config", response_model=BusinessConfigRead)
def admin_get_config(db: Session = Depends(get_db)):
    config = db.query(BusinessConfig).first()
    if not config:
        raise HTTPException(status_code=404, detail="Configuración no encontrada")
    return config


@router.put("/business-config", response_model=BusinessConfigRead)
def admin_update_config(payload: BusinessConfigUpdate, db: Session = Depends(get_db)):
    config = db.query(BusinessConfig).first()
    if not config:
        raise HTTPException(status_code=404, detail="Configuración no encontrada")
    for field, value in payload.model_dump().items():
        setattr(config, field, value)
    db.commit()
    db.refresh(config)
    return config


# ──────────────────────────────────────────────
# Servicios
# ──────────────────────────────────────────────

@router.get("/services", response_model=List[ServiceRead])
def admin_list_services(db: Session = Depends(get_db)):
    """Lista todos los servicios (activos e inactivos)."""
    return db.query(Service).all()


@router.post("/services", response_model=ServiceRead, status_code=201)
def admin_create_service(payload: ServiceCreate, db: Session = Depends(get_db)):
    service = Service(**payload.model_dump())
    db.add(service)
    db.commit()
    db.refresh(service)
    return service


@router.put("/services/{service_id}", response_model=ServiceRead)
def admin_update_service(service_id: int, payload: ServiceUpdate, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    for field, value in payload.model_dump().items():
        setattr(service, field, value)
    db.commit()
    db.refresh(service)
    return service


# ──────────────────────────────────────────────
# Reservas
# ──────────────────────────────────────────────

@router.get("/bookings", response_model=List[BookingRead])
def admin_list_bookings(
    date_filter: Optional[date] = Query(None, alias="date"),
    db: Session = Depends(get_db),
):
    """Lista reservas. Si se pasa ?date=YYYY-MM-DD filtra por día."""
    query = db.query(Booking)
    if date_filter:
        query = query.filter(Booking.date == date_filter)
    return query.order_by(Booking.date, Booking.start_time).all()


@router.patch("/bookings/{booking_id}/cancel", response_model=BookingRead)
def admin_cancel_booking(booking_id: int, db: Session = Depends(get_db)):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    booking.status = "cancelled"
    db.commit()
    db.refresh(booking)
    return booking


# ──────────────────────────────────────────────
# Horarios laborales
# ──────────────────────────────────────────────

@router.get("/business-hours", response_model=List[BusinessHoursRead])
def admin_list_hours(db: Session = Depends(get_db)):
    return db.query(BusinessHours).order_by(BusinessHours.day_of_week).all()


@router.put("/business-hours/{hours_id}", response_model=BusinessHoursRead)
def admin_update_hours(hours_id: int, payload: BusinessHoursCreate, db: Session = Depends(get_db)):
    hours = db.query(BusinessHours).filter(BusinessHours.id == hours_id).first()
    if not hours:
        raise HTTPException(status_code=404, detail="Horario no encontrado")
    for field, value in payload.model_dump().items():
        setattr(hours, field, value)
    db.commit()
    db.refresh(hours)
    return hours

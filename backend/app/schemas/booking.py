from pydantic import BaseModel
from typing import Optional
from datetime import date, time, datetime
from enum import Enum

from app.schemas.service import ServiceRead


class BookingStatus(str, Enum):
    confirmed = "confirmed"
    cancelled = "cancelled"


class BookingCreate(BaseModel):
    service_id: int
    date: date
    start_time: time
    client_name: str
    client_phone: str
    client_address: Optional[str] = None
    notes: Optional[str] = None


class BookingRead(BaseModel):
    id: int
    service_id: int
    service: ServiceRead
    date: date
    start_time: time
    end_time: time
    client_name: str
    client_phone: str
    client_address: Optional[str] = None
    notes: Optional[str] = None
    status: BookingStatus
    created_at: datetime

    class Config:
        from_attributes = True

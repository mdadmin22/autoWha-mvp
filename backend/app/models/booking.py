from sqlalchemy import Column, Integer, String, Text, Date, Time, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Booking(Base):
    """Reserva de un turno."""
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)

    date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)   # Calculado: start + duración del servicio

    client_name = Column(String(200), nullable=False)
    client_phone = Column(String(50), nullable=False)
    # Obligatorio si business_type = HOME_SERVICE, validado en la capa de negocio
    client_address = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)

    status = Column(
        Enum("confirmed", "cancelled", name="booking_status_enum"),
        nullable=False,
        default="confirmed"
    )
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    service = relationship("Service", lazy="joined")

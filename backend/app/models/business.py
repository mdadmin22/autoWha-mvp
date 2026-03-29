from sqlalchemy import Column, Integer, String, Text, Enum
from app.database import Base


class BusinessConfig(Base):
    """Configuración central del negocio. Solo existe un registro."""
    __tablename__ = "business_config"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    # HOME_SERVICE: profesional va al domicilio del cliente
    # FIXED_LOCATION: cliente viene al local
    business_type = Column(
        Enum("HOME_SERVICE", "FIXED_LOCATION", name="business_type_enum"),
        nullable=False,
        default="HOME_SERVICE"
    )
    description = Column(Text, nullable=True)
    whatsapp = Column(String(50), nullable=True)
    instagram = Column(String(100), nullable=True)
    landing_text = Column(Text, nullable=True)

    # Duración base de cada slot en la grilla de disponibilidad (minutos)
    slot_duration_minutes = Column(Integer, nullable=False, default=30)
    # Tiempo de espera entre turnos consecutivos (minutos)
    buffer_minutes = Column(Integer, nullable=False, default=0)

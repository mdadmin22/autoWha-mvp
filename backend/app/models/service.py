from sqlalchemy import Column, Integer, String, Float, Boolean
from app.database import Base


class Service(Base):
    """Servicio ofrecido por el negocio."""
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    price = Column(Float, nullable=True)   # Opcional: puede no mostrarse precio
    is_active = Column(Boolean, nullable=False, default=True)

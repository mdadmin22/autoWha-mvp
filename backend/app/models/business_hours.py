from sqlalchemy import Column, Integer, Time, Boolean
from app.database import Base


class BusinessHours(Base):
    """Horario laboral por día de la semana."""
    __tablename__ = "business_hours"

    id = Column(Integer, primary_key=True, index=True)
    # 0=Lunes ... 6=Domingo (convención Python datetime.weekday())
    day_of_week = Column(Integer, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)

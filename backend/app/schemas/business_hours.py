from pydantic import BaseModel
from datetime import time
from typing import List


DAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]


class BusinessHoursBase(BaseModel):
    day_of_week: int   # 0=Lunes, 6=Domingo
    start_time: time
    end_time: time
    is_active: bool = True


class BusinessHoursCreate(BusinessHoursBase):
    pass


class BusinessHoursRead(BusinessHoursBase):
    id: int
    day_name: str = ""

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_with_name(cls, obj):
        instance = cls.model_validate(obj)
        instance.day_name = DAY_NAMES[obj.day_of_week] if 0 <= obj.day_of_week <= 6 else ""
        return instance

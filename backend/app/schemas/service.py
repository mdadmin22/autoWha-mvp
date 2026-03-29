from pydantic import BaseModel
from typing import Optional


class ServiceBase(BaseModel):
    name: str
    duration_minutes: int
    price: Optional[float] = None
    is_active: bool = True


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(ServiceBase):
    pass


class ServiceRead(ServiceBase):
    id: int

    class Config:
        from_attributes = True

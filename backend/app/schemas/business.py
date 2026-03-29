from pydantic import BaseModel
from typing import Optional
from enum import Enum


class BusinessType(str, Enum):
    HOME_SERVICE = "HOME_SERVICE"
    FIXED_LOCATION = "FIXED_LOCATION"


class BusinessConfigBase(BaseModel):
    name: str
    business_type: BusinessType
    description: Optional[str] = None
    whatsapp: Optional[str] = None
    instagram: Optional[str] = None
    landing_text: Optional[str] = None
    slot_duration_minutes: int = 30
    buffer_minutes: int = 0


class BusinessConfigRead(BusinessConfigBase):
    id: int

    class Config:
        from_attributes = True


class BusinessConfigUpdate(BusinessConfigBase):
    pass

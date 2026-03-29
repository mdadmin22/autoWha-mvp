from pydantic import BaseModel
from typing import List
from datetime import date, time


class AvailableSlot(BaseModel):
    start_time: time
    end_time: time


class AvailabilityResponse(BaseModel):
    date: date
    service_id: int
    slots: List[AvailableSlot]

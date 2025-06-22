from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class User(BaseModel):
    id: str
    email: str
    created_at: datetime


class DashboardStats(BaseModel):
    user_id: str
    user_email: str
    account_created: datetime
    total_sessions: int = 0
    last_login: Optional[datetime] = None 

class AccidentData(BaseModel):
    date: datetime
    time: str
    location: str
    description: str
    injuries: str
    fatalities: int
    immidate_cause: str
    root_cause: str
    contributing_human_factors: str
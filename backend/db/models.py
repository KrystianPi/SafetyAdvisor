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
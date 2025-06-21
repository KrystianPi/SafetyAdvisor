from fastapi import APIRouter, Depends
from auth.dependencies import get_current_user
from db.models import User, DashboardStats

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/user", response_model=DashboardStats)
async def get_dashboard_user_info(current_user: User = Depends(get_current_user)):
    """
    Get user information for dashboard display
    """
    return DashboardStats(
        user_id=current_user.id,
        user_email=current_user.email,
        account_created=current_user.created_at,
        total_sessions=1,  # This could be tracked in a real app
        last_login=current_user.created_at,  # Simplified for now
    ) 
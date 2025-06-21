import os
from datetime import datetime
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel
from supabase import Client, create_client

load_dotenv()

app = FastAPI(
    title="SafetyAdvisor API",
    description="Safety management and compliance tracking API",
    version="1.0.0",
)

# CORS configuration for Vercel frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Local development
        "https://*.vercel.app",  # Vercel deployments
        os.getenv("FRONTEND_URL", ""),  # Your custom domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase setup
supabase_url = os.getenv("SUPABASE_URL")
supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase_jwt_secret = os.getenv("SUPABASE_JWT_SECRET")

if not all([supabase_url, supabase_service_key, supabase_jwt_secret]):
    raise ValueError("Missing required Supabase environment variables")

supabase: Client = create_client(supabase_url, supabase_service_key)

# Security
security = HTTPBearer()


# Pydantic models
class User(BaseModel):
    id: str
    email: str
    created_at: datetime


class SafetyReport(BaseModel):
    id: Optional[str] = None
    title: str
    description: str
    severity: str  # low, medium, high, critical
    location: str
    reported_by: str
    created_at: Optional[datetime] = None


class SafetyReportCreate(BaseModel):
    title: str
    description: str
    severity: str
    location: str


# Authentication dependency
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> User:
    """
    Verify JWT token from Supabase and return user info
    """
    try:
        token = credentials.credentials

        # Decode JWT token using Supabase's JWT secret
        payload = jwt.decode(
            token, supabase_jwt_secret, algorithms=["HS256"], audience="authenticated"
        )

        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
            )

        # Get user info from Supabase
        response = supabase.auth.admin.get_user_by_id(user_id)
        if not response or not response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
            )

        return User(
            id=response.user.id,
            email=response.user.email or "",
            created_at=datetime.fromisoformat(
                response.user.created_at.replace("Z", "+00:00")
            ),
        )

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication error: {str(e)}",
        )


# Routes
@app.get("/")
async def root():
    return {"message": "SafetyAdvisor API is running! 🛡️"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now()}


@app.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current authenticated user info"""
    return current_user


@app.get("/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    """Get dashboard statistics (mockup for now)"""
    return {
        "safety_reports": 24,
        "active_alerts": 3,
        "incidents": 7,
        "compliance_score": 94,
        "user_id": current_user.id,
    }


@app.get("/safety-reports", response_model=List[SafetyReport])
async def get_safety_reports(current_user: User = Depends(get_current_user)):
    """Get all safety reports (mockup data for now)"""
    mock_reports = [
        SafetyReport(
            id="1",
            title="Fire Alarm Test",
            description="Monthly fire alarm system test completed successfully",
            severity="low",
            location="Building A - Floor 2",
            reported_by=current_user.email,
            created_at=datetime.now(),
        ),
        SafetyReport(
            id="2",
            title="Spill in Warehouse",
            description="Chemical spill detected in warehouse area, cleanup required",
            severity="high",
            location="Warehouse - Zone C",
            reported_by=current_user.email,
            created_at=datetime.now(),
        ),
    ]
    return mock_reports


@app.post("/safety-reports", response_model=SafetyReport)
async def create_safety_report(
    report: SafetyReportCreate, current_user: User = Depends(get_current_user)
):
    """Create a new safety report"""
    # In a real app, you'd save this to your database
    new_report = SafetyReport(
        id=f"report_{datetime.now().timestamp()}",
        title=report.title,
        description=report.description,
        severity=report.severity,
        location=report.location,
        reported_by=current_user.email,
        created_at=datetime.now(),
    )
    return new_report


@app.get("/activity")
async def get_recent_activity(current_user: User = Depends(get_current_user)):
    """Get recent activity feed"""
    activities = [
        {
            "id": 1,
            "message": "New safety report submitted for Building A",
            "type": "report",
            "timestamp": "2 hours ago",
            "color": "blue",
        },
        {
            "id": 2,
            "message": "Critical alert: Fire alarm system offline",
            "type": "alert",
            "timestamp": "4 hours ago",
            "color": "red",
        },
        {
            "id": 3,
            "message": "Safety training completed by 15 employees",
            "type": "training",
            "timestamp": "1 day ago",
            "color": "green",
        },
    ]
    return activities


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

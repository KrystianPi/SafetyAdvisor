from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from auth.dependencies import get_current_user
from db.models import User, DashboardStats, AccidentData
from services.extractor import process_pdf_file
import tempfile
import os

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


@router.post("/upload", response_model=AccidentData)
async def upload_accident_report(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Upload and process an accident report PDF to extract structured data
    """
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    # Create temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
        content = await file.read()
        temp_file.write(content)
        temp_file_path = temp_file.name
    
    try:
        # Process the PDF and extract accident data
        accident_data = process_pdf_file(temp_file_path)
        return accident_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")
    finally:
        # Clean up temporary file
        if os.path.exists(temp_file_path):
            os.unlink(temp_file_path) 
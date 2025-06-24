from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from auth.dependencies import get_current_user
from db.models import User, DashboardStats, AccidentData
from db.queries import get_all_incidents, insert_incident
from services.extractor import process_pdf_file
import tempfile
import os
import logging

logger = logging.getLogger(__name__)

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


@router.get("/incidents")
async def get_all_dashboard_incidents(current_user: User = Depends(get_current_user)):
    """
    Get all incidents for dashboard visualizations
    """
    try:
        incidents = get_all_incidents()
        logger.info(f"Retrieved {len(incidents)} incidents for dashboard")
        return {"incidents": incidents}
    except Exception as e:
        logger.error(f"Error fetching incidents for dashboard: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve incidents")


@router.post("/save-incident")
async def save_incident_to_database(
    accident_data: AccidentData, current_user: User = Depends(get_current_user)
):
    """
    Save an incident to the database
    """
    try:
        inserted_incident = insert_incident(accident_data)
        logger.info(
            f"Successfully saved incident to database with ID: {inserted_incident['id']}"
        )
        return {
            "success": True,
            "message": "Incident saved successfully",
            "incident_id": inserted_incident["id"],
        }
    except Exception as e:
        logger.error(f"Error saving incident to database: {str(e)}")
        raise HTTPException(
            status_code=500, detail="Failed to save incident to database"
        )


@router.post("/upload", response_model=AccidentData)
async def upload_accident_report(
    file: UploadFile = File(...), current_user: User = Depends(get_current_user)
):
    """
    Upload and process an accident report PDF to extract structured data
    """
    logger.info(f"Received file upload: {file.filename} from user {current_user.email}")

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        logger.error(f"Invalid file type: {file.filename}")
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    temp_file_path = None
    try:
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            content = await file.read()
            logger.info(f"File size: {len(content)} bytes")
            temp_file.write(content)
            temp_file_path = temp_file.name

        logger.info(f"Temporary file created: {temp_file_path}")

        # Process the PDF and extract accident data
        accident_data = process_pdf_file(temp_file_path)
        logger.info("Successfully processed PDF and extracted accident data")
        return accident_data

    except ValueError as e:
        # These are our custom errors from the processing functions
        logger.error(f"Processing error: {str(e)}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        # Unexpected errors
        logger.error(
            f"Unexpected error during file processing: {str(e)}", exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while processing the file",
        )
    finally:
        # Clean up temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
                logger.info(f"Cleaned up temporary file: {temp_file_path}")
            except Exception as e:
                logger.warning(
                    f"Failed to clean up temporary file {temp_file_path}: {str(e)}"
                )

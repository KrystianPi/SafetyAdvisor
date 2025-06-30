import logging
import os
import tempfile

import pandas as pd
from auth.dependencies import get_current_user
from db.models import AccidentData, DashboardStats, PTWData, User
from db.queries import (
    get_all_incidents,
    get_incident_by_id,
    get_similar_incidents,
    insert_incident,
)
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel
from services.dfagent import ask_dataframe
from services.extractor import process_incident_report, process_ptw_report

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


class ChatRequest(BaseModel):
    question: str
    chat_history: list[dict] = []


class ChatResponse(BaseModel):
    answer: str
    success: bool
    error: str = None


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


@router.get("/incident/{incident_id}")
async def get_incident_details(
    incident_id: str, current_user: User = Depends(get_current_user)
):
    """
    Get detailed information about a specific incident by ID
    """
    try:
        incident = get_incident_by_id(incident_id)
        if not incident:
            raise HTTPException(status_code=404, detail="Incident not found")
        
        logger.info(f"Retrieved incident details for ID: {incident_id}")
        return {"incident": incident}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching incident details for ID {incident_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve incident details")


@router.get("/similar-incidents")
async def get_similar_incidents_endpoint(current_user: User = Depends(get_current_user)):
    """
    Get similar incidents for PTW analysis using hardcoded incident IDs
    """
    try:
        similar_incidents = get_similar_incidents()
        logger.info(f"Retrieved {len(similar_incidents)} similar incidents")
        summary = """
        <h2>Why These 3 Incidents Are Important for PTW Decision</h2>

        <h3>Incident 1: Fire/Explosion During Welding (High Potential Near Miss)</h3>

        <p><strong>Why it's critical:</strong></p>
        <ul>
            <li>Same vessel (HELIX 1), same location (Main Deck), same task (welding)</li>
            <li>JSA was NOT completed properly - directly relevant to your JSA-055 requirement</li>
            <li>Shows what happens when safety barriers fail during welding operations</li>
            <li>Sparks ignited combustible materials - major fire risk for hot work</li>
        </ul>

        <p><strong>Decision impact:</strong> Requires enhanced fire watch, mandatory fire blankets, and strict JSA verification</p>

        <h3>Incident 2: Severe Burn Injury from Torch Malfunction (Lost Time Injury)</h3>

        <p><strong>Why it's critical:</strong></p>
        <ul>
            <li>Same equipment type (torch) that's listed in your PTW equipment requirements</li>
            <li>Major injury requiring helicopter evacuation - shows severity potential</li>
            <li>Equipment failure during cutting operation - equipment inspection concerns</li>
            <li>Same vessel and location as proposed work</li>
        </ul>

        <p><strong>Decision impact:</strong> Mandates pre-work equipment inspection and enhanced emergency response protocols</p>

        <h3>Incident 3: Grinding Wheel Explosion During Surface Prep (Medical Treatment Case)</h3>

        <p><strong>Why it's critical:</strong></p>
        <ul>
            <li>Same equipment (sander) listed in your PTW requirements</li>
            <li>Surface preparation is typically required before welding/cutting</li>
            <li>Projectile hazard from equipment failure - shows need for exclusion zones</li>
            <li>Same vessel and location as proposed work</li>
        </ul>

        <p><strong>Decision impact:</strong> Requires grinding wheel inspection protocol and enhanced PPE requirements</p>
        """
        return {"similar_incidents": similar_incidents, "summary": summary}
    except Exception as e:
        logger.error(f"Error fetching similar incidents: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve similar incidents")


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
        accident_data = process_incident_report(temp_file_path)
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


@router.post("/upload-ptw", response_model=PTWData)
async def upload_ptw_report(
    file: UploadFile = File(...), current_user: User = Depends(get_current_user)
):
    """
    Upload and process a PTW (Permit to Work) report PDF to extract structured data
    """
    logger.info(f"Received PTW file upload: {file.filename} from user {current_user.email}")

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        logger.error(f"Invalid file type: {file.filename}")
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    temp_file_path = None
    try:
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            content = await file.read()
            logger.info(f"PTW file size: {len(content)} bytes")
            temp_file.write(content)
            temp_file_path = temp_file.name

        logger.info(f"Temporary PTW file created: {temp_file_path}")

        # Process the PDF and extract PTW data
        ptw_data = process_ptw_report(temp_file_path)
        logger.info("Successfully processed PTW PDF and extracted data")
        return ptw_data

    except ValueError as e:
        # These are our custom errors from the processing functions
        logger.error(f"PTW processing error: {str(e)}")
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        # Unexpected errors
        logger.error(
            f"Unexpected error during PTW file processing: {str(e)}", exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred while processing the PTW file",
        )
    finally:
        # Clean up temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
                logger.info(f"Cleaned up temporary PTW file: {temp_file_path}")
            except Exception as e:
                logger.warning(
                    f"Failed to clean up temporary PTW file {temp_file_path}: {str(e)}"
                )


@router.post("/chat", response_model=ChatResponse)
async def chat_with_data(
    request: ChatRequest, current_user: User = Depends(get_current_user)
):
    """
    Ask a question about the incidents data using the dataframe agent with chat history context
    """
    try:
        # Get all incidents data
        incidents = get_all_incidents()
        
        if not incidents:
            return ChatResponse(
                answer="No incident data is currently available in the database.",
                success=True
            )
        
        # Convert to pandas DataFrame
        df = pd.DataFrame(incidents)
        
        # Build context from chat history
        history_context = ""
        if request.chat_history:
            history_context = "\n\nPrevious conversation context:\n"
            for i, msg in enumerate(request.chat_history[-6:]):  # Last 6 messages for context
                if msg.get('type') == 'user':
                    history_context += f"User: {msg.get('content', '')}\n"
                elif msg.get('type') == 'bot':
                    history_context += f"Assistant: {msg.get('content', '')}\n"
        
        # Combine current question with history context
        full_question = f"{request.question}{history_context}"
        
        # Use the dataframe agent to answer the question
        logger.info(f"Processing chat question with history: {request.question}")
        result = ask_dataframe(df, full_question)
        
        # Extract the answer from the agent result
        if isinstance(result, dict) and 'output' in result:
            answer = result['output']
        elif isinstance(result, str):
            answer = result
        else:
            answer = str(result)
        
        return ChatResponse(answer=answer, success=True)
        
    except Exception as e:
        logger.error(f"Error processing chat question: {str(e)}")
        return ChatResponse(
            answer="I'm sorry, I encountered an error while processing your question. Please try again.",
            success=False,
            error=str(e)
        )

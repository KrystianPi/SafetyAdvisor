import logging
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from .connection import get_supabase_client
from .models import AccidentData

logger = logging.getLogger(__name__)


def get_all_incidents() -> List[Dict[str, Any]]:
    """
    Retrieve all incidents from the incidents table.
    
    Returns:
        List[Dict[str, Any]]: List of all incidents as dictionaries with id included
        
    Raises:
        Exception: If there's an error fetching data from Supabase
    """
    try:
        supabase = get_supabase_client()
        
        # Query all incidents from the incidents table
        response = supabase.table("incidents").select("*").execute()
        
        if not response.data:
            logger.info("No incidents found in database")
            return []
        
        logger.info(f"Successfully retrieved {len(response.data)} incidents")
        return response.data
        
    except Exception as e:
        logger.error(f"Error fetching incidents: {str(e)}")
        raise Exception(f"Failed to retrieve incidents: {str(e)}")


def get_incident_by_id(incident_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve a single incident by ID from the incidents table.
    
    Args:
        incident_id: The ID of the incident to retrieve
    
    Returns:
        Optional[Dict[str, Any]]: The incident data if found, None otherwise
        
    Raises:
        Exception: If there's an error fetching data from Supabase
    """
    try:
        supabase = get_supabase_client()
        
        # Query specific incident by ID
        response = supabase.table("incidents").select("*").eq("id", incident_id).execute()
        
        if not response.data:
            logger.info(f"No incident found with ID: {incident_id}")
            return None
        
        logger.info(f"Successfully retrieved incident with ID: {incident_id}")
        return response.data[0]
        
    except Exception as e:
        logger.error(f"Error fetching incident by ID {incident_id}: {str(e)}")
        raise Exception(f"Failed to retrieve incident: {str(e)}")


def get_similar_incidents() -> List[Dict[str, Any]]:
    """
    Retrieve similar incidents from the incidents table using hardcoded IDs.
    
    Returns:
        List[Dict[str, Any]]: List of similar incidents with only required fields
        
    Raises:
        Exception: If there's an error fetching data from Supabase
    """
    try:
        supabase = get_supabase_client()
        
        # Hardcoded incident IDs for similarity matching (placeholder for future algorithm)
        hardcoded_incident_ids = [
            "45e87e95-e58f-4cb7-a2cb-acc4a073a5a1",
            "dacf145e-fed9-4c4f-b6bd-8d5486c6734f", 
            "466860e5-108c-4d1b-b2e3-0a4dec5a8344"
        ]
        
        # Query specific incidents by ID, selecting only required fields
        response = supabase.table("incidents").select(
            "id, date, time_of_day, vessel_name, incident_location_on_vessel, incident_description, tools_used, injury_status"
        ).in_("id", hardcoded_incident_ids).execute()
        
        if not response.data:
            logger.info("No similar incidents found in database")
            # Fallback: get first 3 incidents if hardcoded IDs don't exist
            fallback_response = supabase.table("incidents").select(
                "id, date, time_of_day, vessel_name, incident_location_on_vessel, incident_description, tools_used, injury_status"
            ).limit(3).execute()
            
            if fallback_response.data:
                logger.info(f"Using fallback: retrieved {len(fallback_response.data)} incidents")
                return fallback_response.data
            else:
                return []
        
        logger.info(f"Successfully retrieved {len(response.data)} similar incidents")
        return response.data
        
    except Exception as e:
        logger.error(f"Error fetching similar incidents: {str(e)}")
        raise Exception(f"Failed to retrieve similar incidents: {str(e)}")


def insert_incident(accident_data: AccidentData) -> Dict[str, Any]:
    """
    Insert a new incident into the incidents table.
    
    Args:
        accident_data: AccidentData object containing incident details
        
    Returns:
        Dict[str, Any]: The inserted incident record with generated ID
        
    Raises:
        Exception: If there's an error inserting data into Supabase
    """
    try:
        supabase = get_supabase_client()
        
        # Generate a unique ID for the incident
        incident_id = str(uuid.uuid4())
        
        # Convert AccidentData to dict and add ID
        incident_dict = accident_data.model_dump()
        incident_dict['id'] = incident_id
        
        # Convert datetime objects to strings for Supabase
        if incident_dict.get('ip_sign_on_datetime'):
            incident_dict['ip_sign_on_datetime'] = incident_dict['ip_sign_on_datetime'].isoformat()
        
        # Convert date to string if it's a datetime object
        if isinstance(incident_dict.get('date'), datetime):
            incident_dict['date'] = incident_dict['date'].isoformat()
        
        # Handle hours_until_return_to_work - convert to string as per table schema
        if incident_dict.get('hours_until_return_to_work') is not None:
            incident_dict['hours_until_return_to_work'] = str(incident_dict['hours_until_return_to_work'])
        
        # Insert the incident
        response = supabase.table("incidents").insert(incident_dict).execute()
        
        if not response.data:
            raise Exception("No data returned from insert operation")
        
        inserted_incident = response.data[0]
        logger.info(f"Successfully inserted incident with ID: {incident_id}")
        
        return inserted_incident
        
    except Exception as e:
        logger.error(f"Error inserting incident: {str(e)}")
        raise Exception(f"Failed to insert incident: {str(e)}") 
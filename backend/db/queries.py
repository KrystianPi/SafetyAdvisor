import logging
import uuid
from datetime import datetime
from typing import Any, Dict, List

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
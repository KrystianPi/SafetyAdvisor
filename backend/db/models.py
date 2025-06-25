from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


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
    """Pydantic model for a safety incident on a Helix vessel"""
    
    # Basic incident information - these are critical and should always be present
    date: datetime = Field(..., description="Date of the incident")
    time_of_day: str = Field(default="", description="Time including DAYLIGHT or NIGHT TIME")
    vessel_name: str = Field(default="", description="Name of the vessel")
    vessel_location: str = Field(default="", description="Location of the vessel")
    
    # Client information
    client: str = Field(default="", description="Client name")
    client_advised: bool = Field(default=False, description="Whether client was advised")
    project_no_well_name: str = Field(default="", description="Project number and well name")
    vessel_connected_to_well: bool = Field(default=False, description="Whether vessel was connected to well")
    
    # Incident classification
    related_to_work: bool = Field(default=False, description="Whether incident was related to work")
    classification: str = Field(default="", description="Incident classification")
    type_of_event: str = Field(default="", description="Type of event")
    
    # Investigation details
    human_factor_identified: bool = Field(default=False, description="Whether human factor was identified using HDB-SIEM-FM-46")
    investigated_with_hit: bool = Field(default=False, description="Whether event was investigated using HIT methodology")
    level_of_investigation: str = Field(default="", description="Level of investigation")
    
    # Marine conditions
    sea_state: str = Field(default="", description="Sea state conditions")
    swell_direction: str = Field(default="", description="Swell direction")
    swell_period_s: float = Field(default=0.0, description="Swell period in seconds")
    swell_height_m: float = Field(default=0.0, description="Swell height in meters")
    
    # Incident details
    incident_location_on_vessel: str = Field(default="", description="Location of incident on vessel")
    incident_description: str = Field(default="", description="Description of incident with key words")
    job_role: str = Field(default="", description="Job role of person involved")
    
    # Work type flags
    work_at_height: bool = Field(default=False, description="Whether it was work at height")
    work_in_confined_space: bool = Field(default=False, description="Whether it was work in confined space")
    lifting_operation_incident: bool = Field(default=False, description="Whether it was lifting operation incident")
    dropped_object: bool = Field(default=False, description="Whether it was dropped object")
    environmental_loss_of_containment: bool = Field(default=False, description="Whether it was environmental loss of containment")
    
    # Personnel information
    ip_sign_on_datetime: Optional[datetime] = Field(default=None, description="When the injured person signed on")
    first_shift_on_board: bool = Field(default=False, description="Whether this was first shift on board")
    hours_after_sign_on: float = Field(default=0.0, description="Hours after sign on date time")
    
    # Injury information
    injury_status: str = Field(default="", description="Injury status")
    injured_person_transported: str = Field(default="", description="Where injured person was transported")
    first_aid_provided: bool = Field(default=False, description="Whether first aid was provided")
    injured_person_medivac: bool = Field(default=False, description="Whether injured person was medivac'd")
    injured_person_returned_to_work: bool = Field(default=False, description="Whether injured person returned to work")
    hours_until_return_to_work: Optional[float] = Field(default=None, description="Hours until return to work")
    
    # Equipment and tools
    tools_used: str = Field(default="", description="Tools used during incident")
    equipment_involved_affected: str = Field(default="", description="Equipment involved or affected")
    equipment_isolated_inhibited: bool = Field(default=False, description="Whether equipment was isolated/inhibited")
    equipment_damaged: str = Field(default="", description="Equipment damage description")
    
    # Permit to Work information
    ptw_type: str = Field(default="", description="Permit to Work type (HOT WORK or COLD WORK)")
    ptw_number: str = Field(default="", description="Permit to Work number")
    trac_jsa_completed: bool = Field(default=False, description="Whether TRAC and JSA were completed")
    
    # Task and safety information
    task_being_performed: str = Field(default="", description="Task being performed during incident")
    ppe_worn: str = Field(default="", description="PPE worn including additional PPE")
    photos_cctv_available: bool = Field(default=False, description="Whether photos or CCTV are available")
    corrective_preventive_actions_assigned: str = Field(default="", description="Corrective/preventive actions assigned")


class PTWData(BaseModel):
    vessel_name: str = Field(default="", description="Name of the vessel")
    description_of_work: str = Field(default="", description="Description of work being performed")
    work_location: str = Field(default="", description="Location of work being performed")
    job_safety_analysis_number: str = Field(default="", description="Job Safety Analysis Number")
    equipment_required: str = Field(default="", description="Equipment required")
import base64
import json
import os
import logging

from dotenv import load_dotenv
from openai import OpenAI

from db.models import AccidentData

logger = logging.getLogger(__name__)


load_dotenv()

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)


prompt = """Extract the accident/incident data from the provided PDF images and return it in JSON format with the following fields. 

IMPORTANT: If any information is not available in the document, use the default values specified below:

Fields to extract:
        - date (YYYY-MM-DD format, REQUIRED - if not found, use a reasonable estimate)
        - time_of_day (string - include DAYLIGHT or NIGHT TIME, if not found use empty string "")
        - vessel_name (string, if not found use empty string "")
        - vessel_location (string, if not found use empty string "")
        - client (string, if not found use empty string "")
        - client_advised (boolean, if not found use false)
        - project_no_well_name (string, if not found use empty string "")
        - vessel_connected_to_well (boolean, if not found use false)
        - related_to_work (boolean, if not found use false)
        - classification (string, if not found use empty string "")
        - type_of_event (string, if not found use empty string "")
        - human_factor_identified (boolean, if not found use false)
        - investigated_with_hit (boolean, if not found use false)
        - level_of_investigation (string, if not found use empty string "")
        - sea_state (string, if not found use empty string "")
        - swell_direction (string, if not found use empty string "")
        - swell_period_s (number, if not found use 0.0)
        - swell_height_m (number, if not found use 0.0)
        - incident_location_on_vessel (string, if not found use empty string "")
        - incident_description (string, if not found use empty string "")
        - job_role (string, if not found use empty string "")
        - work_at_height (boolean, if not found use false)
        - work_in_confined_space (boolean, if not found use false)
        - lifting_operation_incident (boolean, if not found use false)
        - dropped_object (boolean, if not found use false)
        - environmental_loss_of_containment (boolean, if not found use false)
        - ip_sign_on_datetime (YYYY-MM-DD HH:MM:SS format, if not found use null)
        - first_shift_on_board (boolean, if not found use false)
        - hours_after_sign_on (number, if not found use 0.0)
        - injury_status (string, if not found use empty string "")
        - injured_person_transported (string, if not found use empty string "")
        - first_aid_provided (boolean, if not found use false)
        - injured_person_medivac (boolean, if not found use false)
        - injured_person_returned_to_work (boolean, if not found use false)
        - hours_until_return_to_work (number or null, if not found use null)
        - tools_used (string, if not found use empty string "")
        - equipment_involved_affected (string, if not found use empty string "")
        - equipment_isolated_inhibited (boolean, if not found use false)
        - equipment_damaged (string, if not found use empty string "")
        - ptw_type (string - should be "HOT WORK" or "COLD WORK", if not found use empty string "")
        - ptw_number (string, if not found use empty string "")
        - trac_jsa_completed (boolean, if not found use false)
        - task_being_performed (string, if not found use empty string "")
        - ppe_worn (string, if not found use empty string "")
        - photos_cctv_available (boolean, if not found use false)
        - corrective_preventive_actions_assigned (string, if not found use empty string "")

CRITICAL RULES:
1. NEVER return null for string fields - always use empty string "" instead
2. NEVER return null for boolean fields - always use false instead  
3. NEVER return null for number fields - always use 0.0 instead
4. Only use null for ip_sign_on_datetime and hours_until_return_to_work if the data is truly not available
5. Return valid JSON format only
6. Do your best to extract available information, but don't guess - use defaults when unsure
7. For boolean fields, look for clear indicators like "Yes/No", "True/False", checkboxes, etc.
8. Return the data only in english language.
"""


def extract_accident_data(images_folder_path: str) -> AccidentData:
    # Load and encode images
    image_files = [
        f
        for f in os.listdir(images_folder_path)
        if f.lower().endswith((".png", ".jpg", ".jpeg"))
    ]
    base64_images = []

    for image_file in image_files:
        with open(os.path.join(images_folder_path, image_file), "rb") as f:
            base64_images.append(base64.b64encode(f.read()).decode("utf-8"))

    # Build content with all images
    content = [{"type": "text", "text": prompt}]
    for img in base64_images:
        content.append(
            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{img}"}}
        )

    # Try up to 3 times to get valid data
    for attempt in range(3):
        try:
            # Make API call
            completion = client.chat.completions.create(
                extra_headers={
                    "HTTP-Referer": "https://safety-advisor.vercel.app",
                    "X-Title": "Global Safety Agent",
                },
                model="google/gemini-2.5-pro",
                messages=[{"role": "user", "content": content}],
            )

            # Parse JSON response
            response_text = completion.choices[0].message.content.replace("```json", "").replace("```", "")
            data = json.loads(response_text)
            logger.info(f"LLM response: {data}")
            
            # Validate against Pydantic model
            accident_data = AccidentData(**data)
            return accident_data
            
        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"Error parsing LLM response: {e}")
            if attempt == 2:  # Last attempt
                raise ValueError(f"Failed to get valid accident data after 3 attempts. Last error: {e}")
            continue
    
    raise ValueError("Failed to get valid accident data after 3 attempts")

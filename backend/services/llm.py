import base64
import json
import os
import logging
from typing import Type, TypeVar

from dotenv import load_dotenv
from openai import OpenAI

from db.models import AccidentData, PTWData

logger = logging.getLogger(__name__)

T = TypeVar('T', AccidentData, PTWData)

load_dotenv()

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

def generate_response(prompt: str) -> str:
    completion = client.chat.completions.create(
        extra_headers={
                    "HTTP-Referer": "https://safety-advisor.vercel.app",
                    "X-Title": "Global Safety Agent",
                },
        model="google/gemini-2.5-pro",
        messages=[{"role": "user", "content": prompt}],
    )
    return completion.choices[0].message.content

def _extract_data(images_folder_path: str, prompt: str, model_class: Type[T], data_type: str) -> T:
    """Common extraction logic for both incident and PTW data."""
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
            completion = generate_response(content)

            # Parse JSON response
            response_text = completion.replace("```json", "").replace("```", "")
            data = json.loads(response_text)
            logger.info(f"LLM response: {data}")
            
            # Validate against Pydantic model
            validated_data = model_class(**data)
            return validated_data
            
        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"Error parsing LLM response: {e}")
            if attempt == 2:  # Last attempt
                raise ValueError(f"Failed to get valid {data_type} data after 3 attempts. Last error: {e}")
            continue
    
    raise ValueError(f"Failed to get valid {data_type} data after 3 attempts")

def extract_incident_data(images_folder_path: str, prompt: str) -> AccidentData:
    """Extract incident data from images using LLM."""
    return _extract_data(images_folder_path, prompt, AccidentData, "accident")

def extract_ptw_data(images_folder_path: str, prompt: str) -> PTWData:
    """Extract PTW data from images using LLM."""
    return _extract_data(images_folder_path, prompt, PTWData, "PTW")
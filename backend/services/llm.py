import base64
import json
import os

from dotenv import load_dotenv
from openai import OpenAI

from db.models import AccidentData


load_dotenv()

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)


prompt = """Return the description of the accident using json format with following fields: 
        - date (YYYY-MM-DD)
        - time (HH:MM)
        - location (string)
        - description (string)
        - injuries (string)
        - fatalities (int)
        - immidate_cause (string)
        - root_cause (string)
        - contributing_human_factors (string)
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
                    "X-Title": "SafetyAdvisor",
                },
                model="google/gemini-2.5-pro",
                messages=[{"role": "user", "content": content}],
            )

            # Parse JSON response
            response_text = completion.choices[0].message.content.replace("```json", "").replace("```", "")
            data = json.loads(response_text)
            
            # Validate against Pydantic model
            accident_data = AccidentData(**data)
            return accident_data
            
        except (json.JSONDecodeError, ValueError) as e:
            if attempt == 2:  # Last attempt
                raise ValueError(f"Failed to get valid accident data after 3 attempts. Last error: {e}")
            continue
    
    raise ValueError("Failed to get valid accident data after 3 attempts")

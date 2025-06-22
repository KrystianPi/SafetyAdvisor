import PyPDF2
import tempfile
import os
from pdf2image import convert_from_path
from services.llm import extract_accident_data
from db.models import AccidentData


def process_pdf_file(file_path: str) -> AccidentData:
    """Process PDF file and extract accident data using LLM."""
    with open(file_path, "rb") as file:
        pdf_reader = PyPDF2.PdfReader(file)

        # Check if PDF has extractable text
        has_text = False
        all_text = ""
        for page in pdf_reader.pages:
            text = page.extract_text()
            if text and len(text.strip()) > 0:
                has_text = True
                all_text += text + "\n"

        if has_text:
            # If text is available, we could potentially use it directly
            # For now, we'll convert to images for consistent processing
            pass
        
        # Convert PDF to images for LLM processing
        with tempfile.TemporaryDirectory() as temp_dir:
            images = convert_from_path(file_path)
            
            # Save images to temporary directory
            for i, image in enumerate(images):
                image_path = os.path.join(temp_dir, f"page_{i + 1}.jpg")
                image.save(image_path, "JPEG")
            
            # Extract accident data using LLM
            accident_data = extract_accident_data(temp_dir)
            return accident_data

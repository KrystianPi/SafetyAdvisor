import PyPDF2
import tempfile
import os
import logging
from pdf2image import convert_from_path
from services.llm import extract_incident_data, extract_ptw_data
from db.models import AccidentData, PTWData

logger = logging.getLogger(__name__)

INCIDENT_PROMPT_PATH = "prompts/incident_prompt.txt"
PTW_PROMPT_PATH = "prompts/ptw_prompt.txt"

def _process_pdf_to_images(file_path: str, prompt_path: str, extract_func, data_type: str):
    """Common PDF processing logic for both incident and PTW reports."""
    try:
        logger.info(f"Starting PDF processing for file: {file_path}")
        
        with open(prompt_path, "rb") as file:
            prompt = file.read().decode("utf-8")

        with open(file_path, "rb") as file:
            pdf_reader = PyPDF2.PdfReader(file)
            logger.info(f"PDF has {len(pdf_reader.pages)} pages")

            # Check if PDF has extractable text
            has_text = False
            all_text = ""
            for page in pdf_reader.pages:
                text = page.extract_text()
                if text and len(text.strip()) > 0:
                    has_text = True
                    all_text += text + "\n"
                    
            logger.info(f"PDF has extractable text: {has_text}")
            
            if has_text:
                pass
            
            # Convert PDF to images for LLM processing
            logger.info("Converting PDF to images...")
            with tempfile.TemporaryDirectory() as temp_dir:
                try:
                    images = convert_from_path(file_path)
                    logger.info(f"Converted PDF to {len(images)} images")
                    
                    # Save images to temporary directory
                    for i, image in enumerate(images):
                        image_path = os.path.join(temp_dir, f"page_{i + 1}.jpg")
                        image.save(image_path, "JPEG")
                        logger.info(f"Saved image: {image_path}")
                    
                    # Extract data using LLM
                    logger.info(f"Extracting {data_type} data using LLM...")
                    extracted_data = extract_func(temp_dir, prompt)
                    logger.info(f"Successfully extracted {data_type} data")
                    return extracted_data
                    
                except Exception as e:
                    logger.error(f"Error during PDF to image conversion: {str(e)}")
                    raise ValueError(f"Failed to convert PDF to images: {str(e)}")
    except Exception as e:
        logger.error(f"Error processing PDF file: {str(e)}")
        raise ValueError(f"Failed to process PDF file: {str(e)}")

def process_ptw_report(file_path: str) -> PTWData:
    """Process PDF file and extract PTW data using LLM."""
    return _process_pdf_to_images(file_path, PTW_PROMPT_PATH, extract_ptw_data, "PTW")

def process_incident_report(file_path: str) -> AccidentData:
    """Process PDF file and extract accident data using LLM."""
    return _process_pdf_to_images(file_path, INCIDENT_PROMPT_PATH, extract_incident_data, "accident")

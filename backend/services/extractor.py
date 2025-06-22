import PyPDF2
import tempfile
import os
import logging
from pdf2image import convert_from_path
from services.llm import extract_accident_data
from db.models import AccidentData

logger = logging.getLogger(__name__)


def process_pdf_file(file_path: str) -> AccidentData:
    """Process PDF file and extract accident data using LLM."""
    try:
        logger.info(f"Starting PDF processing for file: {file_path}")
        
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
                # If text is available, we could potentially use it directly
                # For now, we'll convert to images for consistent processing
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
                    
                    # Extract accident data using LLM
                    logger.info("Extracting accident data using LLM...")
                    accident_data = extract_accident_data(temp_dir)
                    logger.info("Successfully extracted accident data")
                    return accident_data
                    
                except Exception as e:
                    logger.error(f"Error during PDF to image conversion: {str(e)}")
                    raise ValueError(f"Failed to convert PDF to images: {str(e)}")
                    
    except Exception as e:
        logger.error(f"Error processing PDF file: {str(e)}")
        raise ValueError(f"Failed to process PDF file: {str(e)}")

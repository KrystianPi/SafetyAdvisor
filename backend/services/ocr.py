import base64
import os
from mistralai import Mistral
from dotenv import load_dotenv

load_dotenv()

def ocr(pdf_path: str):
    """Process PDF through OCR and return the response."""
    try:
        # Encode the pdf to base64
        with open(pdf_path, "rb") as pdf_file:
            base64_pdf = base64.b64encode(pdf_file.read()).decode('utf-8')
        
        # Initialize Mistral client
        api_key = os.environ["MISTRAL_API_KEY"]
        client = Mistral(api_key=api_key)
        
        # Process OCR
        ocr_response = client.ocr.process(
            model="mistral-ocr-latest",
            document={
                "type": "document_url",
                "document_url": f"data:application/pdf;base64,{base64_pdf}" 
            },
            include_image_base64=True
        )
        
        text = [page['markdown'] for page in ocr_response['pages']]

        return text
        
    except FileNotFoundError:
        print(f"Error: The file {pdf_path} was not found.")
        return None
    except Exception as e:
        print(f"Error: {e}")
        return None
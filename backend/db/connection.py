import os
from supabase import Client, create_client
from dotenv import load_dotenv
import logging

logger = logging.getLogger(__name__)

load_dotenv()

# Supabase configuration
supabase_url = os.getenv("SUPABASE_URL")
supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Check for required environment variables
if not supabase_url:
    raise ValueError("SUPABASE_URL environment variable is required")
if not supabase_service_key:
    raise ValueError("SUPABASE_SERVICE_ROLE_KEY environment variable is required")

logger.info(f"Supabase URL: {supabase_url}")
logger.info(f"Service key starts with: {supabase_service_key[:10]}..." if supabase_service_key else "No service key")

# Create Supabase client
supabase: Client = create_client(supabase_url, supabase_service_key)

def get_supabase_client() -> Client:
    """Get Supabase client instance"""
    return supabase 
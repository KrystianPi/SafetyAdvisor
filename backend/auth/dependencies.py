from datetime import datetime
import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from db.connection import get_supabase_client
from db.models import User

logger = logging.getLogger(__name__)

# Security
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> User:
    """
    Verify JWT token from Supabase and return user info
    """
    try:
        token = credentials.credentials
        supabase = get_supabase_client()

        # Use Supabase's built-in user verification
        # This automatically handles JWT verification with the correct secret and audience
        response = supabase.auth.get_user(token)
        
        if not response or not response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Invalid authentication token"
            )

        user = response.user
        
        # Handle different possible datetime formats
        created_at = user.created_at
        if isinstance(created_at, str):
            # Parse string datetime
            if created_at.endswith('Z'):
                created_at = created_at.replace('Z', '+00:00')
            created_at = datetime.fromisoformat(created_at)
        elif hasattr(created_at, 'isoformat'):
            # It's already a datetime object
            pass
        else:
            # Fallback to current time if we can't parse
            created_at = datetime.now()
            
        return User(
            id=user.id,
            email=user.email or "",
            created_at=created_at,
        )

    except Exception as e:
        # Log the specific error for debugging
        logger.error(f"Authentication error: {str(e)}")
        logger.error(f"Error type: {type(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        ) 
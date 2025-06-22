from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import dashboard
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('app.log')
    ]
)

logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="SafetyAdvisor API",
    description="Safety management and compliance tracking API",
    version="1.0.0",
)

# CORS configuration for Vercel frontend
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://safety-advisor.*\.vercel\.app",  # Regex for your specific Vercel project
    allow_origins=[
        "http://localhost:3000",  # Local development
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers
app.include_router(dashboard.router)

logger.info("SafetyAdvisor API started successfully")

# Basic health check routes
@app.get("/")
async def root():
    logger.info("Root endpoint accessed")
    return {"message": "SafetyAdvisor API is running! 🛡️"}


@app.get("/health")
async def health_check():
    logger.info("Health check endpoint accessed")
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    logger.info("Starting uvicorn server")
    uvicorn.run(app, host="0.0.0.0", port=8000)

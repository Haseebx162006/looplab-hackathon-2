import litellm
litellm.drop_params = True
litellm.num_retries = 3

import logging
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.agent_routes import router as agent_router
from app.config.settings import settings

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("app")

app = FastAPI(
    title="AI Agent Service",
    description="Stateless AI Career Planning Agent Service using FastAPI, CrewAI, and Groq.",
    version="1.0.0"
)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(agent_router)

@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "online",
        "service": "AI Agent Service",
        "endpoints": {
            "health": "GET /health",
            "analyze_skills": "POST /agent/analyze-skills",
            "generate_roadmap": "POST /agent/generate-roadmap"
        }
    }

@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.NODE_ENV == "development"
    )

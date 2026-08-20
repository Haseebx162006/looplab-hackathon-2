import json
import logging
from fastapi import APIRouter, HTTPException, status
from app.schemas.request_models import AnalyzeSkillsRequest, GenerateRoadmapRequest
from app.schemas.response_models import SkillProfileResponse, RoadmapResponse
from app.agents.career_planning_agent import run_skill_analysis_crew, run_roadmap_crew

router = APIRouter(prefix="/agent", tags=["Agent"])
logger = logging.getLogger("app")

def parse_and_clean_json(raw_text: str) -> dict:
    """
    Cleans up LLM markdown blocks (e.g. ```json ... ```) and parses the JSON content.
    """
    clean_text = raw_text.strip()
    
    # Remove markdown code blocks if present
    if clean_text.startswith("```"):
        lines = clean_text.splitlines()
        if lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        clean_text = "\n".join(lines).strip()
        
    try:
        return json.loads(clean_text)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON. Raw text: {raw_text}. Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agent returned invalid JSON formatting: {str(e)}"
        )

@router.post("/analyze-skills", response_model=SkillProfileResponse, status_code=status.HTTP_200_OK)
async def analyze_skills(payload: AnalyzeSkillsRequest):
    try:
        # Convert Pydantic request models to string/json representation for CrewAI tasks
        profile_str = payload.student_profile.model_dump_json()
        assessments_str = json.dumps([item.model_dump() for item in payload.assessment_results])
        
        # Kick off crew
        raw_output = run_skill_analysis_crew(profile_str, assessments_str)
        
        # Parse and return
        parsed_json = parse_and_clean_json(raw_output)
        return SkillProfileResponse(**parsed_json)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error during skill analysis execution")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during skill analysis: {str(e)}"
        )

@router.post("/generate-roadmap", response_model=RoadmapResponse, status_code=status.HTTP_200_OK)
async def generate_roadmap(payload: GenerateRoadmapRequest):
    try:
        # Convert models to JSON strings for tools/tasks
        profile_str = payload.student_profile.model_dump_json()
        assessments_str = json.dumps([item.model_dump() for item in payload.assessment_results])
        
        # Kick off crew
        raw_output = run_roadmap_crew(profile_str, assessments_str, payload.career_goal)
        
        # Parse and return
        parsed_json = parse_and_clean_json(raw_output)
        return RoadmapResponse(**parsed_json)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error during roadmap generation execution")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during roadmap generation: {str(e)}"
        )

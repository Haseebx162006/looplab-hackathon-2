import json
import logging
import litellm
from fastapi import APIRouter, HTTPException, status
from app.schemas.request_models import AnalyzeSkillsRequest, GenerateRoadmapRequest, GenerateTestRequest
from app.schemas.response_models import SkillProfileResponse, RoadmapResponse, TestQuestionsResponse
from app.agents.career_planning_agent import run_skill_analysis_crew, run_roadmap_crew
from app.config.settings import settings

router = APIRouter(prefix="/agent", tags=["Agent"])
logger = logging.getLogger("app")

def run_test_generation(module: str, difficulty: str) -> str:
    prompt = f"""
    Generate a set of 5 multiple-choice questions for the domain '{module}' with a difficulty level of '{difficulty}'.
    
    Each question must contain:
    - question: The question text
    - options: A list of 4 possible answers (strings)
    - correct_answer: The exact correct answer string matching one of the options.
    
    Return ONLY a JSON object matching this structure:
    {{
      "questions": [
        {{
          "question": "question text",
          "options": ["option 1", "option 2", "option 3", "option 4"],
          "correct_answer": "correct option text"
        }}
      ]
    }}
    Do not add any explanations or markdown formatting outside of the JSON object.
    """
    
    response = litellm.completion(
        model="groq/groq/compound-mini",
        messages=[{"role": "user", "content": prompt}],
        api_key=settings.GROQ_API_KEY,
        response_format={"type": "json_object"}
    )
    return response.choices[0].message.content or "{}"


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

@router.post("/generate-test", response_model=TestQuestionsResponse, status_code=status.HTTP_200_OK)
async def generate_test(payload: GenerateTestRequest):
    try:
        raw_output = run_test_generation(payload.module, payload.difficulty)
        parsed_json = parse_and_clean_json(raw_output)
        return TestQuestionsResponse(**parsed_json)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error during test generation execution")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during test generation: {str(e)}"
        )

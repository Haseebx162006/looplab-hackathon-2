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
    
    models = settings.groq_models_list
    primary_model = models[0] if models else "groq/openai/gpt-oss-120b"
    fallback_models = models[1:] if len(models) > 1 else []
    
    response = litellm.completion(
        model=primary_model,
        messages=[{"role": "user", "content": prompt}],
        api_key=settings.GROQ_API_KEY,
        response_format={"type": "json_object"},
        fallbacks=fallback_models
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
        import json_repair
        return json_repair.loads(clean_text)
    except Exception:
        try:
            return json.loads(clean_text)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON. Raw text: {raw_text}. Error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Agent returned invalid JSON formatting: {str(e)}"
            )

def normalize_skill_levels(skill_levels: dict) -> dict:
    if not isinstance(skill_levels, dict):
        return {}
    normalized = {}
    mapping = {
        1: "Beginner",
        2: "Intermediate",
        3: "Advanced",
        "1": "Beginner",
        "2": "Intermediate",
        "3": "Advanced"
    }
    for skill, val in skill_levels.items():
        if val in mapping:
            normalized[skill] = mapping[val]
        else:
            normalized[skill] = str(val)
    return normalized

@router.post("/analyze-skills", response_model=SkillProfileResponse, status_code=status.HTTP_200_OK)
def analyze_skills(payload: AnalyzeSkillsRequest):
    try:
        profile_str = payload.student_profile.model_dump_json()
        assessments_str = json.dumps([item.model_dump() for item in payload.assessment_results])
        
        raw_output = run_skill_analysis_crew(profile_str, assessments_str, payload.test_score)
        
        parsed_json = parse_and_clean_json(raw_output)
        if "skill_levels" in parsed_json:
            parsed_json["skill_levels"] = normalize_skill_levels(parsed_json["skill_levels"])
            
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
def generate_roadmap(payload: GenerateRoadmapRequest):
    try:
        profile_str = payload.student_profile.model_dump_json()
        assessments_str = json.dumps([item.model_dump() for item in payload.assessment_results])
        
        raw_output = run_roadmap_crew(profile_str, assessments_str, payload.career_goal, payload.test_score)
        
        parsed_json = parse_and_clean_json(raw_output)
        if "skill_profile" in parsed_json and "skill_levels" in parsed_json["skill_profile"]:
            parsed_json["skill_profile"]["skill_levels"] = normalize_skill_levels(parsed_json["skill_profile"]["skill_levels"])
            
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


def extract_text_from_cv(cv_url: str) -> str:
    """Downloads CV from URL and extracts plain text using pdfplumber for PDFs."""
    import requests as req
    import io

    try:
        resp = req.get(cv_url, timeout=20)
        resp.raise_for_status()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not download CV: {str(e)}")

    content_type = resp.headers.get("content-type", "").lower()
    raw_bytes = resp.content

    # Try PDF extraction
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(raw_bytes)) as pdf:
            pages_text = [page.extract_text() or "" for page in pdf.pages]
        text = "\n".join(pages_text).strip()
        if text:
            return text
    except Exception:
        pass

    # Fallback: treat as raw text (for .txt or plain uploads)
    try:
        return raw_bytes.decode("utf-8", errors="ignore").strip()
    except Exception:
        raise HTTPException(status_code=422, detail="Could not extract readable text from the uploaded CV file.")


@router.post("/analyze-cv", status_code=status.HTTP_200_OK)
def analyze_cv(payload: dict):
    cv_url = payload.get("cv_url", "")
    if not cv_url:
        raise HTTPException(status_code=400, detail="cv_url is required.")

    # 1. Extract text
    cv_text = extract_text_from_cv(cv_url)
    if not cv_text or len(cv_text) < 50:
        raise HTTPException(status_code=422, detail="CV text is too short to analyze. Please ensure the file contains readable content.")

    # Truncate to stay within token limits (~2000 chars ≈ 500 tokens)
    cv_snippet = cv_text[:3000]

    prompt = f"""You are an expert career coach and CV reviewer. Analyze the following CV text and return a structured JSON report.

CV TEXT:
{cv_snippet}

Return ONLY a JSON object with this exact structure (no extra text, no markdown):
{{
  "candidate_name": "extracted name or Unknown",
  "overall_score": 75,
  "summary": "2-3 sentence professional summary of the candidate",
  "skills_found": ["skill1", "skill2", "skill3"],
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"],
  "experience_level": "Junior | Mid-level | Senior",
  "suitable_roles": ["role 1", "role 2", "role 3"]
}}
overall_score must be an integer between 0-100 based on CV quality."""

    models = settings.groq_models_list
    primary_model = models[0] if models else "groq/openai/gpt-oss-120b"
    fallback_models = models[1:] if len(models) > 1 else []

    try:
        response = litellm.completion(
            model=primary_model,
            messages=[{"role": "user", "content": prompt}],
            api_key=settings.GROQ_API_KEY,
            response_format={"type": "json_object"},
            fallbacks=fallback_models,
            max_tokens=800,
        )
        raw_output = response.choices[0].message.content or "{}"
        report = parse_and_clean_json(raw_output)
        return {"report": report}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error during CV analysis")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"CV analysis failed: {str(e)}"
        )

import json
import logging
try:
    from crewai.tools import tool
except ImportError:
    def tool(*args, **kwargs):
        def decorator(func):
            return func
        return decorator
from app.config.settings import settings

logger = logging.getLogger("app")

@tool("Analyze Student Skills")
def analyze_student_skills(student_profile: str, assessment_results: str) -> str:
    """
    Analyzes the student's profile and assessment results to determine current skill levels.
    student_profile: JSON string of student profile
    assessment_results: JSON string of assessment results
    Returns a JSON string containing a dict of skill names mapped to level (Beginner/Intermediate/Advanced).
    """
    # Trim inputs to reduce prompt size (Issue 3)
    try:
        profile = json.loads(student_profile)
        trimmed_profile = {
            "experience_level": profile.get("experience_level", "Beginner"),
            "background": str(profile.get("background", ""))[:200],  # Truncate long backgrounds
            "interests": profile.get("interests", [])[:10]           # Limit to 10 interests
        }
    except Exception:
        trimmed_profile = student_profile

    try:
        results = json.loads(assessment_results)
        trimmed_results = []
        for r in results:
            trimmed_results.append({
                "question": str(r.get("question", ""))[:150],  # Truncate question text
                "answer": str(r.get("answer", ""))[:200]       # Truncate long student answers
            })
    except Exception:
        trimmed_results = assessment_results

    prompt = f"""
    Analyze the following student profile and assessment answers.
    Determine the student's current skill levels for their technical skills.
    
    Student Profile:
    {json.dumps(trimmed_profile)}
    
    Assessment Results:
    {json.dumps(trimmed_results)}
    
    Return ONLY a JSON object mapping each identified skill name to its level ('Beginner', 'Intermediate', or 'Advanced').
    Do not add any explanations or markdown formatting outside of the JSON object.
    Example:
    {{
      "Python": "Intermediate",
      "SQL": "Beginner"
    }}
    """
    
    # Token estimation check (Issue 3)
    # Roughly ~4 characters per token
    estimated_tokens = len(prompt) // 4
    if estimated_tokens > 5000:
        logger.warning(
            f"Estimated request size ({estimated_tokens} tokens) is close to the Groq TPM limit (8,000 / 12,000)."
        )
        
    try:
        from app.config.llm import call_llm_with_fallback
        return call_llm_with_fallback(prompt, response_format={"type": "json_object"})
    except Exception as e:
        return json.dumps({"error": f"Failed to analyze skills: {str(e)}"})

import json
try:
    from crewai.tools import tool
except ImportError:
    def tool(*args, **kwargs):
        def decorator(func):
            return func
        return decorator
import litellm
from app.config.settings import settings

@tool("Analyze Student Skills")
def analyze_student_skills(student_profile: str, assessment_results: str) -> str:
    """
    Analyzes the student's profile and assessment results to determine current skill levels.
    student_profile: JSON string of student profile
    assessment_results: JSON string of assessment results
    Returns a JSON string containing a dict of skill names mapped to level (Beginner/Intermediate/Advanced).
    """
    prompt = f"""
    Analyze the following student profile and assessment answers.
    Determine the student's current skill levels for their technical skills.
    
    Student Profile:
    {student_profile}
    
    Assessment Results:
    {assessment_results}
    
    Return ONLY a JSON object mapping each identified skill name to its level ('Beginner', 'Intermediate', or 'Advanced').
    Do not add any explanations or markdown formatting outside of the JSON object.
    Example:
    {{
      "Python": "Intermediate",
      "SQL": "Beginner"
    }}
    """
    try:
        response = litellm.completion(
            model="groq/groq/compound-mini",
            messages=[{"role": "user", "content": prompt}],
            api_key=settings.GROQ_API_KEY,
            response_format={"type": "json_object"}
        )
        return response.choices[0].message.content or "{}"
    except Exception as e:
        return json.dumps({"error": f"Failed to analyze skills: {str(e)}"})

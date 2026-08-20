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

@tool("Generate Skill Gap")
def generate_skill_gap(skill_levels: str, career_goal: str) -> str:
    """
    Compares current skill levels against what's needed for the student's career goal.
    skill_levels: JSON string mapping skill names to their levels
    career_goal: The target career role (e.g., 'Fullstack Web Developer')
    Returns a JSON string containing strengths, weaknesses, and missing skills.
    """
    prompt = f"""
    Compare the student's current skill levels against what is required to achieve their career goal.
    
    Current Skill Levels:
    {skill_levels}
    
    Career Goal:
    {career_goal}
    
    Identify:
    1. Strengths: Skills they already have at an Intermediate or Advanced level that are relevant.
    2. Weaknesses: Skills they have at a Beginner level that need improvement for this goal.
    3. Missing Skills: Critical skills for the career goal that were not mentioned in their profile/skills list.
    
    Return ONLY a JSON object with this format:
    {{
      "strengths": ["Skill A", "Skill B"],
      "weaknesses": ["Skill C"],
      "missing_skills": ["Skill D", "Skill E"]
    }}
    Do not add any explanations or markdown formatting outside of the JSON object.
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
        return json.dumps({"error": f"Failed to generate skill gap: {str(e)}"})

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

@tool("Create Roadmap")
def create_roadmap(skill_gap: str, career_goal: str) -> str:
    """
    Generates a personalized learning roadmap based on the skill gap and career goal.
    skill_gap: JSON string containing strengths, weaknesses, and missing skills.
    career_goal: The target career role.
    Returns a JSON string containing the modules of the learning roadmap.
    """
    prompt = f"""
    Create a detailed, personalized learning roadmap to help the student achieve their career goal based on their identified skill gaps (weaknesses and missing skills).
    
    Career Goal:
    {career_goal}
    
    Skill Gap Analysis:
    {skill_gap}
    
    Structure the roadmap as a series of modules. Each module must have:
    - module_number: integer (starting from 1)
    - title: name of the module
    - description: what it covers
    - skills_covered: list of skills taught
    - tasks: list of specific learning activities or mini-tasks
    - project: a mini-project for hands-on practice (must have 'name' and 'description')
    
    Return ONLY a JSON object with a single key "modules" containing a list of modules.
    Do not add any explanations or markdown formatting outside of the JSON object.
    Example format:
    {{
      "modules": [
        {{
          "module_number": 1,
          "title": "...",
          "description": "...",
          "skills_covered": ["..."],
          "tasks": ["..."],
          "project": {{
            "name": "...",
            "description": "..."
          }}
        }}
      ]
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
        return json.dumps({"error": f"Failed to create roadmap: {str(e)}"})

import json
import logging
from app.config.llm import call_llm_with_fallback

logger = logging.getLogger("app")


def trim_payloads(student_profile_str: str, assessment_results_str: str) -> tuple:
    """
    Trims student profile and assessment results to minimize token usage.
    """
    try:
        profile = json.loads(student_profile_str)
        trimmed_profile = {
            "level": profile.get("experience_level", "Beginner"),
            "bg": str(profile.get("background", ""))[:100],
            "interests": profile.get("interests", [])[:5]
        }
    except Exception:
        trimmed_profile = student_profile_str[:200]

    try:
        results = json.loads(assessment_results_str)
        trimmed_results = []
        for r in results[:10]:  # Max 10 questions
            trimmed_results.append({
                "q": str(r.get("question", ""))[:80],
                "a": str(r.get("answer", ""))[:80]
            })
    except Exception:
        trimmed_results = assessment_results_str[:300]

    return json.dumps(trimmed_profile), json.dumps(trimmed_results)


def run_skill_analysis_crew(student_profile_str: str, assessment_results_str: str) -> str:
    """
    Analyzes student skills by calling the LLM directly (no CrewAI overhead).
    Returns a JSON string with: skill_levels, strengths, weaknesses, missing_skills.
    """
    profile_trimmed, results_trimmed = trim_payloads(student_profile_str, assessment_results_str)

    prompt = f"""Analyze the student profile and assessment answers below.
Return a JSON object with exactly these keys:
- "skill_levels": dict mapping each skill to "Beginner", "Intermediate", or "Advanced"
- "strengths": list of strong skills
- "weaknesses": list of weak areas
- "missing_skills": list of skills needed but not demonstrated

Student: {profile_trimmed}
Answers: {results_trimmed}

Return ONLY the JSON object, no markdown or explanation."""

    return call_llm_with_fallback(prompt, response_format={"type": "json_object"})


def run_roadmap_crew(student_profile_str: str, assessment_results_str: str, career_goal: str) -> str:
    """
    Generates a learning roadmap by calling the LLM directly (no CrewAI overhead).
    Returns a JSON string with: skill_profile, career_goal, modules.
    """
    profile_trimmed, results_trimmed = trim_payloads(student_profile_str, assessment_results_str)

    prompt = f"""Create a learning roadmap for a student targeting: {career_goal}

Student: {profile_trimmed}
Answers: {results_trimmed}

Return a JSON object with:
- "skill_profile": {{"skill_levels": {{}}, "strengths": [], "weaknesses": [], "missing_skills": []}}
- "career_goal": "{career_goal}"
- "modules": list of modules, each with: module_number (int), title, description, skills_covered (list), tasks (list), project ({{"name": "...", "description": "..."}})

Return ONLY the JSON object, no markdown or explanation."""

    return call_llm_with_fallback(prompt, response_format={"type": "json_object"})

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


def run_skill_analysis_crew(student_profile_str: str, assessment_results_str: str, test_score: float = None) -> str:
    """
    Analyzes student skills by calling the LLM directly (no CrewAI overhead).
    Returns a JSON string with: skill_levels, strengths, weaknesses, missing_skills.
    """
    profile_trimmed, results_trimmed = trim_payloads(student_profile_str, assessment_results_str)

    score_context = f"\nOverall Test Score: {test_score}%" if test_score is not None else ""

    prompt = f"""Analyze the student profile background, overall test score, and detailed assessment answers (which include whether they got it correct or incorrect) below.
Return a JSON object with exactly these keys:
- "skill_levels": dict mapping each skill to "Beginner", "Intermediate", or "Advanced"
- "strengths": list of strong skills
- "weaknesses": list of weak areas
- "missing_skills": list of skills needed but not demonstrated

Student: {profile_trimmed}{score_context}
Detailed Answers: {results_trimmed}

Please be very accurate. Analyze exactly which questions they failed (is_correct=False) and mark the corresponding skills as Weaknesses or Beginner.
Return ONLY the JSON object, no markdown or explanation."""

    return call_llm_with_fallback(prompt, response_format={"type": "json_object"})


def run_roadmap_crew(student_profile_str: str, assessment_results_str: str, career_goal: str, test_score: float = None) -> str:
    """
    Generates a learning roadmap by calling the LLM directly (no CrewAI overhead).
    Returns a JSON string with: skill_profile, career_goal, modules.
    """
    profile_trimmed, results_trimmed = trim_payloads(student_profile_str, assessment_results_str)

    score_context = f"\nOverall Test Score: {test_score}%" if test_score is not None else ""

    # Query RAG Service for course documents matching the career_goal
    import os
    import requests
    rag_url = os.getenv("RAG_SERVICE_URL", "http://localhost:5002").rstrip("/")
    rag_context = ""
    try:
        r = requests.post(f"{rag_url}/api/rag/query", json={
            "query": career_goal,
            "mentorId": "default_mentor",
            "generateAnswer": False
        }, timeout=8.0)
        if r.ok:
            data = r.json()
            chunks = data.get("chunks", [])
            if chunks:
                rag_context = "\n\n".join([f"Source: {c.get('sourceId', 'Document')}\nContent: {c.get('content', '')}" for c in chunks])
                logger.info(f"Retrieved {len(chunks)} RAG chunks for career goal: {career_goal}")
            else:
                logger.info(f"No RAG chunks found for career goal: {career_goal}")
    except Exception as e:
        logger.error(f"Failed to fetch RAG context inside run_roadmap_crew: {e}")

    rag_instruction = ""
    if rag_context:
        rag_instruction = f"""
        IMPORTANT: The mentor has uploaded official course documents and educational material for this category in the knowledge base.
        You MUST strictly align the learning modules, task descriptions, and roadmap scope to follow these official mentor guidelines:
        
        Mentor Course Guidelines:
        {rag_context}
        """

    prompt = f"""Create a personalized learning roadmap for a student targeting: {career_goal}
Use their profile background, overall test score, and detailed assessment answers (stating correctness) to structure a curriculum that heavily focuses on improving their weak points (questions they answered incorrectly).
{rag_instruction}

Student: {profile_trimmed}{score_context}
Detailed Answers: {results_trimmed}

Return a JSON object with:
- "skill_profile": {{"skill_levels": {{}}, "strengths": [], "weaknesses": [], "missing_skills": []}}
- "career_goal": "{career_goal}"
- "modules": list of modules (suggest 2-4 modules depending on skill gap), each with: module_number (int), title, description, skills_covered (list), tasks (list), project ({{"name": "...", "description": "..."}})

Return ONLY the JSON object, no markdown or explanation."""

    return call_llm_with_fallback(prompt, response_format={"type": "json_object"})

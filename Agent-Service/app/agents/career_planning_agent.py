import crewai.llms.cache as _crewai_cache
_crewai_cache.mark_cache_breakpoint = lambda msg: msg

from crewai import Agent, Task, Crew, Process, LLM
from app.tools.analyze_skills_tool import analyze_student_skills
from app.tools.generate_skill_gap_tool import generate_skill_gap
from app.tools.create_roadmap_tool import create_roadmap
from app.config.settings import settings

# Initialize CrewAI LLM pointing to Groq
llm = LLM(
    model="groq/groq/compound-mini",
    api_key=settings.GROQ_API_KEY
)

# Define agent
career_planner = Agent(
    role="Career Planning Specialist",
    goal="Help students transition into their target careers by analyzing their skills and creating roadmap pathways.",
    backstory="You are an expert career counselor and education planner. You have deep knowledge of what skills are required for various tech careers.",
    tools=[analyze_student_skills, generate_skill_gap, create_roadmap],
    llm=llm,
    verbose=True
)

def run_skill_analysis_crew(student_profile_str: str, assessment_results_str: str) -> str:
    """
    Executes sequential tasks to analyze student skills and identify strengths, weaknesses, and missing skills.
    Returns a combined JSON string containing: skill_levels, strengths, weaknesses, missing_skills.
    """
    task1 = Task(
        description=f"""
        Analyze the student's profile and assessment results to determine current skill levels.
        Use the 'Analyze Student Skills' tool with the inputs:
        student_profile: {student_profile_str}
        assessment_results: {assessment_results_str}
        
        Output only the JSON mapping of skills to levels.
        """,
        expected_output="JSON object mapping skills to levels (Beginner, Intermediate, Advanced).",
        agent=career_planner
    )

    task2 = Task(
        description=f"""
        Take the skill levels from the previous task (Task 1) and generate a skill gap analysis.
        Use the 'Generate Skill Gap' tool with:
        skill_levels: the result from Task 1
        career_goal: a generic career goal suited to their background/skills
        
        Combine the outputs. Return a single JSON object with EXACTLY this structure:
        {{
          "skill_levels": <the skill_levels dictionary from Task 1>,
          "strengths": <list of strengths returned by the tool>,
          "weaknesses": <list of weaknesses returned by the tool>,
          "missing_skills": <list of missing_skills returned by the tool>
        }}
        Do not add any explanations or markdown formatting outside of the JSON object.
        """,
        expected_output="A single combined JSON object with keys: skill_levels, strengths, weaknesses, missing_skills.",
        agent=career_planner
    )

    crew = Crew(
        agents=[career_planner],
        tasks=[task1, task2],
        process=Process.sequential,
        verbose=True
    )
    
    return str(crew.kickoff())

def run_roadmap_crew(student_profile_str: str, assessment_results_str: str, career_goal: str) -> str:
    """
    Executes sequential tasks to analyze skills, find gaps, and build a learning roadmap for the student.
    Returns a combined JSON string containing: skill_profile, career_goal, modules.
    """
    task1 = Task(
        description=f"""
        Analyze the student's profile and assessment results to determine current skill levels.
        Use the 'Analyze Student Skills' tool with the inputs:
        student_profile: {student_profile_str}
        assessment_results: {assessment_results_str}
        
        Output only the JSON mapping of skills to levels.
        """,
        expected_output="JSON object mapping skills to levels (Beginner, Intermediate, Advanced).",
        agent=career_planner
    )

    task2 = Task(
        description=f"""
        Take the skill levels from Task 1 and generate a skill gap analysis against the target career goal.
        Use the 'Generate Skill Gap' tool with:
        skill_levels: the result from Task 1
        career_goal: {career_goal}
        
        Combine the outputs. Return a single JSON object with EXACTLY this structure:
        {{
          "skill_levels": <the skill_levels dictionary from Task 1>,
          "strengths": <list of strengths returned by the tool>,
          "weaknesses": <list of weaknesses returned by the tool>,
          "missing_skills": <list of missing_skills returned by the tool>
        }}
        Do not add any explanations or markdown formatting outside of the JSON object.
        """,
        expected_output="A single combined JSON object with keys: skill_levels, strengths, weaknesses, missing_skills.",
        agent=career_planner
    )

    task3 = Task(
        description=f"""
        Take the skill gap results from Task 2 and generate a personalized learning roadmap.
        Use the 'Create Roadmap' tool with:
        skill_gap: the result from Task 2
        career_goal: {career_goal}
        
        Combine all information into a single final JSON object representing the full RoadmapResponse:
        {{
          "skill_profile": <the complete JSON object from Task 2>,
          "career_goal": "{career_goal}",
          "modules": <the list of modules returned by the Create Roadmap tool>
        }}
        Do not add any explanations or markdown formatting outside of the JSON object.
        """,
        expected_output="A single final JSON object containing keys: skill_profile, career_goal, modules.",
        agent=career_planner
    )

    crew = Crew(
        agents=[career_planner],
        tasks=[task1, task2, task3],
        process=Process.sequential,
        verbose=True
    )
    
    return str(crew.kickoff())

from pydantic import BaseModel, Field
from typing import List, Dict

class SkillProfileResponse(BaseModel):
    skill_levels: Dict[str, str] = Field(..., description="Dict mapping technical skills to level (Beginner/Intermediate/Advanced)")
    strengths: List[str] = Field(..., description="Key strengths identified")
    weaknesses: List[str] = Field(..., description="Areas for improvement")
    missing_skills: List[str] = Field(..., description="Skills required for career goal but currently missing")

class RoadmapProject(BaseModel):
    name: str = Field(..., description="Mini project name")
    description: str = Field(..., description="Mini project description")

class RoadmapModule(BaseModel):
    module_number: int = Field(..., description="Order of the module")
    title: str = Field(..., description="Title of the learning module")
    description: str = Field(..., description="Description of learning objectives")
    skills_covered: List[str] = Field(..., description="List of skills addressed in this module")
    tasks: List[str] = Field(..., description="Step-by-step tasks to complete")
    project: RoadmapProject = Field(..., description="Hands-on project for this module")

class RoadmapResponse(BaseModel):
    skill_profile: SkillProfileResponse
    career_goal: str = Field(..., description="Target career goal")
    modules: List[RoadmapModule] = Field(..., description="List of structured roadmap modules")

class TestQuestion(BaseModel):
    question: str = Field(..., description="The test question text")
    options: List[str] = Field(..., description="Four multiple-choice options")
    correct_answer: str = Field(..., description="The exact correct option string")

class TestQuestionsResponse(BaseModel):
    questions: List[TestQuestion] = Field(..., description="List of generated questions")

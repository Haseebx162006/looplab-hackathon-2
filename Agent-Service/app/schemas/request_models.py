from pydantic import BaseModel, Field
from typing import List

class StudentProfile(BaseModel):
    name: str = Field(..., description="Name of the student")
    experience_level: str = Field(..., description="Experience level (e.g. Beginner, Intermediate, Advanced)")
    background: str = Field(..., description="Educational or professional background")
    interests: List[str] = Field(..., description="List of technical interests or career interests")

class AssessmentResult(BaseModel):
    question: str = Field(..., description="Assessment question")
    answer: str = Field(..., description="Student's answer to the question")

class AnalyzeSkillsRequest(BaseModel):
    student_profile: StudentProfile
    assessment_results: List[AssessmentResult]

class GenerateRoadmapRequest(BaseModel):
    student_profile: StudentProfile
    assessment_results: List[AssessmentResult]
    career_goal: str = Field(..., description="The target career role (e.g. Fullstack Developer)")

class GenerateTestRequest(BaseModel):
    module: str = Field(..., description="Module/domain name (e.g. AI Engineering)")
    difficulty: str = Field(..., description="Difficulty level (easy, medium, or hard)")

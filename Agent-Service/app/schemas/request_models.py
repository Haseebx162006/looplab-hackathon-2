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
    correct_answer: str = Field(None, description="The correct answer to the question")
    is_correct: bool = Field(None, description="Whether the student's answer was correct")

class AnalyzeSkillsRequest(BaseModel):
    student_profile: StudentProfile
    assessment_results: List[AssessmentResult]
    test_score: float = Field(None, description="Overall test score percentage or points")

class GenerateRoadmapRequest(BaseModel):
    student_profile: StudentProfile
    assessment_results: List[AssessmentResult]
    career_goal: str = Field(..., description="The target career role (e.g. Fullstack Developer)")
    test_score: float = Field(None, description="Overall test score percentage or points")

class GenerateTestRequest(BaseModel):
    module: str = Field(..., description="Module/domain name (e.g. AI Engineering)")
    difficulty: str = Field(..., description="Difficulty level (easy, medium, or hard)")
    skills: List[str] = Field(default_factory=list, description="User's selected skills")
    experience: str = Field(None, description="User's experience level")

# AI Agent Service Integration Guide

This document outlines the API contracts and guidelines for integrating the **Main Backend** with the **AI Agent Service**. Any future AI agent or developer working on the Main Backend must follow these schemas and patterns when consuming or extending the AI Agent Service.

---

## 🚀 Service Information
* **Technology Stack**: FastAPI, Python 3.11, CrewAI, Groq (via LiteLLM).
* **Port**: Runs on port `8000` by default.
* **Statelessness**: The AI Agent Service has no database. The Main Backend is responsible for storing and persisting all student profiles, assessment results, and generated roadmaps.

---

## 🔌 API Endpoints

### 1. Skill Profile Analysis
* **Endpoint**: `POST /agent/analyze-skills`
* **Purpose**: Analyzes student questionnaire responses to identify skill levels, strengths, weaknesses, and missing skills.
* **Request Body Schema**:
```json
{
  "student_profile": {
    "name": "Alice",
    "experience_level": "Beginner",
    "background": "Self-taught Python enthusiast.",
    "interests": ["Web Development", "Databases"]
  },
  "assessment_results": [
    {
      "question": "What is list comprehension?",
      "answer": "A compact way to write loops."
    }
  ]
}
```
* **Response Body Schema**:
```json
{
  "skill_levels": {
    "Python": "Intermediate",
    "Web Development": "Beginner",
    "Databases": "Beginner"
  },
  "strengths": ["Python"],
  "weaknesses": ["Web Development", "Databases"],
  "missing_skills": ["API Design", "Testing"]
}
```

### 2. Roadmap Generation
* **Endpoint**: `POST /agent/generate-roadmap`
* **Purpose**: Runs the complete sequential crew analysis (Skills Analysis → Skill Gap Comparison → Modular Roadmap Generation).
* **Request Body Schema**:
```json
{
  "student_profile": {
    "name": "Alice",
    "experience_level": "Beginner",
    "background": "Self-taught Python.",
    "interests": ["Web Development"]
  },
  "assessment_results": [
    {
      "question": "What is list comprehension?",
      "answer": "A compact way to write loops."
    }
  ],
  "career_goal": "Junior Backend Developer"
}
```
* **Response Body Schema**:
```json
{
  "skill_profile": {
    "skill_levels": { "Python": "Intermediate" },
    "strengths": ["Python"],
    "weaknesses": ["Web Development"],
    "missing_skills": ["API Design"]
  },
  "career_goal": "Junior Backend Developer",
  "modules": [
    {
      "module_number": 1,
      "title": "Module Title",
      "description": "Module Description",
      "skills_covered": ["HTTP", "REST"],
      "tasks": ["Task A", "Task B"],
      "project": {
        "name": "Project Name",
        "description": "Project Description"
      }
    }
  ]
}
```

---

## 🛠️ Integration Guidelines for Backend Agents

1. **Service URL**: Make the AI Agent Service base URL configurable via environment variables in the Main Backend (`.env`):
   ```env
   AI_AGENT_SERVICE_URL=http://localhost:8000
   ```
2. **Data Consistency**: Ensure that when calling `POST /agent/generate-roadmap`, the request payload matches the OpenAPI pydantic schema exactly.
3. **Caching**: Because LLM inference takes several seconds, do not call the AI Agent Service synchronously on high-traffic endpoints without caching or background job queuing if applicable.
4. **Data Persistence**: Store the returned `skill_profile` and `modules` JSON directly in your database tables.

---

## 📦 How to Run the AI Agent Service (for testing/development)

The AI Agent Service is containerized with Python 3.11 to avoid version incompatibilities on host systems:

```bash
cd Agent-Service
# Build the container
docker build -t ai-agent-service .
# Run on port 8000
docker run -p 8000:8000 --env-file .env ai-agent-service
```

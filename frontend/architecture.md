# 🎓 AI-Powered Personalized Learning Platform
## Technical Architecture & System Flow Document

> **Executive Summary:** An adaptive, two-service microservices architecture that uses CrewAI, Gemini LLM, RAG, and a Qdrant vector database to generate personalized skill profiles and learning roadmaps for students, backed by real human mentor review loops.

---

## 1. Microservices Architecture & Responsibilities

The system consists of **ONLY TWO MICROSERVICES**:

| Service Name | Primary Tech Stack | Key Responsibilities & Capabilities |
| :--- | :--- | :--- |
| **1. Main Backend Service** | Node.js, TypeScript, Express | • Student Authentication (Signup / Login)<br>• Student Profile Management (Education, Goals, Existing Skills)<br>• Assessment & Question Storage<br>• Roadmap & Task Progress Tracking<br>• Task Submission Management<br>• Human Mentor Dashboard & Feedback Routing<br>• Orchestrating REST API calls to the AI Service |
| **2. AI Service** | Python, FastAPI, CrewAI, Gemini LLM, RAG, Qdrant | • AI Skill Analysis (CrewAI multi-agent processing)<br>• Skill Profile Generation (Strengths, Weaknesses, Gaps)<br>• RAG Resource Retrieval (Qdrant Vector DB)<br>• Personalized Learning Roadmap Generation (Modules & Tasks)<br>• AI Learning Assistant for Students<br>• AI Assistance & Draft Feedback Generation for Human Mentors |

---

## 2. High-Level System Architecture

```mermaid
graph TD
    User([Student / Mentor]) -->|HTTP / JSON| Frontend[React / Next.js Frontend]
    
    subgraph "Service 1: Main Backend"
        Frontend <-->|REST API| MainBackend[Main Backend Service\nNode.js + Express + TypeScript]
        MainBackend <--> AuthModule[Auth & Profiles]
        MainBackend <--> TaskModule[Roadmap & Submissions]
        MainBackend <--> DB[(Main Database)]
    end
    
    subgraph "Service 2: AI Engine"
        MainBackend <-->|HTTP / REST API| AIService[AI Service\nPython + FastAPI]
        AIService <--> CrewAI[CrewAI Multi-Agent]
        AIService <--> Gemini[Gemini LLM]
        AIService <--> RAG[RAG Engine]
        RAG <--> Qdrant[(Qdrant Vector DB)]
    end
```

---

## 3. Complete Student Learning Flow

```mermaid
sequenceDiagram
    autonumber
    actor S as Student
    participant F as Frontend
    participant B as Main Backend Service
    participant AI as AI Service (FastAPI)
    participant Q as Qdrant Vector DB
    actor M as Human Mentor

    rect rgb(240, 245, 255)
    note right of S: 1. Registration & Assessment
    S->>F: Register & Create Profile
    F->>B: Store Profile Data
    S->>F: Submit Skill Assessment Answers
    F->>B: Save Assessment Answers
    B->>AI: Send Assessment Answers (POST /api/ai/analyze-skills)
    AI->>AI: CrewAI + Gemini Analyze Strengths & Gaps
    AI-->>B: Return Generated Skill Profile
    B->>B: Store Skill Profile
    end

    rect rgb(250, 240, 255)
    note right of S: 2. Personalized Roadmap Generation
    S->>F: Request Personalized Roadmap
    F->>B: Fetch Roadmap Request
    B->>AI: Send Profile, Skill Gaps & Goals
    AI->>Q: Retrieve Relevant Resources (RAG)
    Q-->>AI: Return Context & Course Materials
    AI->>AI: CrewAI + Gemini Build Custom Modules & Tasks
    AI-->>B: Return Structured Roadmap JSON
    B->>B: Store & Assign Roadmap to Student
    end

    rect rgb(240, 255, 245)
    note right of S: 3. Learning & Task Submissions
    S->>F: Start Task & View Resources
    opt Ask AI Assistant
        S->>F: Ask Question / Request Hint
        F->>B: Forward Inquiry
        B->>AI: Query RAG Assistant with Context
        AI-->>F: Grounded Explanation & Hint
    end
    S->>F: Complete Task & Submit Solution
    F->>B: Save Task Submission (Status: Pending Review)
    end

    rect rgb(255, 250, 240)
    note right of S: 4. Human Mentor Review Loop
    B->>M: Notify Mentor of New Submission
    opt Optional AI Assistance for Mentor
        B->>AI: Request Submission Pre-Analysis
        AI-->>B: Return Suggested Issues & Draft Feedback
    end
    M->>B: Review Submission & Make Decision
    alt APPROVED
        B->>S: Task Approved -> Unlock Next Task
    else NEEDS IMPROVEMENT
        B->>S: Provide Feedback -> Return for Improvement
    end
    end
```

---

## 4. Detailed Project Flow

### Step 1: Student Registration & Profile Creation
- Student registers via the Frontend.
- **Main Backend** handles authentication and stores student background (education, career goals, existing programming/tech experience).

### Step 2: Assessment
- Student completes an adaptive assessment (Programming, DSA, AI/ML, Web/Backend, Databases).
- **Main Backend** stores raw responses and forwards them to the **AI Service**.

### Step 3: AI Skill Analysis
- **AI Service** processes answers using **CrewAI** multi-agent analysis.
- Evaluates skill levels, identifies knowledge gaps, and creates a tailored **Skill Profile**.
- Results are returned to the **Main Backend** for permanent storage.

### Step 4: Personalized Roadmap Generation
- Student requests a customized learning path.
- **Main Backend** passes the student's profile, skill profile, and career goals to the **AI Service**.
- **AI Service** executes **RAG queries** against **Qdrant** to find relevant learning materials.
- **CrewAI + Gemini** construct a structured, step-by-step roadmap broken down into manageable modules and tasks.
- **Main Backend** saves the roadmap and presents it to the student.

### Step 5: Learning & Task Execution
- Student works through assigned roadmap tasks.
- Student can ask the **AI Learning Assistant** for instant hints, code explanations, or resources (grounded by **RAG**).
- Student submits task deliverables through the **Main Backend**.

### Step 6: Human Mentor Review
- **Important:** The mentor is a **HUMAN expert**, NOT an automated AI decision-maker.
- The **AI Service** may optionally pre-analyze submissions to assist mentors by highlighting potential issues or drafting feedback suggestions.
- The **Human Mentor** makes the final decision: **Approve** or **Request Improvement**.

### Step 7: Progress Loop
- **If Approved:** Task marked complete $\rightarrow$ Student advances to the next task.
- **If Needs Improvement:** Mentor feedback delivered to Student $\rightarrow$ Student improves work $\rightarrow$ Resubmits to Human Mentor.

---

## 5. Core Technology Roles Explained

### 🤖 CrewAI Multi-Agent System
- Operates within the **AI Service**.
- Orchestrates multiple specialized agents (e.g., *Skill Evaluator Agent*, *Curriculum Architect Agent*) to analyze assessment data and construct balanced, high-quality learning roadmaps without human manual planning.

### 📚 RAG (Retrieval-Augmented Generation) + Qdrant Vector DB
- **Qdrant** stores high-dimensional embeddings of curated learning materials, tutorials, and documentation.
- **RAG** retrieves accurate, grounded context before passing prompts to **Gemini LLM**, preventing hallucinations and providing precise learning hints.

### 👨‍🏫 Human Mentor (Human-in-the-Loop)
- Maintains quality control over student learning.
- AI provides speed and insights; the **HUMAN mentor** provides true validation, final grades, and personal guidance.

### 🔌 Main Backend ↔ AI Service Communication
- Communicates asynchronously via clean **REST API HTTP JSON requests**.
- Keeps business logic, user management, and DB transactions in Node.js while keeping AI computation isolated in Python FastAPI.

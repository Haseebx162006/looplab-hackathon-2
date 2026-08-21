live url : looplab-hackathon-2.vercel.app
# 🎓 SEEKH AI — Personalized Adaptive Career & Assessment Platform

SEEKH AI is a next-generation, AI-driven educational platform designed to personalize career roadmaps, automate technical assessments, and empower mentors through custom knowledge retrieval (RAG) and smart agent workflows. The platform is designed as an adaptive, multi-service architecture that bridges student assessments with human-in-the-loop mentor reviews.

---

## 🏗️ System Architecture

SEEKH AI utilizes a decentralized, monorepo microservices architecture comprised of four primary services alongside container orchestration, Kubernetes configurations, and Terraform-based Infrastructure as Code (IaC).

```mermaid
graph TD
    subgraph Client Application
        FE[Next.js Frontend]
    end

    subgraph API Gateway / Orchestration
        BE[Express.js Backend Gateway]
    end

    subgraph Dedicated AI Services
        RAG[RAG Service - Express/pgvector/Gemini]
        AGT[Agent Service - FastAPI/LiteLLM/Groq]
    end

    subgraph Database Cluster
        DB[(PostgreSQL + pgvector)]
    end

    FE -->|HTTP API Requests| BE
    BE -->|Proxy RAG / Vector Calls| RAG
    BE -->|Triggers AI Workflows| AGT
    BE -->|Queries, Syncs & Submissions| DB
    RAG -->|Retrieves & Indexes Context| DB
```

---

## 🛠️ Service-by-Service Technical Breakdown

### 1. [Next.js Frontend](file:///home/hussain/loop-hack/frontend)
* **Framework**: React 19, Next.js 16.3.1 (App Router)
* **State Management**: Redux Toolkit & React Redux ([store/index.ts](file:///home/hussain/loop-hack/frontend/src/store/index.ts))
* **Styling & Theme**: Tailwind CSS v4 (Lavender-Obsidian palette: background `#F5F2FA`, accents `#D8CBEB`, surfaces `#1E192B`/`#141118`)
* **Motion & Scrolling**: GSAP 3, ScrollTrigger, `@gsap/react`, Lenis (smooth scrolling), Framer Motion, and OGL (WebGL effects)
* **Integrations**: Recharts (for progress metrics), `html2canvas` & `jspdf` (for dynamically generating completion certificates)

### 2. [Express Backend Gateway](file:///home/hussain/loop-hack/backend)
* **Runtime & Language**: Node.js, TypeScript (ESM)
* **Database Driver**: `pg` (PostgreSQL Client with raw SQL queries)
* **Auth & Security**: JSON Web Tokens (JWT) & 6-digit OTP verification email flows
* **Email integration**: Google Gmail API via official `googleapis` package ([utils/mailer.ts](file:///home/hussain/loop-hack/backend/src/utils/mailer.ts))
* **Meeting Scheduler**: Google Calendar & Meet API using OAuth 2.0 refresh tokens ([google-calendar.service.ts](file:///home/hussain/loop-hack/backend/src/modules/admin-review/google-calendar.service.ts))
* **Document Uploads**: Cloudinary API (stores student avatars and resume PDFs)

### 3. [RAG Microservice](file:///home/hussain/loop-hack/RAG-Service)
* **Runtime & Language**: Node.js, Express, JavaScript (ESM)
* **Vector Database**: PostgreSQL with `pgvector` extension
* **Embedding Model**: Google Generative Language API using `gemini-embedding-001` (768 dimensions)
* **Hybrid Retrieval**: Combines pgvector cosine similarity search (`<=>`) with PostgreSQL full-text search (`tsvector` & `ts_rank`)
* **Grounding Engine**: Merges matches with Reciprocal Rank Fusion (RRF) and generates responses grounded by context chunks using Gemini API ([retrieval.service.js](file:///home/hussain/loop-hack/RAG-Service/src/features/rag/services/retrieval.service.js))

### 4. [AI Agent Microservice](file:///home/hussain/loop-hack/Agent-Service)
* **Runtime & Language**: Python 3.10+, FastAPI, Uvicorn
* **Orchestrator & LLM SDK**: LiteLLM for routing calls to Groq API models with rate-limit and decommission fallbacks ([app/config/llm.py](file:///home/hussain/loop-hack/Agent-Service/app/config/llm.py))
* **AI Pipelines**:
  * **Roadmap Crew**: Compiles week-by-week milestones aligning with RAG mentor materials.
  * **Skill Evaluator**: Maps incorrect diagnostic answers directly to skill levels.
  * **CV Analyzer**: Extracts text via `pdfplumber` and executes multi-criteria evaluation (content, impact, structure, ATS tips).

---

## 📂 Detailed Folder & Code Symbol Map

### 💻 Frontend Architecture (`frontend/src`)
* **[src/app/video-reveal/components/VideoScrollReveal.tsx](file:///home/hussain/loop-hack/frontend/src/app/video-reveal/components/VideoScrollReveal.tsx)**
  High-fidelity video reveal component. Loads `/video.mp4` as a binary Blob to eliminate network lag, registers iOS touch/pointer triggers to prime autoplay, and uses a custom `requestAnimationFrame` loop to linearly interpolate (lerp) video seek values smoothly without seeking collisions.
* **[src/app/storytelling/components/InteractiveScrollExperience.tsx](file:///home/hussain/loop-hack/frontend/src/app/storytelling/components/InteractiveScrollExperience.tsx)**
  GSAP ScrollTrigger controller that coordinates a 3D-feeling robot visual. It interpolates bounds and positions, transitioning the robot down the page canvas to dock into specific capability feature cards.
* **[src/app/assessments](file:///home/hussain/loop-hack/frontend/src/app/assessments)**
  Adaptive diagnostic MCQ testing portal. Submits results directly to the backend to generate the initial skill vector.
* **[src/app/admin](file:///home/hussain/loop-hack/frontend/src/app/admin)**
  The Mentor portal interface which includes:
  * `knowledge-base`: PDF document upload portal proxying to the vectorizer.
  * `meetings`: Review schedule board where Google Meet session requests are approved/rejected.
  * `certificates`: Panel to issue custom certificates.
  * `reviews`: Roster to check task submissions.
* **[src/store](file:///home/hussain/loop-hack/frontend/src/store)**
  * [api/learningApi.ts](file:///home/hussain/loop-hack/frontend/src/store/api/learningApi.ts): Redux Query bindings linking all endpoints (Roadmaps, Tasks, Submissions, Bookings, RAG).

### ⚙️ Core Backend Gateway (`backend/src`)
* **[src/db/migrations/migrate.ts](file:///home/hussain/loop-hack/backend/src/db/migrations/migrate.ts)**
  Orchestrates database setup. Programmatically creates 17+ tables including `users`, `profiles` (storing CV text and URLs), `modules`, `tests`, `roadmaps`, `task_submissions`, `certificates`, `mentor_call_requests`, and RAG-related tables.
* **[src/modules/cv-analyze/cv-analyze.controller.ts](file:///home/hussain/loop-hack/backend/src/modules/cv-analyze/cv-analyze.controller.ts)**
  Extracts resume text on upload via `pdf-parse` ([extract-cv-text.ts](file:///home/hussain/loop-hack/backend/src/modules/cv-analyze/extract-cv-text.ts)), uploads PDF to Cloudinary, and triggers the FastAPI CV reviewer pipeline.
* **[src/modules/booking/booking.service.ts](file:///home/hussain/loop-hack/backend/src/modules/booking/booking.service.ts)**
  Creates session requests and implements responses. Integrates with the [GoogleCalendarService](file:///home/hussain/loop-hack/backend/src/modules/admin-review/google-calendar.service.ts) to establish video call links via Google Calendar, sending verification emails upon approval.
* **[src/features/rag/rag.controller.js](file:///home/hussain/loop-hack/backend/src/features/rag/rag.controller.js)**
  A gateway routing proxy that forwards documents/queries between the frontend client and the underlying `RAG-Service` microservice.

### 🔍 Custom RAG Pipeline (`RAG-Service/src`)
* **[src/features/rag/services/retrieval.service.js](file:///home/hussain/loop-hack/RAG-Service/src/features/rag/services/retrieval.service.js)**
  Core retrieval logic. Performs parallel database queries:
  1. Cosine similarity score matching using pgvector operator (`1 - (embedding <=> $1::vector)`).
  2. Full-Text search query matching (`search_vector @@ websearch_to_tsquery`).
  Fuses results using Reciprocal Rank Fusion ($RRF\_Score = \sum \frac{1}{60 + Rank}$) to fetch the top 10 most relevant document blocks.
* **[src/features/rag/services/ingestion.service.js](file:///home/hussain/loop-hack/RAG-Service/src/features/rag/services/ingestion.service.js)**
  Chunking and Indexing pipeline. Takes document text, breaks it into overlapping segments using [chunking.service.js](file:///home/hussain/loop-hack/RAG-Service/src/features/rag/services/chunking.service.js), requests vector representations via [embedding.service.js](file:///home/hussain/loop-hack/RAG-Service/src/features/rag/services/embedding.service.js), and stores them inside Postgres.
* **[src/features/rag/services/embedding.service.js](file:///home/hussain/loop-hack/RAG-Service/src/features/rag/services/embedding.service.js)**
  Accesses the Google Generative Language API endpoint (`models/gemini-embedding-001:batchEmbedContents`). If API keys are missing or hit limit blocks, it gracefully switches to a deterministic trigonometric hashing function ([generateFallbackEmbedding](file:///home/hussain/loop-hack/RAG-Service/src/features/rag/services/embedding.service.js#L64-L77)) to prevent platform downtime.

### 🤖 AI Agent Pipelines (`Agent-Service/app`)
* **[app/api/agent_routes.py](file:///home/hussain/loop-hack/Agent-Service/app/api/agent_routes.py)**
  Exposes the endpoints: `/agent/analyze-skills`, `/agent/generate-roadmap`, `/agent/analyze-cv`, and `/agent/generate-test`.
  * The diagnostic test route queries `RAG-Service` to fetch course context matching the module name and appends it to instructions to ensure MCQ tests directly reflect official guidelines.
  * The CV route downloads PDFs using `pdfplumber`, extracts string details, and grades them against recruiter rubrics.
* **[app/agents/career_planning_agent.py](file:///home/hussain/loop-hack/Agent-Service/app/agents/career_planning_agent.py)**
  Implements specialized AI roles (Skill Analyzers, Curriculum Architects). Instead of running heavy CrewAI structures that introduce API latency, tasks are routed directly to LLMs with schema constraints to maintain high response velocity.
* **[app/config/llm.py](file:///home/hussain/loop-hack/Agent-Service/app/config/llm.py)**
  A completion wrapper utilizing LiteLLM. Implements a primary model call (`groq/openai/gpt-oss-20b`) and cycles through fallback models (`groq/openai/gpt-oss-120b`, `groq/qwen/qwen3.6-27b`) if Groq Rate Limits or API outages occur.

---

## 🚀 Key Modules & Feature Highlights

### 1. Adaptive Diagnostic & Assessment Engine
Students undergo a technical assessment mapped to target roles. AI generates customized multiple-choice tests using a combination of the student's profile context and the course material uploaded in the mentor's RAG knowledge base. Results are analyzed, separating correct and incorrect answers to determine specific skill levels (Beginner, Intermediate, Advanced) and log skill gaps.

### 2. Personalized Learning Roadmap Generation
Based on the assessed skill profile and selected career goal, the system retrieves relevant course syllabus documents from the RAG store. The Agent Service builds a customized roadmap broken down into sequential milestones (modules), learning tasks, and practical projects, saving this structure to the PostgreSQL database for student tracking.

### 3. Human-in-the-Loop Mentor Review
Although assessments and learning paths are dynamically built, grading is governed by a human mentor:
* **Submissions**: Students upload code URLs or screenshots.
* **Mentor Console**: Mentors inspect files and approve or request revisions. The AI service provides initial analysis suggestions (highlighting issues) to speed up mentor evaluations.
* **Certificates**: Approved roadmaps unlock the certificate portal, generating verifiable PDF credentials using standard typography canvas templates.

### 4. Interactive RAG Learning Assistant
An AI chatbot is accessible directly from the student's roadmap. It uses hybrid pgvector/RRF document lookups to provide grounded help, explaining curriculum tasks, sharing tips, and resolving queries without hallucinating.

---

## 🛠️ Environment Configuration & Local Setup

### 1. Prerequisites
Ensure you have the following installed on your machine:
* **Node.js** (v18+)
* **Python** (v3.10+)
* **PostgreSQL** (v14+ with `pgvector` extension enabled)
* **Docker** & **Docker Compose** (optional for containerized runtime)

---

### 2. Service Setup Guide

To manually start the platform services locally, configure the variables and execute commands in separate terminal interfaces:

#### ⚙️ Express Backend Gateway
1. Navigate to directory:
   ```bash
   cd backend
   ```
2. Copy env:
   ```bash
   cp .env.example .env
   ```
3. Set configs:
   * `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/loop_hack_db`
   * `RAG_SERVICE_URL=http://localhost:5002`
   * `AGENT_SERVICE_URL=http://localhost:8000`
   * `JWT_SECRET=your_jwt_secret`
   * Provide Google Calendar OAuth client & refresh credentials to enable calendar scheduling.
4. Install & migrate database schema:
   ```bash
   npm install
   npm run db:migrate
   ```
5. Run server:
   ```bash
   npm run dev
   ```

#### 🔍 RAG Microservice
1. Navigate to directory:
   ```bash
   cd RAG-Service
   ```
2. Copy env:
   ```bash
   cp .env.example .env
   ```
3. Set configs:
   * `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/loop_hack_db`
   * `GEMINI_API_KEY=your_gemini_api_key`
4. Install & Run:
   ```bash
   npm install
   npm run dev
   ```

#### 🤖 AI Agent Service
1. Navigate to directory:
   ```bash
   cd Agent-Service
   ```
2. Setup and activate virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
   ```
3. Install packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy env & configure key:
   ```bash
   cp .env.example .env
   ```
   * Set `GROQ_API_KEY=your_groq_api_key`
5. Run server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

#### 💻 Next.js Frontend
1. Navigate to directory:
   ```bash
   cd frontend
   ```
2. Create `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```
3. Install & Run:
   ```bash
   npm install
   npm run dev
   ```

---

## 🐳 Docker & Container Orchestration

A multi-container orchestration is defined inside the root [docker-compose.yml](file:///home/hussain/loop-hack/docker-compose.yml) which spins up the database, Express APIs, microservices, and frontend client.

### Quick Setup Script
The project includes a [setup.sh](file:///home/hussain/loop-hack/setup.sh) script that automates prerequisite validation, copies configuration variables, triggers package installations, and launches container builds.

Run:
```bash
chmod +x setup.sh
./setup.sh
```

### Docker Compose Commands
Alternatively, orchestrate containers manually:
* Build and launch all services in detached mode:
  ```bash
  docker-compose up --build -d
  ```
* Inspect service status:
  ```bash
  docker-compose ps
  ```
* View running logs:
  ```bash
  docker-compose logs -f
  ```

---

## ☁️ Kubernetes & Terraform Deployment (Production)

### 1. Cloud Provisioning (Terraform)
The [terraform](file:///home/hussain/loop-hack/terraform) folder contains AWS deployment models:
* [main.tf](file:///home/hussain/loop-hack/terraform/main.tf): Establishes a Virtual Private Cloud (VPC), configures public subnets across availability zones, sets up internet gateways and routing tables, provisions AWS IAM policies, creates an Amazon Elastic Kubernetes Service (EKS) Control Plane, and spins up EKS worker node groups to host platform containers.

Apply IaC changes:
```bash
cd terraform
terraform init
terraform plan
terraform apply
```

### 2. Kubernetes Orchestration (`k8s`)
The [k8s](file:///home/hussain/loop-hack/k8s) folder holds Kubernetes deployment specifications:
* [postgres-deployment.yaml](file:///home/hussain/loop-hack/k8s/postgres-deployment.yaml): Runs the pgvector PostgreSQL instance using PersistentVolumes.
* [rag-deployment.yaml](file:///home/hussain/loop-hack/k8s/rag-deployment.yaml): Deploys the RAG microservice.
* [agent-deployment.yaml](file:///home/hussain/loop-hack/k8s/agent-deployment.yaml): Hosts the FastAPI Agent service.
* [backend-deployment.yaml](file:///home/hussain/loop-hack/k8s/backend-deployment.yaml): Configures the Express API Gateway.
* [frontend-deployment.yaml](file:///home/hussain/loop-hack/k8s/frontend-deployment.yaml): Deploys the Next.js client.

Apply manifests:
```bash
kubectl apply -f k8s/
```

---

## 🛡️ Developer Branding & Consistency Note

Inside the codebase configurations, you might notice variables or service names referencing **SkillForge** or **Huntr**:
* **SEEKH AI** is the official user-facing brand name of this adaptive education platform.
* **SkillForge** and **Huntr** represent internal project development stages and container namespace references (e.g. `skillforge-db`, `skillforge-frontend`) used inside Docker-Compose, Terraform templates, and shell scripts. Please preserve these config names to ensure service connectivity is not broken.

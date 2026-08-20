export interface HowItWorksStep {
  id: string;
  stepNumber: string;
  title: string;
  badge: string;
  description: string;
  isHeroAttachmentTarget?: boolean;
  accentColor: string;
}

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    id: "upload",
    stepNumber: "01",
    title: "Student Registration",
    badge: "Auth & Profile",
    description: "Student signs up via Main Backend and inputs education background, interests, existing skills, and career goals.",
    isHeroAttachmentTarget: true,
    accentColor: "from-purple-500 to-indigo-600",
  },
  {
    id: "icp",
    stepNumber: "02",
    title: "Skill Assessment",
    badge: "Diagnostic Test",
    description: "Student takes an adaptive assessment spanning programming, AI/ML, DSA, web development, and databases.",
    accentColor: "from-blue-500 to-cyan-500",
  },
  {
    id: "discover",
    stepNumber: "03",
    title: "AI Skill Analysis",
    badge: "CrewAI Evaluator",
    description: "FastAPI AI service executes CrewAI + Gemini LLM agents to evaluate strengths, weaknesses, and skill gaps.",
    accentColor: "from-emerald-500 to-teal-600",
  },
  {
    id: "research",
    stepNumber: "04",
    title: "Personalized Roadmap",
    badge: "RAG + Qdrant",
    description: "AI Service retrieves curated resources from Qdrant vector database and builds a custom module/task roadmap.",
    accentColor: "from-amber-500 to-orange-500",
  },
  {
    id: "qualify",
    stepNumber: "05",
    title: "Task Execution",
    badge: "AI Assistant",
    description: "Student works on tasks with instant grounded hints and code explanations from the AI Learning Assistant.",
    accentColor: "from-violet-500 to-purple-600",
  },
  {
    id: "outreach",
    stepNumber: "06",
    title: "Human Mentor Review",
    badge: "Human Expert",
    description: "A REAL HUMAN mentor reviews submission, assisted by AI analysis, giving actionable feedback or requesting improvements.",
    accentColor: "from-pink-500 to-rose-600",
  },
  {
    id: "meeting",
    stepNumber: "07",
    title: "Progress Loop",
    badge: "Mastery Loop",
    description: "Approved tasks unlock the next module. Needs improvement returns feedback for student revision.",
    accentColor: "from-emerald-400 to-green-600",
  },
];

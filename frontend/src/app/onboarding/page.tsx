"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Award,
  Compass,
  Briefcase,
  Wrench,
  Loader2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Laptop,
  Plus,
  Check,
  Code,
  Terminal,
  ChevronRight,
  Brain,
  Network,
  AlertCircle,
  Cpu,
  Layers,
  ChevronLeft,
  Sparkle
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useDispatch } from "react-redux";
import { setOnboardingComplete } from "@/store/slices/authSlice";
import { 
  useSaveProfileMutation, 
  useGenerateTestMutation, 
  useGetModulesQuery 
} from "@/store/api/learningApi";
import { useCompany } from "@/context/CompanyContext";

// Pre-defined languages & tech recommendations per module
const ROADMAP_TECH_MAP: Record<string, string[]> = {
  "AI Engineering": [
    "Python", "PyTorch", "OpenAI API", "LangChain", "Hugging Face", 
    "PGVector", "NumPy", "Pandas", "LlamaIndex", "Vector Databases", 
    "Prompt Engineering"
  ],
  "Backend Development": [
    "JavaScript", "TypeScript", "Node.js", "Express", "NestJS", "Go", 
    "Python", "PostgreSQL", "MongoDB", "Redis", "Docker", "AWS", 
    "GraphQL", "gRPC"
  ],
  "Flutter Development": [
    "Dart", "Flutter", "Firebase", "Riverpod", "Bloc Pattern", 
    "Provider", "SQLite", "REST APIs", "Git", "Google Play Store", 
    "Apple App Store"
  ],
  "Agentic AI": [
    "Python", "LangGraph", "CrewAI", "AutoGen", "Semantic Kernel", 
    "LangChain", "LLM Fine-tuning", "Agent Orchestration", "Function Calling",
    "Prompt Flow"
  ],
  "Software Testing": [
    "JavaScript", "TypeScript", "Jest", "Cypress", "Playwright", 
    "Selenium", "JUnit", "PyTest", "CI/CD Pipelines", "API Testing", 
    "Load Testing", "Postman"
  ]
};

const ROADMAP_DETAILS: Record<string, { description: string; tags: string[]; iconName: string }> = {
  "AI Engineering": {
    description: "Build intelligent apps, implement retrieval augmented generation (RAG), and orchestrate agent pipelines.",
    tags: ["LLMs", "RAG", "LangChain", "Vector DBs"],
    iconName: "Brain"
  },
  "Backend Development": {
    description: "Design scale-invariant API architectures, work with robust services, and handle complex databases.",
    tags: ["APIs", "NestJS", "PostgreSQL", "System Design"],
    iconName: "Terminal"
  },
  "Flutter Development": {
    description: "Build state-of-the-art native mobile, web, and desktop applications using Dart & Flutter.",
    tags: ["Mobile", "Dart", "Firebase", "State Mgmt"],
    iconName: "Laptop"
  },
  "Agentic AI": {
    description: "Dive into autonomous agents, multi-agent frameworks, tool integrations, and custom reasoning engines.",
    tags: ["Multi-Agent", "LangGraph", "CrewAI", "Autonomy"],
    iconName: "Network"
  },
  "Software Testing": {
    description: "Master unit, integration, and end-to-end automation testing, quality gates, and continuous delivery.",
    tags: ["Jest", "Playwright", "Cypress", "CI/CD"],
    iconName: "Wrench"
  }
};

export default function OnboardingPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { setHasCompletedOnboarding, isAuthenticated } = useCompany();
  
  const { data: modules, isLoading: isModulesLoading } = useGetModulesQuery();
  const [saveProfile] = useSaveProfileMutation();
  const [generateTest] = useGenerateTestMutation();

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

  // Onboarding Wizard Form State
  const [occupation, setOccupation] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [selectedModuleName, setSelectedModuleName] = useState("");
  const [experience, setExperience] = useState("Beginner");
  
  // Custom & recommended technologies
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkills, setCustomSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState("");

  // Generated Test Session ID State
  const [testSessionId, setTestSessionId] = useState("");

  // Pipeline execution loading state (Step 4)
  const [pipelineState, setPipelineState] = useState<{
    profileSaved: "idle" | "loading" | "success" | "error";
    testGenerated: "idle" | "loading" | "success" | "error";
  }>({
    profileSaved: "idle",
    testGenerated: "idle",
  });

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("seekh_auth_token") : null;
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  // Dynamically update skills when roadmap changes
  useEffect(() => {
    if (selectedModuleName) {
      const suggested = ROADMAP_TECH_MAP[selectedModuleName] || [];
      // pre-select first 4 skills
      setSelectedSkills(suggested.slice(0, 4));
      setCustomSkills([]);
    }
  }, [selectedModuleName]);

  const handleNext = () => {
    if (step === 1 && !occupation) {
      toast.error("Please select your current occupation / role.");
      return;
    }
    if (step === 2 && !selectedModuleId) {
      toast.error("Please select a target roadmap to start your learning journey.");
      return;
    }
    if (step === 3 && selectedSkills.length === 0) {
      toast.error("Please select or add at least one technology you know.");
      return;
    }

    setDirection(1);
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setDirection(-1);
    setStep((prev) => prev - 1);
  };

  const handleToggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleAddCustomSkill = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newSkillInput.trim();
    if (!clean) return;

    if (selectedSkills.includes(clean) || customSkills.includes(clean)) {
      toast.error("This skill is already added.");
      return;
    }

    setCustomSkills([...customSkills, clean]);
    setSelectedSkills([...selectedSkills, clean]);
    setNewSkillInput("");
  };

  const handleFinishOnboarding = async () => {
    setDirection(1);
    setStep(4);
    
    setPipelineState({ profileSaved: "loading", testGenerated: "idle" });

    try {
      // 1. Save user profile customization settings to DB
      await saveProfile({
        education: occupation,
        skills: selectedSkills,
        interests: [selectedModuleName],
        career_goal: selectedModuleName,
        experience,
      }).unwrap();

      setPipelineState({ profileSaved: "success", testGenerated: "loading" });

      // 2. Map experience rating -> difficulty mapping
      const difficultyMapping: Record<string, string> = {
        "Beginner": "easy",
        "Intermediate": "medium",
        "Advanced": "hard"
      };

      // 3. Automatically trigger backend AI diagnostic test session creation
      const testSession = await generateTest({
        module_id: selectedModuleId,
        difficulty: difficultyMapping[experience] || "medium"
      }).unwrap();

      setTestSessionId(testSession.test_id);
      setPipelineState({ profileSaved: "success", testGenerated: "success" });
      toast.success("AI calibration complete. Diagnostic assessment is ready!");

    } catch (error: any) {
      console.error("Onboarding setup failure:", error);
      toast.error(error.data?.message || error.message || "Failed to initialize assessment workspace.");
      
      setPipelineState(prev => ({
        ...prev,
        profileSaved: prev.profileSaved === "loading" ? "error" : "success",
        testGenerated: prev.profileSaved === "success" ? "error" : "idle",
      }));
    }
  };

  const handleLaunchAssessment = () => {
    if (!testSessionId) {
      toast.error("Diagnostic test is not initialized yet.");
      return;
    }
    dispatch(setOnboardingComplete());
    setHasCompletedOnboarding(true);
    router.push(`/assessments?test_id=${testSessionId}`);
  };

  const getRoadmapIcon = (name: string) => {
    const cleanName = name.toLowerCase();
    if (cleanName.includes("ai engineering")) return <Brain className="w-6 h-6 text-purple-600 animate-pulse" />;
    if (cleanName.includes("backend")) return <Terminal className="w-6 h-6 text-indigo-650" />;
    if (cleanName.includes("flutter")) return <Laptop className="w-6 h-6 text-cyan-500" />;
    if (cleanName.includes("agentic")) return <Network className="w-6 h-6 text-emerald-600 animate-pulse" />;
    if (cleanName.includes("testing") || cleanName.includes("software testing")) return <Wrench className="w-6 h-6 text-amber-500" />;
    return <Code className="w-6 h-6 text-slate-400" />;
  };

  // Directional sliding transitions
  const stepVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -100 : 100,
      opacity: 0,
    }),
  };

  return (
    <div data-lenis-prevent className="w-screen h-screen flex overflow-hidden bg-[#F5F2FA] font-sans relative">
      <Toaster position="top-right" toastOptions={{ style: { background: "#1c1830", color: "#f8fafc", border: "1px solid #3b2e5a" } }} />

      {/* LEFT SIDE: Robot Cover Image (Matches Login Page) */}
      <div className="hidden lg:flex w-1/2 h-full relative bg-[#F5F2FA] overflow-hidden items-center justify-center border-r border-[#D8CBEB]/50 shrink-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="w-full h-full relative"
        >
          <img
            src="/login-robot.png"
            alt="Seekh AI Agent"
            className="w-[125%] max-w-none h-full object-cover object-top -translate-x-[15%]"
          />
          {/* Subtle overlay gradients for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#F5F2FA]/80 via-transparent to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#F5F2FA]/40 pointer-events-none" />
        </motion.div>
      </div>

      {/* RIGHT SIDE: Onboarding Wizard (Enhanced Glassmorphic Form) */}
      <div 
        data-lenis-prevent 
        className="w-full lg:w-1/2 h-full bg-[#F5F2FA] flex flex-col justify-between p-6 sm:p-10 lg:p-12 overflow-y-auto overscroll-contain relative"
      >
        
        {/* Soft Lavender Background Accents */}
        <div className="absolute top-1/4 left-1/4 w-[30rem] h-[30rem] bg-[#D8CBEB]/45 rounded-full blur-[140px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-purple-200/25 rounded-full blur-[140px] pointer-events-none animate-pulse" />

        {/* Top Header Row */}
        <div className="flex items-center justify-between w-full mb-6 relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-slate-955 hover:border-slate-350 text-xs font-mono font-semibold transition-all shadow-xs group cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-505 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Home</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-purple-900 text-white flex items-center justify-center font-bold text-xs">
              <GraduationCap className="w-3.5 h-3.5" />
            </div>
            <span className="text-slate-955 font-black text-sm tracking-wider font-mono uppercase">SEEKH</span>
          </div>
        </div>

        {/* Central Wizard Box */}
        <div className="max-w-xl w-full mx-auto my-auto py-6 space-y-6 relative z-10">
          
          {/* Node Step Indicators */}
          {step < 4 && (
            <div className="w-full flex items-center justify-between px-6 py-4 bg-white/70 backdrop-blur-md border border-[#D8CBEB]/40 rounded-2xl shadow-[0_4px_20px_rgba(70,40,110,0.02)]">
              {[
                { num: 1, label: "Occupation" },
                { num: 2, label: "Roadmap Track" },
                { num: 3, label: "Experience & Tech" },
              ].map((node) => (
                <div key={node.num} className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs border transition-all duration-300 ${
                    step === node.num 
                      ? "bg-[#7C3AED] text-white border-[#7C3AED] shadow-[0_0_12px_rgba(124,58,237,0.35)]"
                      : step > node.num
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-600"
                      : "bg-white border-[#D8CBEB]/50 text-slate-400"
                  }`}>
                    {step > node.num ? <Check className="w-3.5 h-3.5" /> : node.num}
                  </div>
                  <span className={`text-[10px] md:text-xs font-mono font-bold hidden sm:inline ${
                    step === node.num ? "text-[#7C3AED]" : step > node.num ? "text-emerald-600" : "text-slate-405"
                  }`}>
                    {node.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Glassmorphic Wizard Container Card */}
          <div className="w-full bg-white/75 backdrop-blur-2xl border border-white/90 rounded-3xl p-6 sm:p-8 md:p-10 shadow-[0_24px_60px_rgba(70,40,110,0.07)] relative min-h-[440px] flex flex-col justify-between">
            
            <div className="relative flex-1">
              <AnimatePresence custom={direction} mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    custom={direction}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="space-y-6"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-[#7C3AED] font-bold uppercase tracking-wider block">STEP 1: BACKGROUND CALIBRATION</span>
                      <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                        <GraduationCap className="w-6 h-6 text-[#7C3AED]" /> Tell us about your background
                      </h2>
                      <p className="text-xs text-slate-500">
                        Please select your occupation. This helps us customize the diagnostic questions and complexity.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { id: "Student", title: "Student", desc: "Currently pursuing academic, bootcamp, or university studies.", icon: <GraduationCap className="w-5 h-5 text-[#7C3AED]" /> },
                        { id: "Job Holder", title: "Job Holder", desc: "Working professional in technical or industry-specific roles.", icon: <Briefcase className="w-5 h-5 text-indigo-505" /> },
                        { id: "Freelancer", title: "Freelancer", desc: "Independent contract engineer, builder, or creative.", icon: <Laptop className="w-5 h-5 text-cyan-505" /> },
                        { id: "Other", title: "Explorer / Other", desc: "Self-taught developer, builder, or shifting career paths.", icon: <Compass className="w-5 h-5 text-emerald-505" /> },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => setOccupation(opt.id)}
                          className={`p-5 rounded-2xl border text-left transition-all duration-300 cursor-pointer flex flex-col gap-3 relative overflow-hidden group ${
                            occupation === opt.id
                              ? "bg-[#7C3AED]/5 border-[#7C3AED] shadow-[0_8px_20px_rgba(124,58,237,0.06)]"
                              : "bg-white/40 border-[#D8CBEB]/40 hover:border-purple-300 hover:bg-white/80"
                          }`}
                        >
                          {occupation === opt.id && (
                            <div className="absolute top-3 right-3 w-4.5 h-4.5 rounded-full bg-[#7C3AED] flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                          <div className={`p-2.5 rounded-xl shrink-0 w-fit transition-all duration-300 ${
                            occupation === opt.id ? "bg-[#7C3AED]/20" : "bg-[#F5F2FA]"
                          }`}>
                            {opt.icon}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-850 group-hover:text-[#7C3AED] transition-colors">
                              {opt.title}
                            </h3>
                            <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                              {opt.desc}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    custom={direction}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="space-y-6"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-[#7C3AED] font-bold uppercase tracking-wider block">STEP 2: ROADMAP TARGET</span>
                      <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                        <Compass className="w-6 h-6 text-[#7C3AED]" /> Choose Your Target Track
                      </h2>
                      <p className="text-xs text-slate-505">
                        Pick one of our 5 engineered tracks to design your learning curriculum.
                      </p>
                    </div>

                    {isModulesLoading ? (
                      <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <Loader2 className="w-8 h-8 text-[#7C3AED] animate-spin" />
                        <p className="text-xs font-mono text-slate-505">Fetching platform tracks...</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {modules?.map((m) => {
                          const meta = ROADMAP_DETAILS[m.name] || {
                            description: m.description,
                            tags: ["Module"],
                            iconName: "Code"
                          };
                          const isSelected = selectedModuleId === m.id;
                          
                          return (
                            <button
                              key={m.id}
                              onClick={() => {
                                setSelectedModuleId(m.id);
                                setSelectedModuleName(m.name);
                              }}
                              className={`w-full p-4 rounded-2xl border text-left transition-all duration-300 cursor-pointer flex gap-4 items-start relative overflow-hidden group ${
                                isSelected
                                  ? "bg-[#7C3AED]/5 border-[#7C3AED] shadow-[0_8px_20px_rgba(124,58,237,0.06)]"
                                  : "bg-white/40 border-[#D8CBEB]/40 hover:border-purple-300 hover:bg-white/80"
                              }`}
                            >
                              <div className={`p-3 rounded-xl shrink-0 transition-all duration-300 ${
                                isSelected ? "bg-[#7C3AED]/20" : "bg-[#F5F2FA]"
                              }`}>
                                {getRoadmapIcon(m.name)}
                              </div>

                              <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                  <h3 className="text-sm font-bold text-slate-855 group-hover:text-[#7C3AED] transition-colors">
                                    {m.name}
                                  </h3>
                                  {isSelected && (
                                    <span className="px-2 py-0.5 rounded-md bg-[#7C3AED] text-white font-mono text-[9px] font-bold">
                                      Selected
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-505 leading-relaxed">
                                  {meta.description}
                                </p>
                                <div className="flex flex-wrap gap-1.5 pt-1.5">
                                  {meta.tags.map((tag) => (
                                    <span key={tag} className="px-2 py-0.5 rounded-full bg-[#F5F2FA] border border-[#D8CBEB]/30 text-[9px] font-mono text-slate-600 font-semibold">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    custom={direction}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="space-y-6"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-[#7C3AED] font-bold uppercase tracking-wider block">STEP 3: BENCHMARK & TECH</span>
                      <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                        <Cpu className="w-6 h-6 text-[#7C3AED]" /> Experience Level & Tech Stack
                      </h2>
                      <p className="text-xs text-slate-505">
                        Self-rate your current track proficiency and customize your technical knowledge.
                      </p>
                    </div>

                    {/* Experience Level */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-505 font-mono">Self-Rated Proficiency</label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { level: "Beginner", desc: "No core project background" },
                          { level: "Intermediate", desc: "Built simple workflows" },
                          { level: "Advanced", desc: "Architected scale products" }
                        ].map((opt) => (
                          <button
                            key={opt.level}
                            type="button"
                            onClick={() => setExperience(opt.level)}
                            className={`p-3 rounded-xl font-mono text-xs font-semibold border transition-all text-center cursor-pointer flex flex-col justify-center gap-1 ${
                              experience === opt.level
                                ? "bg-[#7C3AED] border-[#7C3AED] text-white shadow-[0_0_12px_rgba(124,58,237,0.35)]"
                                : "bg-white/40 border-[#D8CBEB]/50 text-slate-500 hover:border-purple-300"
                            }`}
                          >
                            <span>{opt.level}</span>
                            <span className={`text-[8px] block font-normal leading-none mt-0.5 ${
                              experience === opt.level ? "text-purple-200" : "text-slate-400"
                            }`}>
                              {opt.desc}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Technologies Selector */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-505 font-mono">
                          Toggle Known Technologies ({selectedModuleName})
                        </label>
                        <span className="text-[10px] text-slate-450 font-mono">
                          {selectedSkills.length} selected
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto p-2 bg-[#F5F2FA]/50 border border-[#D8CBEB]/30 rounded-xl">
                        {/* Suggested recommended skills */}
                        {(ROADMAP_TECH_MAP[selectedModuleName] || []).map((skill) => {
                          const active = selectedSkills.includes(skill);
                          return (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => handleToggleSkill(skill)}
                              className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                                active
                                  ? "bg-[#7C3AED]/10 border-[#7C3AED] text-[#7C3AED]"
                                  : "bg-white/60 border-[#D8CBEB]/40 text-slate-650 hover:border-purple-300"
                              }`}
                            >
                              {active && <Check className="w-3 h-3 text-[#7C3AED]" />}
                              {skill}
                            </button>
                          );
                        })}

                        {/* Custom skills */}
                        {customSkills.map((skill) => (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => handleToggleSkill(skill)}
                            className="px-3 py-1.5 rounded-lg font-mono text-xs font-semibold border bg-[#7C3AED]/10 border-[#7C3AED] text-[#7C3AED] cursor-pointer flex items-center gap-1.5"
                          >
                            <Check className="w-3 h-3 text-[#7C3AED]" />
                            {skill}
                          </button>
                        ))}
                      </div>

                      {/* Add custom skill input */}
                      <form onSubmit={handleAddCustomSkill} className="flex gap-2">
                        <input
                          type="text"
                          value={newSkillInput}
                          onChange={(e) => setNewSkillInput(e.target.value)}
                          placeholder="Type other technology (e.g. Docker, Git, Go)..."
                          className="flex-1 px-4 py-2.5 rounded-xl border border-[#D8CBEB]/50 bg-white/40 text-slate-800 placeholder:text-slate-405 focus:outline-hidden focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent text-xs font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddCustomSkill()}
                          className="px-4 py-2.5 bg-white border border-[#D8CBEB]/60 hover:border-[#7C3AED] text-[#7C3AED] rounded-xl flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div
                    key="step4"
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="flex flex-col items-center justify-center py-6 text-center space-y-6"
                  >
                    {pipelineState.testGenerated !== "success" ? (
                      <>
                        {/* Glowing radar scan circle */}
                        <div className="relative">
                          <div className="absolute inset-0 rounded-full bg-[#7C3AED]/10 blur-xl animate-pulse" />
                          <div className="w-16 h-16 bg-gradient-to-tr from-[#7C3AED] to-[#8B5CF6] rounded-2xl flex items-center justify-center shadow-lg relative z-10 animate-spin [animation-duration:15s]">
                            <Cpu className="w-8 h-8 text-white animate-pulse" />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <h3 className="text-base font-bold text-slate-800 font-mono tracking-tight">
                            Seekh AI Calibration Active
                          </h3>
                          <p className="text-[11px] text-slate-505 max-w-sm mx-auto font-mono">
                            Calibrating personalized assessments...
                          </p>
                        </div>

                        {/* Progress Checklist */}
                        <div className="w-full bg-[#F5F2FA]/80 border border-[#D8CBEB]/50 rounded-2xl p-4 space-y-2.5 text-left font-mono">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-600">1. Sync profile parameters</span>
                            {pipelineState.profileSaved === "loading" && (
                              <Loader2 className="w-3.5 h-3.5 text-[#7C3AED] animate-spin" />
                            )}
                            {pipelineState.profileSaved === "success" && (
                              <Check className="w-3.5 h-3.5 text-emerald-600 font-extrabold" />
                            )}
                            {pipelineState.profileSaved === "error" && (
                              <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                            )}
                            {pipelineState.profileSaved === "idle" && (
                              <span className="w-2 h-2 rounded-full bg-slate-350" />
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-600">2. Generate diagnostic test</span>
                            {pipelineState.testGenerated === "loading" && (
                              <Loader2 className="w-3.5 h-3.5 text-[#7C3AED] animate-spin" />
                            )}
                            {pipelineState.testGenerated === "error" && (
                              <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                            )}
                            {pipelineState.testGenerated === "idle" && (
                              <span className="w-2 h-2 rounded-full bg-slate-355" />
                            )}
                          </div>
                        </div>

                        {/* Retry button if error */}
                        {(pipelineState.profileSaved === "error" || pipelineState.testGenerated === "error") && (
                          <div className="pt-1">
                            <button
                              onClick={handleFinishOnboarding}
                              className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer"
                            >
                              Retry Calibration
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {/* Success State / Start Assessment details */}
                        <div className="relative">
                          <div className="absolute inset-0 rounded-full bg-[#10B981]/15 blur-xl animate-pulse" />
                          <div className="w-16 h-16 bg-emerald-100 border border-emerald-250 text-emerald-650 rounded-full flex items-center justify-center mx-auto shadow-inner relative z-10">
                            <Check className="w-8 h-8 stroke-[3]" />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                            AI Calibration Complete!
                          </h3>
                          <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            Your customized diagnostic test is now ready to begin.
                          </p>
                        </div>

                        {/* Instructions Card */}
                        <div className="w-full bg-[#F5F2FA]/80 border border-[#D8CBEB]/50 rounded-2xl p-5 text-left space-y-3.5">
                          <h4 className="text-xs font-bold font-mono text-slate-700 uppercase tracking-wider">
                            Assessment Details & Instructions:
                          </h4>
                          
                          <div className="space-y-2.5 text-xs text-slate-600">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
                              <p><strong>Roadmap domain:</strong> {selectedModuleName}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
                              <p><strong>Benchmark level:</strong> {experience}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
                              <p><strong>Format:</strong> Multiple-Choice Questions (MCQs)</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
                              <p><strong>Impact:</strong> Correct/incorrect scores will optimize your learning modules.</p>
                            </div>
                          </div>

                          <div className="p-3 bg-amber-50 border border-amber-200/60 rounded-xl flex gap-2.5 items-start">
                            <AlertCircle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-amber-800 leading-normal font-sans">
                              Answer to the best of your ability. There is no time limit, but exiting or refreshing may void the session.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleLaunchAssessment}
                          className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-2xl font-mono text-xs font-bold transition-all shadow-[0_8px_20px_rgba(124,58,237,0.35)] cursor-pointer"
                        >
                          Start Diagnostic Assessment <ArrowRight className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Navigation Controls Footer */}
            {step < 4 && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#D8CBEB]/45">
                {step > 1 ? (
                  <button
                    onClick={handleBack}
                    className="flex items-center gap-1.5 px-4 py-2 border border-[#D8CBEB] rounded-xl text-slate-655 hover:bg-[#D8CBEB]/20 font-mono text-xs font-bold transition-all cursor-pointer bg-white/30"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                ) : (
                  <div />
                )}

                {step < 3 ? (
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl font-mono text-xs font-bold transition-all shadow-[0_8px_20px_rgba(124,58,237,0.2)] cursor-pointer"
                  >
                    Continue <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleFinishOnboarding}
                    className="flex items-center gap-1.5 px-6 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl font-mono text-xs font-bold transition-all shadow-[0_8px_20px_rgba(16,185,129,0.2)] cursor-pointer"
                  >
                    Start Diagnostics <Sparkles className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Cohesive Legal Footer */}
        <div className="text-center text-[10px] font-mono text-slate-400 uppercase tracking-widest pt-6">
          © {new Date().getFullYear()} SEEKH AI PLATFORM. ALL RIGHTS RESERVED • SECURED BY HS256 JWT
        </div>

      </div>

    </div>
  );
}

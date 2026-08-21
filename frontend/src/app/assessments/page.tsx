"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  Award,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  ClipboardList,
  CheckCircle,
  Brain,
  Network,
  Trophy,
  Calendar,
  Clock,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  X,
  FileText,
  HelpCircle,
  Check
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import confetti from "canvas-confetti";
import { useCompany } from "@/context/CompanyContext";
import {
  useGetTestDetailsQuery,
  useSubmitTestMutation,
  useGenerateSkillSummaryMutation,
  useGenerateRoadmapMutation,
  useGetTestHistoryQuery,
  useGenerateTestMutation,
  useGetModulesQuery,
} from "@/store/api/learningApi";

function AssessmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const testId = searchParams.get("test_id");
  const { isAuthenticated, hasCompletedOnboarding } = useCompany();

  // Queries & Mutations
  const { data: testData, isLoading: isTestLoading, error: testError } = useGetTestDetailsQuery(testId || "", {
    skip: !testId,
  });

  const { data: historyData, isLoading: isHistoryLoading } = useGetTestHistoryQuery(undefined, {
    skip: !!testId,
  });

  const { data: modules } = useGetModulesQuery();
  const [generateTest, { isLoading: isGeneratingTest }] = useGenerateTestMutation();
  const [submitTest, { isLoading: isSubmittingTest }] = useSubmitTestMutation();
  const [generateSummary, { isLoading: isGeneratingSummary }] = useGenerateSkillSummaryMutation();
  const [generateRoadmap, { isLoading: isGeneratingRoadmap }] = useGenerateRoadmapMutation();

  // Stepper & Confirmation States
  const [showRetakeForm, setShowRetakeForm] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<any | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Pipeline loading transitions
  const [pipelineStep, setPipelineStep] = useState<"submitting" | "analyzing" | "mapping" | "idle">("idle");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else if (!hasCompletedOnboarding && !testId) {
      // Allow taking onboarding-generated test even if onboarding complete state is false in store
      router.push("/onboarding");
    }
  }, [isAuthenticated, hasCompletedOnboarding, testId, router]);

  const handleSelectOption = (questionId: string, option: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const handleStartPath = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModuleId) {
      toast.error("Please select a learning module.");
      return;
    }

    try {
      const testSession = await generateTest({
        module_id: selectedModuleId,
        difficulty
      }).unwrap();

      toast.success("Diagnostic assessment ready! Launching diagnostic test...");
      setShowRetakeForm(false);
      setSelectedAnswers({});
      setTestResult(null);
      setCurrentQuestionIndex(0);
      router.push(`/assessments?test_id=${testSession.test_id}`);
    } catch (err: any) {
      toast.error(err.data?.message || err.message || "Failed to start assessment.");
    }
  };

  const handleNextStep = () => {
    if (!testData?.questions) return;
    const currentQuestion = testData.questions[currentQuestionIndex];
    if (!selectedAnswers[currentQuestion.id]) {
      toast.error("Please select an option before proceeding.");
      return;
    }

    if (currentQuestionIndex < testData.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // On final step, submit
      handleSubmit();
    }
  };

  const handlePrevStep = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!testId || !testData?.questions) return;

    const questionsCount = testData.questions.length;
    const answeredCount = Object.keys(selectedAnswers).length;

    if (answeredCount < questionsCount) {
      toast.error(`Please answer all ${questionsCount} questions before submitting.`);
      return;
    }

    try {
      setPipelineStep("submitting");
      
      const answersArray = Object.entries(selectedAnswers).map(([qId, val]) => ({
        question_id: qId,
        selected_answer: val,
      }));

      const scoreResult = await submitTest({
        testId,
        answers: answersArray,
      }).unwrap();

      setTestResult(scoreResult);
      toast.success("Assessment submitted successfully!");
      setPipelineStep("idle");
    } catch (err: any) {
      setPipelineStep("idle");
      toast.error(err.data?.message || err.message || "Failed to submit assessment.");
    }
  };

  const handlePipelineTrigger = async () => {
    if (!testId) return;

    try {
      // Step 1: Generate Skill Summary
      setPipelineStep("analyzing");
      const summaryRes = await generateSummary({ test_id: testId }).unwrap();
      toast.success("Skill summary analyzed! Strengths identified.");

      // Step 2: Generate learning roadmap
      setPipelineStep("mapping");
      const roadmapRes = await generateRoadmap({ skill_summary_id: summaryRes.summary.id }).unwrap();
      
      setPipelineStep("idle");
      toast.success("Personalized learning roadmap completed!");

      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });

      // Redirect to roadmap
      setTimeout(() => {
        router.push(`/roadmaps?id=${roadmapRes.roadmap.id}`);
      }, 1500);
    } catch (err: any) {
      setPipelineStep("idle");
      toast.error(err.data?.message || err.message || "Learning path synthesis failed.");
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case "easy": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "medium": return "bg-amber-100 text-amber-700 border-amber-200";
      case "hard": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-slate-100 text-slate-650 border-slate-200";
    }
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-slate-400";
    if (score >= 80) return "text-emerald-600";
    if (score >= 50) return "text-amber-600";
    return "text-red-650";
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Directional sliding transitions
  const stepVariants = {
    enter: { x: 50, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 }
  };

  // 1. NO ACTIVE TEST: View History/Reports List
  if (!testId) {
    const history = historyData?.history || [];
    const completedTests = history.filter((t) => t.status === "completed");
    const avgScore = completedTests.length > 0
      ? Math.round(completedTests.reduce((sum, t) => sum + (t.score || 0), 0) / completedTests.length)
      : 0;

    return (
      <div className="min-h-screen bg-[#F5F2FA] text-slate-900 relative font-sans">
        
        {/* Soft Background Accents */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-200/40 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-200/40 rounded-full blur-[140px] pointer-events-none" />

        {/* Minimal Header */}
        <header className="sticky top-0 z-30 bg-[#F5F2FA]/80 backdrop-blur-md border-b border-[#D8CBEB]/50 px-6 py-4 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-slate-950 hover:border-slate-300 text-xs font-mono font-semibold transition-all shadow-xs group cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
            <span>Dashboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-purple-900 text-white flex items-center justify-center font-bold text-xs">
              <Trophy className="w-3.5 h-3.5" />
            </div>
            <span className="text-slate-950 font-black text-sm tracking-wider font-mono uppercase">SEEKH</span>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="max-w-4xl mx-auto p-6 md:p-10 relative z-10 space-y-8">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="px-2.5 py-1 bg-purple-100 text-purple-700 text-[10px] font-extrabold font-mono rounded-full border border-purple-200 uppercase">
                SKILL DIAGNOSTICS
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-mono text-slate-900 mt-3">
                Test Reports
              </h1>
              <p className="text-xs text-slate-500 font-mono mt-1">
                A complete record of your diagnostic assessments and performance.
              </p>
            </div>
            {!showRetakeForm && (
              <button
                onClick={() => setShowRetakeForm(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-mono text-xs font-bold transition-all shadow-md hover:shadow-lg cursor-pointer shrink-0"
              >
                <Sparkles className="w-4 h-4 animate-pulse" /> Retake Assessment
              </button>
            )}
          </div>

          {/* Start New Assessment Modal Form */}
          {showRetakeForm && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-[#D8CBEB]/50 rounded-3xl p-6 md:p-8 shadow-md"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-bold font-mono text-slate-800">Retake Skill Diagnostics</h2>
                </div>
                <button
                  onClick={() => setShowRetakeForm(false)}
                  className="px-3.5 py-1.5 text-slate-450 hover:text-slate-700 text-xs font-mono border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleStartPath} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 font-mono">Choose Course Domain</label>
                  <select
                    value={selectedModuleId}
                    onChange={(e) => setSelectedModuleId(e.target.value)}
                    className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-hidden font-mono text-xs bg-slate-50/10 cursor-pointer text-slate-750 font-semibold"
                  >
                    <option value="">-- Select Module --</option>
                    {modules?.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-650 font-mono">Self-Rated Difficulty</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(["easy", "medium", "hard"] as const).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setDifficulty(level)}
                        className={`p-3 rounded-2xl font-mono text-xs capitalize font-semibold border transition-all cursor-pointer ${
                          difficulty === level
                            ? "bg-purple-600 text-white border-purple-600 shadow-md"
                            : "bg-white text-slate-650 border-slate-200 hover:border-purple-300"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isGeneratingTest}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-mono text-xs font-bold transition-all shadow-md cursor-pointer disabled:bg-slate-350"
                >
                  {isGeneratingTest ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Synthesizing test queries...
                    </>
                  ) : (
                    <>
                      Begin Diagnostics Retake <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {/* Historical Statistics Overview */}
          {!isHistoryLoading && history.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white border border-[#D8CBEB]/40 rounded-2xl p-4 text-center shadow-xs">
                <span className="text-2xl font-black text-purple-600 block">{history.length}</span>
                <span className="text-[10px] text-slate-450 font-mono uppercase font-bold">Total Tests</span>
              </div>
              <div className="bg-white border border-[#D8CBEB]/40 rounded-2xl p-4 text-center shadow-xs">
                <span className="text-2xl font-black text-emerald-600 block">{completedTests.length}</span>
                <span className="text-[10px] text-slate-455 font-mono uppercase font-bold">Completed</span>
              </div>
              <div className="bg-white border border-[#D8CBEB]/40 rounded-2xl p-4 text-center shadow-xs">
                <span className={`text-2xl font-black block ${getScoreColor(avgScore)}`}>{avgScore}%</span>
                <span className="text-[10px] text-slate-450 font-mono uppercase font-bold">Avg Score</span>
              </div>
            </div>
          )}

          {/* Test History List */}
          {isHistoryLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-3" />
              <p className="text-xs font-mono text-slate-400">Loading your test history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white border border-[#D8CBEB]/40 rounded-3xl p-8">
              <ClipboardList className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-sm font-mono text-slate-500 mb-1">No assessments attempted yet.</p>
              <p className="text-xs font-mono text-slate-400 mb-6">Head to your dashboard to start a skill diagnostic test.</p>
              <button
                onClick={() => router.push("/dashboard")}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-mono text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Go to Dashboard
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((test, idx) => (
                <motion.div
                  key={test.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white border border-[#D8CBEB]/40 rounded-2xl p-5 flex items-center justify-between gap-4 hover:border-purple-300 hover:shadow-xs transition-all"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      test.status === "completed" ? "bg-purple-50" : "bg-slate-50"
                    }`}>
                      {test.status === "completed"
                        ? <Trophy className="w-5 h-5 text-purple-600" />
                        : <Clock className="w-5 h-5 text-slate-400" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold font-mono text-slate-800 truncate">
                        {test.module_name || "Unknown Module"}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border capitalize ${getDifficultyColor(test.difficulty)}`}>
                          {test.difficulty}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
                          <Calendar className="w-3 h-3" />
                          {formatDate(test.created_at)}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {test.total_questions} Questions
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 font-mono">
                    {test.status === "completed" && test.score !== null ? (
                      <div className="text-right">
                        <span className={`text-xl font-black ${getScoreColor(test.score)}`}>
                          {Math.round(test.score)}%
                        </span>
                        <p className="text-[9px] text-slate-400 uppercase">score</p>
                      </div>
                    ) : (
                      <button
                        onClick={() => router.push(`/assessments?test_id=${test.id}`)}
                        className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        Resume
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  // 2. ACTIVE TEST: Display Single-Question Stepper Quiz
  if (isTestLoading) {
    return (
      <div className="min-h-screen bg-[#F5F2FA] flex flex-col justify-center items-center font-sans">
        <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
        <p className="text-sm font-mono text-slate-500">Compiling diagnostic questions...</p>
      </div>
    );
  }

  if (testError) {
    return (
      <div className="min-h-screen bg-[#F5F2FA] flex flex-col justify-center items-center p-6 text-center font-sans">
        <ClipboardList className="w-12 h-12 text-red-400 mb-4 animate-bounce" />
        <p className="text-sm font-mono text-red-500 font-bold mb-2">Error loading test data.</p>
        <p className="text-xs font-mono text-slate-500 max-w-sm mb-6">The diagnostic test session may have expired or is invalid.</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-mono text-xs font-bold transition-all shadow-md cursor-pointer"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const questions = testData?.questions || [];
  const questionsCount = questions.length;
  const currentQuestion = questions[currentQuestionIndex];
  const progressPercent = questionsCount > 0 ? Math.round((currentQuestionIndex / questionsCount) * 100) : 0;

  return (
    <div data-lenis-prevent className="min-h-screen bg-[#F5F2FA] text-slate-900 relative font-sans flex flex-col justify-between overflow-x-hidden">
      <Toaster position="top-right" />

      {/* Background visual light blooms */}
      <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-[#D8CBEB]/40 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-purple-200/20 rounded-full blur-[140px] pointer-events-none" />

      {/* Floating Loading Pipelines Overlay */}
      <AnimatePresence>
        {pipelineStep !== "idle" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col justify-center items-center text-white"
          >
            <div className="bg-[#1E192B] border border-white/5 p-8 rounded-3xl text-center space-y-6 max-w-sm w-full mx-4 shadow-2xl relative">
              {pipelineStep === "submitting" && (
                <>
                  <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto" />
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-bold font-mono">Scoring assessment answers...</h4>
                    <p className="text-[10px] text-slate-400 font-mono">Calibrating scores...</p>
                  </div>
                </>
              )}
              {pipelineStep === "analyzing" && (
                <>
                  <Brain className="w-12 h-12 text-purple-400 animate-pulse mx-auto" />
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-bold font-mono">Analyzing skill metrics...</h4>
                    <p className="text-[10px] text-slate-400 font-mono">Comparing strengths and weaknesses...</p>
                  </div>
                </>
              )}
              {pipelineStep === "mapping" && (
                <>
                  <Network className="w-12 h-12 text-indigo-400 animate-spin mx-auto" />
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-bold font-mono">Plotting learning modules...</h4>
                    <p className="text-[10px] text-slate-400 font-mono">Assembling personalized tasks...</p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Exit Confirmation Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 text-slate-900"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="bg-white border border-[#D8CBEB]/50 rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl space-y-6"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-50 text-red-500 rounded-2xl shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold font-mono">Exit Diagnostic Test?</h3>
                  <p className="text-xs text-slate-500 leading-normal">
                    Are you sure you want to exit? Your current answers will not be saved, and you will need to restart this diagnostic test later.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 py-3 border border-[#D8CBEB] text-slate-650 hover:bg-slate-50 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowExitConfirm(false);
                    router.push("/dashboard");
                  }}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-mono text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Exit & Discard
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Bar */}
      <header className="bg-white/70 backdrop-blur-md border-b border-[#D8CBEB]/40 px-6 py-4 flex items-center justify-between relative z-10 shrink-0">
        <button
          onClick={() => {
            if (testResult) {
              router.push("/dashboard");
            } else {
              setShowExitConfirm(true);
            }
          }}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white border border-[#D8CBEB]/50 text-slate-650 hover:text-red-650 hover:border-red-300 text-xs font-mono font-semibold transition-all shadow-xs group cursor-pointer"
        >
          <X className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-500 transition-colors" />
          <span>{testResult ? "Exit Workspace" : "Exit Test"}</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-purple-900 text-white flex items-center justify-center font-bold text-xs">
            <ClipboardList className="w-3.5 h-3.5" />
          </div>
          <span className="text-slate-950 font-black text-sm tracking-wider font-mono uppercase">SEEKH</span>
        </div>
      </header>

      {/* Quiz Body Stepper Panel */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-6 py-10 flex flex-col justify-center relative z-10">
        
        {!testResult ? (
          /* ACTIVE QUESTIONS STAGE */
          questionsCount > 0 && currentQuestion ? (
            <div className="space-y-6">
              
              {/* Stepper Header (Progress Bar) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between font-mono text-[10px] text-slate-450 font-bold uppercase tracking-wider">
                  <span>{testData?.module_name || "Diagnostic Quiz"}</span>
                  <span>Question {currentQuestionIndex + 1} of {questionsCount}</span>
                </div>
                <div className="w-full h-2 bg-slate-200/60 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-purple-600 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Distraction-Free Question Card with Slide transition */}
              <div className="bg-white border border-[#D8CBEB]/40 rounded-3xl p-6 md:p-8 shadow-[0_16px_40px_rgba(70,40,110,0.04)] min-h-[300px] flex flex-col justify-between relative overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentQuestion.id}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="space-y-6 flex-1 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      {/* Badge identifier */}
                      <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-[10px] font-extrabold font-mono rounded-full border border-purple-100 uppercase">
                        Question {currentQuestionIndex + 1}
                      </span>
                      
                      <h3 className="text-base md:text-lg font-extrabold text-slate-800 leading-relaxed font-sans">
                        {currentQuestion.question}
                      </h3>
                    </div>

                    {/* MCQs options layout */}
                    <div className="grid grid-cols-1 gap-3 pt-4">
                      {currentQuestion.options.map((opt: string, optIdx: number) => {
                        const isSelected = selectedAnswers[currentQuestion.id] === opt;
                        const keyboardLetter = String.fromCharCode(65 + optIdx); // A, B, C, D...
                        
                        return (
                          <button
                            key={opt}
                            onClick={() => handleSelectOption(currentQuestion.id, opt)}
                            className={`p-4.5 rounded-2xl text-left border transition-all duration-200 cursor-pointer flex gap-4 items-center group relative overflow-hidden ${
                              isSelected
                                ? "bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-950/10"
                                : "bg-white/50 border-[#D8CBEB]/40 text-slate-700 hover:border-purple-400 hover:bg-purple-50/5"
                            }`}
                          >
                            <span className={`w-6 h-6 rounded-lg font-mono font-bold text-[10px] flex items-center justify-center shrink-0 transition-all ${
                              isSelected
                                ? "bg-white/20 text-white"
                                : "bg-slate-100 text-slate-500 group-hover:bg-purple-100 group-hover:text-purple-700"
                            }`}>
                              {keyboardLetter}
                            </span>
                            <span className="text-xs md:text-sm font-semibold font-sans">{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation Footer */}
              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={handlePrevStep}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center gap-1.5 px-4.5 py-2.5 border border-[#D8CBEB]/60 rounded-xl text-slate-655 hover:bg-slate-100 font-mono text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-white/40 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>

                <button
                  onClick={handleNextStep}
                  className={`flex items-center gap-1.5 px-5.5 py-3 rounded-xl font-mono text-xs font-bold transition-all shadow-md cursor-pointer ${
                    currentQuestionIndex === questionsCount - 1
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-950/10"
                      : "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-950/10"
                  }`}
                >
                  {currentQuestionIndex === questionsCount - 1 ? (
                    <>
                      Submit Assessment <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Next Question <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-4" />
              <p className="text-xs font-mono text-slate-500">Formulating test environment...</p>
            </div>
          )
        ) : (
          /* TEST SCORED / RESULT PIPELINE STAGE */
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-[#D8CBEB]/40 rounded-3xl p-8 shadow-[0_24px_60px_rgba(70,40,110,0.06)] text-center space-y-6 max-w-md mx-auto"
          >
            <div className="w-16 h-16 bg-emerald-100 text-emerald-650 rounded-full flex items-center justify-center mx-auto shadow-inner relative z-10">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-extrabold text-slate-800 font-mono tracking-tight">Diagnostics Scored!</h2>
              <p className="text-xs text-slate-400 font-mono">
                Your responses have been calibrated.
              </p>
            </div>

            {/* Score box */}
            <div className="bg-purple-55/10 border border-[#D8CBEB]/30 rounded-2xl p-6 max-w-xs mx-auto grid grid-cols-2 gap-4 divide-x divide-[#D8CBEB]/40 font-mono shadow-inner">
              <div>
                <span className="text-2xl font-black text-purple-600 block">{testResult.score}%</span>
                <span className="text-[9px] text-slate-400 uppercase font-bold">percentage</span>
              </div>
              <div>
                <span className="text-2xl font-black text-purple-600 block">
                  {testResult.correct_answers} / {testResult.total_questions}
                </span>
                <span className="text-[9px] text-slate-400 uppercase font-bold">correct</span>
              </div>
            </div>

            {/* AI synthesis action button */}
            <div className="pt-4 max-w-sm mx-auto">
              <button
                onClick={handlePipelineTrigger}
                disabled={isGeneratingSummary || isGeneratingRoadmap}
                className="w-full flex items-center justify-center gap-2 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-mono text-xs font-bold transition-all shadow-md hover:shadow-lg cursor-pointer disabled:bg-slate-350"
              >
                {isGeneratingSummary || isGeneratingRoadmap ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Synthesizing path...
                  </>
                ) : (
                  <>
                    Analyze Skills & Generate Roadmap <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer bar */}
      <footer className="text-center text-[10px] font-mono text-slate-400 uppercase tracking-widest py-6 relative z-10 shrink-0 border-t border-[#D8CBEB]/15">
        © {new Date().getFullYear()} SEEKH AI PLATFORM. ALL RIGHTS RESERVED • SECURED BY HS256 JWT
      </footer>
    </div>
  );
}

export default function AssessmentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F5F2FA] flex justify-center items-center">
        <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
      </div>
    }>
      <AssessmentContent />
    </Suspense>
  );
}

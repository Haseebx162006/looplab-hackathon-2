"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  Award,
  BookOpen,
  ArrowRight,
  Loader2,
  Sparkles,
  ClipboardList,
  CheckCircle,
  Brain,
  Network,
  Trophy,
  BarChart3,
  Calendar,
  Clock,
  ChevronRight,
  FileText,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import confetti from "canvas-confetti";
import { HoverSidebar } from "@/components/layout/HoverSidebar";
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

  const { data: testData, isLoading: isTestLoading, error: testError } = useGetTestDetailsQuery(testId || "", {
    skip: !testId,
  });

  const { data: historyData, isLoading: isHistoryLoading } = useGetTestHistoryQuery(undefined, {
    skip: !!testId,
  });

  const { data: modules } = useGetModulesQuery();
  const [generateTest, { isLoading: isGeneratingTest }] = useGenerateTestMutation();

  const [showRetakeForm, setShowRetakeForm] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  const [submitTest, { isLoading: isSubmittingTest }] = useSubmitTestMutation();
  const [generateSummary, { isLoading: isGeneratingSummary }] = useGenerateSkillSummaryMutation();
  const [generateRoadmap, { isLoading: isGeneratingRoadmap }] = useGenerateRoadmapMutation();

  // Selected Answers State: question_id -> selected_answer
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<any | null>(null);

  // Pipeline loading messages
  const [pipelineStep, setPipelineStep] = useState<"submitting" | "analyzing" | "mapping" | "idle">("idle");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else if (!hasCompletedOnboarding) {
      router.push("/onboarding");
    }
  }, [isAuthenticated, hasCompletedOnboarding, router]);

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
      router.push(`/assessments?test_id=${testSession.test_id}`);
    } catch (err: any) {
      toast.error(err.data?.message || err.message || "Failed to start assessment.");
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
      default: return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-slate-400";
    if (score >= 80) return "text-emerald-600";
    if (score >= 50) return "text-amber-600";
    return "text-red-600";
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (!testId) {
    const history = historyData?.history || [];
    const completedTests = history.filter((t) => t.status === "completed");
    const avgScore = completedTests.length > 0
      ? Math.round(completedTests.reduce((sum, t) => sum + (t.score || 0), 0) / completedTests.length)
      : 0;

    return (
      <div className="min-h-screen bg-[#F5F2FA] flex font-sans">
        <HoverSidebar />
        <Toaster position="top-right" />
        <main className="flex-1 ml-0 md:ml-20 p-6 md:p-10 pt-20 md:pt-10 max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
                className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-mono text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
              >
                <Sparkles className="w-4 h-4 animate-pulse" /> Retake Assessment
              </button>
            )}
          </div>

          {/* Retake Assessment Form Card */}
          {showRetakeForm && (
            <div className="bg-white border border-purple-100 rounded-3xl p-6 md:p-8 shadow-xs mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-bold font-mono">Retake Skill Diagnostics</h2>
                </div>
                <button
                  onClick={() => setShowRetakeForm(false)}
                  className="px-3 py-1.5 text-slate-400 hover:text-slate-650 text-xs font-mono border border-slate-250 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleStartPath} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-650 font-mono">Choose Course Domain</label>
                  <select
                    value={selectedModuleId}
                    onChange={(e) => setSelectedModuleId(e.target.value)}
                    className="w-full p-4 border border-purple-100 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-hidden font-mono text-xs bg-purple-50/5 cursor-pointer text-slate-700 font-semibold"
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
                            ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                            : "bg-white text-slate-650 border-purple-50 hover:border-purple-200"
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
                  className="w-full flex items-center justify-center gap-2 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-mono text-xs font-bold transition-all shadow-xs cursor-pointer disabled:bg-slate-350"
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
            </div>
          )}

          {/* Stats Row */}
          {!isHistoryLoading && history.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-white border border-purple-100 rounded-2xl p-4 text-center">
                <span className="text-2xl font-black text-purple-600 block">{history.length}</span>
                <span className="text-[10px] text-slate-400 font-mono uppercase">Total Tests</span>
              </div>
              <div className="bg-white border border-purple-100 rounded-2xl p-4 text-center">
                <span className="text-2xl font-black text-emerald-600 block">{completedTests.length}</span>
                <span className="text-[10px] text-slate-400 font-mono uppercase">Completed</span>
              </div>
              <div className="bg-white border border-purple-100 rounded-2xl p-4 text-center">
                <span className={`text-2xl font-black block ${getScoreColor(avgScore)}`}>{avgScore}%</span>
                <span className="text-[10px] text-slate-400 font-mono uppercase">Avg Score</span>
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
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <ClipboardList className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-sm font-mono text-slate-500 mb-1">No assessments attempted yet.</p>
              <p className="text-xs font-mono text-slate-400 mb-6">Head to your dashboard to start a skill diagnostic test.</p>
              <button
                onClick={() => router.push("/dashboard")}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-mono text-xs font-bold transition-all shadow-sm cursor-pointer"
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
                  className="bg-white border border-purple-50 rounded-2xl p-5 flex items-center justify-between gap-4 hover:border-purple-200 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      test.status === "completed" ? "bg-purple-100" : "bg-slate-100"
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
                          {test.total_questions} Qs
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    {test.status === "completed" && test.score !== null ? (
                      <div className="text-right">
                        <span className={`text-xl font-black font-mono ${getScoreColor(test.score)}`}>
                          {Math.round(test.score)}%
                        </span>
                        <p className="text-[10px] text-slate-400 font-mono">score</p>
                      </div>
                    ) : (
                      <span className="px-2 py-1 bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-bold font-mono rounded-lg">
                        In Progress
                      </span>
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

  if (isTestLoading) {
    return (
      <div className="min-h-screen bg-[#F5F2FA] flex font-sans">
        <HoverSidebar />
        <main className="flex-1 ml-0 md:ml-20 p-10 pt-24 md:pt-10 flex flex-col justify-center items-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
          <p className="text-sm font-mono text-slate-500">Compiling diagnostic questions...</p>
        </main>
      </div>
    );
  }

  if (testError) {
    return (
      <div className="min-h-screen bg-[#F5F2FA] flex font-sans">
        <HoverSidebar />
        <main className="flex-1 ml-0 md:ml-20 p-10 pt-24 md:pt-10 flex flex-col justify-center items-center">
          <ClipboardList className="w-12 h-12 text-red-300 mb-4" />
          <p className="text-sm font-mono text-red-500">Error loading test data. The session may have expired.</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-mono text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Dashboard
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F2FA] flex font-sans">
      <HoverSidebar />
      <Toaster position="top-right" />

      {/* Main container */}
      <main className="flex-1 ml-0 md:ml-20 p-6 md:p-10 pt-20 md:pt-10 max-w-4xl mx-auto overflow-x-hidden relative">
        {/* Loading Pipelines Overlay */}
        <AnimatePresence>
          {pipelineStep !== "idle" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-[#1c1921]/80 backdrop-blur-md flex flex-col justify-center items-center text-white"
            >
              <div className="bg-[#1c1921] border border-slate-800 p-8 rounded-3xl text-center space-y-6 max-w-sm w-full mx-4 shadow-2xl">
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
                      <h4 className="text-sm font-bold font-mono">Plotting modules...</h4>
                      <p className="text-[10px] text-slate-400 font-mono">Assembling personalized tasks...</p>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mb-8">
          <span className="px-2.5 py-1 bg-purple-100 text-purple-700 text-[10px] font-extrabold font-mono rounded-full border border-purple-200 uppercase">
            DIAGNOSTIC TEST SESSION
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-mono text-slate-900 mt-3">
            Skill Diagnostics
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Answer the following questions carefully. Your responses will calibrate your roadmap.
          </p>
        </div>

        {!testResult ? (
          /* Test Questions Form */
          <div className="space-y-8">
            {testData.questions.map((q: any, qIndex: number) => (
              <div key={q.id} className="bg-white border border-purple-100 rounded-3xl p-6 shadow-xs space-y-4">
                <div className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                    {qIndex + 1}
                  </span>
                  <h3 className="text-sm font-bold font-mono text-slate-800 leading-relaxed">
                    {q.question}
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-9">
                  {q.options.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => handleSelectOption(q.id, opt)}
                      className={`p-4 rounded-2xl text-left font-mono text-xs border transition-all cursor-pointer ${
                        selectedAnswers[q.id] === opt
                          ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                          : "bg-white text-slate-600 border-purple-50 hover:border-purple-200 hover:bg-purple-50/5"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <button
              onClick={handleSubmit}
              disabled={isSubmittingTest}
              className="w-full flex items-center justify-center gap-2 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-mono text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              Submit Assessment answers <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Assessment Results Scored Screen */
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-purple-100 rounded-3xl p-8 shadow-md text-center space-y-6"
          >
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold font-mono text-slate-800">Diagnostics Scored!</h2>
              <p className="text-xs text-slate-400 font-mono">
                Your response profiles have been collected.
              </p>
            </div>

            <div className="bg-purple-50/30 border border-purple-50 rounded-2xl p-6 max-w-xs mx-auto grid grid-cols-2 gap-4 divide-x divide-purple-100 font-mono">
              <div>
                <span className="text-2xl font-black text-purple-600 block">{testResult.score}%</span>
                <span className="text-[10px] text-slate-400 uppercase">percentage</span>
              </div>
              <div>
                <span className="text-2xl font-black text-purple-600 block">
                  {testResult.correct_answers} / {testResult.total_questions}
                </span>
                <span className="text-[10px] text-slate-400 uppercase">correct</span>
              </div>
            </div>

            <div className="pt-4 max-w-sm mx-auto">
              <button
                onClick={handlePipelineTrigger}
                disabled={isGeneratingSummary || isGeneratingRoadmap}
                className="w-full flex items-center justify-center gap-2 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-mono text-xs font-bold transition-all shadow-xs cursor-pointer disabled:bg-slate-350"
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

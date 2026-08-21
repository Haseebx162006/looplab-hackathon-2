"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Award,
  ChevronRight,
  TrendingUp,
  Loader2,
  FileCheck,
  CheckCircle,
  XCircle,
  HelpCircle,
  ChevronDown,
  Trash2,
  Lock,
  ArrowRight,
  UserCheck,
  GraduationCap,
  Link2,
  Plus,
  ExternalLink,
  Brain,
  Network,
  Check,
  Clock,
  Play,
  Send,
  Calendar,
  AlertCircle
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import toast, { Toaster } from "react-hot-toast";
import confetti from "canvas-confetti";
import { HoverSidebar } from "@/components/layout/HoverSidebar";
import { useCompany } from "@/context/CompanyContext";
import {
  useGetProgressQuery,
  useGetRoadmapDetailsQuery,
  useAbandonRoadmapMutation,
  useSubmitTaskMutation,
  useGetTaskSubmissionsQuery,
  useGetTestHistoryQuery,
  useGenerateSkillSummaryMutation,
  useGenerateRoadmapMutation
} from "@/store/api/learningApi";

function RoadmapContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryRoadmapId = searchParams.get("id");
  const { isAuthenticated, hasCompletedOnboarding } = useCompany();

  const { data: progress } = useGetProgressQuery(undefined, {
    skip: !isAuthenticated,
  });

  // Determine active roadmap id
  const activeRoadmapId = queryRoadmapId || progress?.roadmaps?.find((r) => r.status === "in_progress")?.roadmap_id;

  const { data: roadmapDetails, isLoading: isRoadmapLoading, refetch: refetchRoadmap } = useGetRoadmapDetailsQuery(
    activeRoadmapId || "",
    {
      skip: !activeRoadmapId,
    }
  );

  const [abandonRoadmap, { isLoading: isAbandoning }] = useAbandonRoadmapMutation();
  const [submitTask, { isLoading: isSubmittingTask }] = useSubmitTaskMutation();

  // Load test history for auto-generation check
  const { data: testHistory } = useGetTestHistoryQuery(undefined, {
    skip: !isAuthenticated,
  });

  const [generateSummary] = useGenerateSkillSummaryMutation();
  const [generateRoadmap] = useGenerateRoadmapMutation();

  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<"analyzing" | "mapping" | "idle">("idle");

  // Selected task state for details panel
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [taskSubmissionText, setTaskSubmissionText] = useState("");
  const [links, setLinks] = useState<string[]>([]);
  const [newLink, setNewLink] = useState("");

  // Submissions history for the selected task
  const { data: taskSubmissions, refetch: refetchSubmissions } = useGetTaskSubmissionsQuery(
    selectedTask?.id || "",
    {
      skip: !selectedTask,
    }
  );

  const hasPendingSubmission = taskSubmissions?.some((sub: any) => sub.status === "pending_review");

  const activeProgressRoadmap = progress?.roadmaps?.find((r) => r.roadmap_id === activeRoadmapId);

  const roadmapStats = React.useMemo(() => {
    if (!roadmapDetails || !roadmapDetails.sections) {
      return { total: 0, completed: 0, percentage: 0 };
    }
    let total = 0;
    let completed = 0;
    roadmapDetails.sections.forEach((sec) => {
      sec.tasks?.forEach((task) => {
        total++;
        if (task.status === "completed") {
          completed++;
        }
      });
    });
    return {
      total,
      completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }, [roadmapDetails]);

  const learningCurveData = React.useMemo(() => {
    if (!roadmapDetails || !roadmapDetails.sections) return [];
    let completedRunningTotal = 0;
    return roadmapDetails.sections.map((sec, index) => {
      const secCompleted = sec.tasks?.filter(t => t.status === "completed").length || 0;
      completedRunningTotal += secCompleted;
      return {
        name: `Module ${index + 1}`,
        title: sec.title.length > 20 ? sec.title.slice(0, 20) + "..." : sec.title,
        Competence: completedRunningTotal,
      };
    });
  }, [roadmapDetails]);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("seekh_auth_token") : null;
    if (!token) {
      router.push("/login");
    } else if (!hasCompletedOnboarding) {
      router.push("/onboarding");
    }
  }, [hasCompletedOnboarding, router]);

  // Automatic roadmap generation effect
  useEffect(() => {
    if (!isAuthenticated || !progress || !testHistory || isAutoGenerating) return;

    // Check if there is an active roadmap
    const hasActiveRoadmap = progress.roadmaps?.some((r) => r.status === "in_progress");
    if (hasActiveRoadmap) return;

    // Find the latest completed test
    const latestCompletedTest = testHistory.history?.find((t) => t.status === "completed");
    if (!latestCompletedTest) return;

    // Check if a roadmap already exists for this module track (in any status)
    const roadmapExists = progress.roadmaps?.some(
      (r) => r.module_name.toLowerCase() === latestCompletedTest.module_name.toLowerCase()
    );
    if (roadmapExists) return;

    // Trigger auto-generation pipeline!
    const runPipeline = async () => {
      try {
        setIsAutoGenerating(true);

        // Step 1: Generate Skill Summary
        setGenerationStep("analyzing");
        const summaryRes = await generateSummary({ test_id: latestCompletedTest.id }).unwrap();

        // Step 2: Generate Roadmap
        setGenerationStep("mapping");
        const roadmapRes = await generateRoadmap({ skill_summary_id: summaryRes.summary.id }).unwrap();

        setGenerationStep("idle");
        setIsAutoGenerating(false);
        toast.success("Personalized learning roadmap completed!");

        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });

        router.push(`/roadmaps?id=${roadmapRes.roadmap.id}`);
      } catch (err: any) {
        setGenerationStep("idle");
        setIsAutoGenerating(false);
        toast.error(err.data?.message || err.message || "Failed to auto-synthesize roadmap.");
      }
    };

    runPipeline();
  }, [isAuthenticated, progress, testHistory, isAutoGenerating, generateSummary, generateRoadmap, router]);

  // If a task is selected, refetch its submissions history
  useEffect(() => {
    if (selectedTask) {
      refetchSubmissions();
      setTaskSubmissionText("");
      setLinks([]);
      setNewLink("");
    }
  }, [selectedTask, refetchSubmissions]);

  // Monitor if roadmap gets completed after task approval
  useEffect(() => {
    if (roadmapDetails && roadmapDetails.status === "completed") {
      confetti({
        particleCount: 100,
        spread: 60,
        origin: { y: 0.8 }
      });
    }
  }, [roadmapDetails]);

  const handleAbandon = async () => {
    if (!activeRoadmapId) return;

    if (!confirm("Are you sure you want to abandon this learning path? All progress will be frozen.")) {
      return;
    }

    try {
      await abandonRoadmap(activeRoadmapId).unwrap();
      toast.success("Learning roadmap abandoned.");
      setSelectedTask(null);
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.data?.error || err.data?.message || err.message || "Failed to abandon learning path.");
    }
  };

  const handleAddLink = () => {
    if (!newLink.trim()) return;
    let url = newLink.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }
    setLinks((prev) => [...prev, url]);
    setNewLink("");
  };

  const handleRemoveLink = (idx: number) => {
    setLinks((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    const hasText = !!taskSubmissionText.trim();
    const hasLinks = links.length > 0;
    if (!hasText && !hasLinks) {
      toast.error("Please provide submission content or links.");
      return;
    }

    try {
      await submitTask({
        taskId: selectedTask.id,
        content: taskSubmissionText,
        links,
      }).unwrap();

      toast.success("Assignment submitted! Awaiting mentor review.");
      setTaskSubmissionText("");
      setLinks([]);
      refetchRoadmap();
      refetchSubmissions();
      // Keep selectedTask open but update local task view details
      setSelectedTask((prev: any) => ({
        ...prev,
        status: "pending_review",
      }));
    } catch (err: any) {
      toast.error(err.data?.error || err.data?.message || err.message || "Failed to upload submission.");
    }
  };

  if (isAutoGenerating) {
    return (
      <div className="min-h-screen bg-[#F5F2FA] flex font-sans">
        <HoverSidebar />
        <main className="flex-1 ml-0 md:ml-20 p-10 pt-24 md:pt-10 flex flex-col justify-center items-center">
          <div className="bg-[#1E192B] border border-white/5 p-8 rounded-3xl text-center space-y-6 max-w-sm w-full mx-4 shadow-2xl relative text-white">
            {generationStep === "analyzing" && (
              <>
                <Brain className="w-12 h-12 text-purple-400 animate-pulse mx-auto" />
                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold font-mono">Analyzing skill metrics...</h4>
                  <p className="text-[10px] text-slate-400 font-mono">Calibrating strengths and weaknesses...</p>
                </div>
              </>
            )}
            {generationStep === "mapping" && (
              <>
                <Network className="w-12 h-12 text-indigo-400 animate-spin mx-auto animate-[spin_3s_linear_infinite]" />
                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold font-mono">Plotting learning modules...</h4>
                  <p className="text-[10px] text-slate-400 font-mono">Assembling personalized tasks with RAG...</p>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    );
  }

  if (isRoadmapLoading) {
    return (
      <div className="min-h-screen bg-[#F5F2FA] flex font-sans">
        <HoverSidebar />
        <main className="flex-1 ml-0 md:ml-20 p-10 pt-24 md:pt-10 flex flex-col justify-center items-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
          <p className="text-sm font-mono text-slate-500">Mapping visual nodes...</p>
        </main>
      </div>
    );
  }

  return (
    <div data-lenis-prevent className="min-h-screen bg-[#F5F2FA] flex font-sans">
      <HoverSidebar />
      <Toaster position="top-right" />

      {/* Main container */}
      <main className="flex-1 ml-0 md:ml-20 p-6 md:p-10 pt-20 md:pt-10 w-full overflow-x-hidden pb-32">
        {!activeRoadmapId ? (
          /* Empty / Selection state */
          <div className="flex flex-col justify-center items-center p-12 text-center h-[70vh]">
            <Sparkles className="w-12 h-12 text-[#7C3AED] mb-4 animate-pulse" />
            <h2 className="text-lg font-bold font-mono text-slate-700">No Learning Path Active</h2>
            <p className="text-xs text-slate-400 font-mono mt-1 max-w-xs">
              Assess your skills or start a course module to generate your personalized learning path.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-6 px-5 py-2.5 bg-[#7C3AED] hover:bg-purple-700 text-white rounded-2xl font-mono text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Start Course Module
            </button>
          </div>
        ) : (
          /* Roadmap Detail Layout */
          <div className="space-y-8">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-[#D8CBEB]/30">
              <div>
                <span className="px-2.5 py-1 bg-[#F5F2FA] text-[#7C3AED] text-[10px] font-extrabold font-mono rounded-full border border-[#D8CBEB] uppercase tracking-wider">
                  {roadmapDetails?.status === "completed" ? "COMPLETED" : "ROADMAP IN PROGRESS"}
                </span>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-mono text-slate-900 mt-3">
                  Learning Path Details
                </h1>
                <p className="text-xs text-slate-500 font-mono mt-1">
                  Plotting sequential modules for your customized career goals.
                </p>
              </div>
            </div>

            {/* Dynamic Roadmap Analytics Dashboard Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#FFFFFF] border border-[#D8CBEB]/30 rounded-3xl p-6 shadow-xs font-mono">
              {/* Progress statistics column */}
              <div className="flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    Curriculum Metrics
                  </span>
                  <h3 className="text-sm font-bold text-[#1E192B] mt-1 truncate">
                    {activeProgressRoadmap?.module_name || "Active Track"}
                  </h3>
                </div>

                {/* Circular Progress Gauge */}
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-[#F5F2FA]"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-[#7C3AED] transition-all duration-1000"
                        strokeWidth="3.5"
                        strokeDasharray={`${roadmapStats.percentage}, 100`}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-[#1E192B]">
                      {roadmapStats.percentage}%
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="text-slate-450">Approved Tasks</div>
                    <div className="text-sm font-black text-[#1E192B]">
                      {roadmapStats.completed} / {roadmapStats.total}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-2 border-t border-[#D8CBEB]/15">
                  <TrendingUp className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>Path velocity: <strong className="text-[#1E192B]">Optimal</strong></span>
                </div>
              </div>

              {/* Performance Curve Chart Column */}
              <div className="md:col-span-2 flex flex-col justify-between h-[160px]">
                <div className="flex justify-between items-center mb-1">
                  <div>
                    <span className="text-[9px] font-bold text-slate-455 uppercase tracking-wider">Learning Curve</span>
                    <p className="text-[10px] text-slate-405">Cumulative task completion timeline</p>
                  </div>
                </div>
                <div className="flex-1 w-full min-h-[110px] min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={learningCurveData}
                      margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorCurve" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis dataKey="name" stroke="#94A3B8" fontSize={9} fontStyle="monospace" tickLine={false} axisLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={9} fontStyle="monospace" tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ background: '#1E192B', borderColor: 'rgba(216,203,235,0.2)', borderRadius: '12px', fontSize: '10px', color: '#FFF', fontFamily: 'monospace' }}
                      />
                      <Area type="monotone" dataKey="Competence" name="Completed" stroke="#7C3AED" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCurve)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Completion celebratory banner */}
            {roadmapDetails?.status === "completed" && (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-center gap-4 text-emerald-800"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-100 rounded-2xl shrink-0">
                    <Award className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-extrabold font-mono text-sm">Path Finished Successfully!</h3>
                    <p className="text-[11px] font-mono mt-0.5">
                      Your career competencies have been verified. An official certificate has been issued!
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-mono text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
                >
                  Return to Dashboard
                </button>
              </motion.div>
            )}

            {/* Split layout: Roadmap Map vs Task details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Connected Vertical Timeline Map */}
              <div className="lg:col-span-2 space-y-8">
                {roadmapDetails?.sections?.map((section) => (
                  <div key={section.id} className="space-y-6">
                    {/* Section Header Card */}
                    <div className="bg-[#1E192B] text-white p-5 rounded-3xl flex items-center justify-between border border-white/5 shadow-md">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-mono text-sm font-bold text-[#D8CBEB]">
                          {section.order}
                        </span>
                        <div>
                          <h3 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-wider">Module {section.order}</h3>
                          <h3 className="text-sm font-bold font-mono text-white mt-0.5">{section.title}</h3>
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold font-mono border uppercase tracking-wider ${section.status === "completed"
                          ? "bg-emerald-500/10 text-[#10B981] border-emerald-500/20"
                          : "bg-amber-500/10 text-[#F59E0B] border-amber-500/20"
                          }`}
                      >
                        {section.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Section Tasks Flow Timeline */}
                    <div className="relative pl-10 ml-6 py-2 border-l-2 border-[#D8CBEB]/40 space-y-6">
                      {section.tasks?.map((task) => {
                        const isSelected = selectedTask?.id === task.id;

                        let statusText = "Not Started";
                        let statusBadgeColor = "bg-slate-100 text-slate-600 border-slate-200";
                        let timelineIcon = <Play className="w-3 h-3 text-slate-400" />;
                        let timelineRing = "border-slate-200 bg-white";

                        const isTaskPendingReview = isSelected && hasPendingSubmission;

                        if (task.status === "completed") {
                          statusBadgeColor = "bg-emerald-500/10 text-[#10B981] border-emerald-500/20";
                          statusText = "Approved";
                          timelineIcon = <Check className="w-3.5 h-3.5 text-[#10B981]" />;
                          timelineRing = "border-[#10B981] bg-emerald-50";
                        } else if (isTaskPendingReview) {
                          statusBadgeColor = "bg-indigo-500/10 text-indigo-650 border-indigo-500/20";
                          statusText = "Pending Review";
                          timelineIcon = <Clock className="w-3.5 h-3.5 text-indigo-650 animate-pulse" />;
                          timelineRing = "border-indigo-600 bg-indigo-50 animate-pulse";
                        } else if (task.status === "in_progress") {
                          statusBadgeColor = "bg-amber-500/10 text-[#F59E0B] border-amber-500/20";
                          statusText = "Active";
                          timelineIcon = <Play className="w-3 h-3 text-[#7C3AED] animate-pulse" />;
                          timelineRing = "border-[#7C3AED] bg-purple-50 animate-pulse";
                        } else {
                          // "not_started"
                          statusBadgeColor = "bg-slate-100 text-slate-500 border-slate-200";
                          statusText = "Not Started";
                          timelineIcon = <Play className="w-3 h-3 text-slate-400" />;
                          timelineRing = "border-slate-200 bg-white";
                        }

                        return (
                          <div key={task.id} className="relative group">
                            {/* Timeline absolute node */}
                            <div className={`absolute -left-[51px] top-[18px] w-7 h-7 rounded-full border-2 flex items-center justify-center z-10 transition-all ${timelineRing}`}>
                              {timelineIcon}
                            </div>

                            {/* Task Card */}
                            <div
                              onClick={() => setSelectedTask(task)}
                              className={`p-5 border rounded-3xl cursor-pointer bg-white transition-all duration-300 flex flex-col justify-between h-40 group-hover:shadow-md ${isSelected
                                ? "border-[#7C3AED] shadow-sm ring-1 ring-[#7C3AED]/25"
                                : "border-[#D8CBEB]/30 hover:border-purple-200"
                                }`}
                            >
                              <div className="space-y-2">
                                <div className="flex justify-between items-start gap-2">
                                  <span className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider">
                                    Task {task.order} &middot; Weight 100
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-md text-[8px] font-bold font-mono border uppercase tracking-wider ${statusBadgeColor}`}>
                                    {statusText}
                                  </span>
                                </div>
                                <h4 className="text-sm font-bold font-mono text-slate-800">
                                  {task.title}
                                </h4>
                                <p className="text-xs text-slate-400 font-mono line-clamp-2 leading-relaxed">
                                  {task.description}
                                </p>
                              </div>

                              <div className="flex justify-between items-center pt-2 border-t border-slate-55 mt-1">
                                <span className="text-[9px] font-bold font-mono text-[#7C3AED]">
                                  {task.status === "completed" ? "Attempt verified successfully" : "Workspace submission active"}
                                </span>
                                <span className="text-[10px] font-bold text-[#7C3AED] font-mono inline-flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                                  Workspace Console <ChevronRight className="w-3.5 h-3.5" />
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Column: Dynamic Task interaction console */}
              <div>
                <AnimatePresence mode="wait">
                  {selectedTask ? (
                    <motion.div
                      key={selectedTask.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="bg-white border border-[#D8CBEB]/30 rounded-3xl p-6 shadow-xs space-y-6"
                    >
                      {/* Task Info */}
                      <div>
                        <span className="text-[9px] font-bold font-mono text-slate-400 uppercase tracking-wider">
                          Task details Console
                        </span>
                        <h3 className="text-sm font-bold font-mono text-slate-800 mt-1">
                          {selectedTask.title}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-mono mt-2.5 whitespace-pre-wrap leading-relaxed">
                          {selectedTask.description}
                        </p>
                      </div>

                      {/* 3-Step visual progress pipeline bar */}
                      <div className="flex items-center justify-between font-mono text-[8px] font-bold text-slate-450 border-b border-[#D8CBEB]/20 pb-4 mb-4">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center border ${selectedTask.status ? 'border-[#7C3AED] bg-[#7C3AED]/10 text-[#7C3AED]' : 'border-slate-200 text-slate-400'}`}>1</span>
                          <span>Assigned</span>
                        </div>
                        <div className="flex-1 h-0.5 bg-slate-100 mx-2" />
                        <div className="flex flex-col items-center gap-1">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center border ${hasPendingSubmission ? 'border-[#F59E0B] bg-amber-50 text-[#F59E0B] animate-pulse' : selectedTask.status === "completed" ? 'border-[#10B981] bg-emerald-50 text-[#10B981]' : 'border-slate-200 text-slate-400'}`}>2</span>
                          <span>Review</span>
                        </div>
                        <div className="flex-1 h-0.5 bg-slate-100 mx-2" />
                        <div className="flex flex-col items-center gap-1">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center border ${selectedTask.status === "completed" ? 'border-[#10B981] bg-emerald-50 text-[#10B981]' : 'border-slate-200 text-slate-400'}`}>3</span>
                          <span>Approved</span>
                        </div>
                      </div>

                      {/* Submission History / Rejection logs */}
                      {taskSubmissions && taskSubmissions.length > 0 && (
                        <div className="space-y-3 pt-2 border-t border-slate-100">
                          <h4 className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider">Submission Logs</h4>
                          <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                            {taskSubmissions.map((sub: any, i: number) => (
                              <div
                                key={sub.id}
                                className="p-3 border border-[#D8CBEB]/20 rounded-2xl bg-purple-50/5 text-[10px] font-mono space-y-2"
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-semibold text-slate-500">Attempt #{taskSubmissions.length - i}</span>
                                  <span
                                    className={`px-1.5 py-0.5 rounded-sm text-[8px] font-bold ${sub.status === "approved"
                                      ? "bg-emerald-100 text-emerald-600"
                                      : sub.status === "rejected"
                                        ? "bg-red-100 text-red-600"
                                        : "bg-amber-100 text-amber-600"
                                      }`}
                                  >
                                    {sub.status.toUpperCase()}
                                  </span>
                                </div>
                                {sub.content && <p className="text-slate-600 break-all leading-relaxed">{sub.content}</p>}
                                {sub.links && sub.links.length > 0 && (
                                  <div className="mt-1.5 space-y-1">
                                    <span className="text-[8px] font-bold text-slate-400 block uppercase">Submitted Links</span>
                                    {sub.links.map((link: string, idx: number) => (
                                      <a
                                        key={idx}
                                        href={link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-purple-600 hover:text-purple-700 hover:underline flex items-center gap-1 break-all text-[9px] font-medium"
                                      >
                                        <ExternalLink className="w-3 h-3 shrink-0" />
                                        {link}
                                      </a>
                                    ))}
                                  </div>
                                )}
                                {sub.comment && (
                                  <div className="bg-slate-50 border border-[#D8CBEB]/10 text-slate-500 p-2.5 rounded-xl mt-1 italic text-[9px] leading-relaxed">
                                    Mentor: "{sub.comment}"
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Submission Upload */}
                      {selectedTask.status !== "completed" && roadmapDetails?.status === "abandoned" && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl font-mono text-xs text-center space-y-2 mt-4 text-left">
                          <p className="font-bold uppercase tracking-wider text-[10px]">Learning Path Inactive</p>
                          <p className="text-[10px] text-slate-500 leading-relaxed">
                            This learning roadmap has been archived. Please resume it from your student dashboard to recontinue submitting task exercises.
                          </p>
                        </div>
                      )}

                      {selectedTask.status !== "completed" && roadmapDetails?.status === "in_progress" && hasPendingSubmission && (
                        <div className="bg-amber-50 border border-amber-250 text-amber-805 p-4 rounded-2xl font-mono text-xs text-center space-y-2 mt-4 text-left">
                          <p className="font-bold uppercase tracking-wider text-[10px]">Awaiting Mentor Review</p>
                          <p className="text-[10px] text-slate-500 leading-relaxed">
                            You have already uploaded an exercise submission for this task. Please wait for your mentor to approve or reject your pending submission before uploading a new attempt.
                          </p>
                        </div>
                      )}

                      {selectedTask.status !== "completed" && roadmapDetails?.status === "in_progress" && !hasPendingSubmission && (
                        <form onSubmit={handleTaskSubmit} className="space-y-4 pt-2 border-t border-slate-100">
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider">
                                Submit Deliverable
                              </label>
                              <span className="px-1.5 py-0.5 bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20 text-[7px] font-bold font-mono rounded uppercase">
                                AI-Evaluator Active
                              </span>
                            </div>
                            <textarea
                              value={taskSubmissionText}
                              onChange={(e) => setTaskSubmissionText(e.target.value)}
                              placeholder="Describe your implementation details, copy code chunks, or insert github repository URLs..."
                              className="w-full h-36 p-3 bg-[#1E192B] border border-white/10 rounded-xl focus:ring-1 focus:ring-[#7C3AED] focus:border-transparent outline-hidden font-mono text-xs text-white resize-none placeholder:text-[#D8CBEB]/40"
                            />
                          </div>

                          {/* Links input and display */}
                          <div className="space-y-3">
                            <label className="text-[10px] font-bold font-mono text-slate-500 block uppercase tracking-wider">
                              Add Project Links / Deliverables (Optional)
                            </label>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <Link2 className="w-4 h-4 text-slate-455 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                  type="text"
                                  value={newLink}
                                  onChange={(e) => setNewLink(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddLink();
                                    }
                                  }}
                                  placeholder="Enter URL (e.g. Github code or live URL...)"
                                  className="w-full pl-9 pr-3 py-2 border border-[#D8CBEB]/20 rounded-xl focus:ring-1 focus:ring-[#7C3AED] focus:border-transparent outline-hidden font-mono text-xs text-slate-700 bg-white"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={handleAddLink}
                                className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-[#7C3AED] rounded-xl border border-purple-100 flex items-center gap-1 cursor-pointer transition-colors text-xs font-mono font-bold whitespace-nowrap"
                              >
                                <Plus className="w-4 h-4" /> Add Link
                              </button>
                            </div>
                            <span className="text-[9px] text-slate-400 font-mono block">
                              💡 You can add multiple links (Figma, GitHub, Vercel, etc.) sequentially.
                            </span>

                            {links.length > 0 && (
                              <div className="mt-2 space-y-1.5">
                                {links.map((link, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between gap-2 p-2 border border-[#D8CBEB]/20 rounded-xl bg-purple-50/5 text-[10px] font-mono"
                                  >
                                    <span className="truncate text-slate-655">{link}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveLink(idx)}
                                      className="text-red-500 hover:text-red-700 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <button
                            type="submit"
                            disabled={isSubmittingTask || (!taskSubmissionText.trim() && links.length === 0)}
                            className="w-full flex items-center justify-center gap-1.5 py-3 bg-[#7C3AED] hover:bg-purple-700 text-white rounded-xl font-mono text-xs font-bold transition-all shadow-xs cursor-pointer disabled:bg-slate-350"
                          >
                            {isSubmittingTask ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                              </>
                            ) : (
                              <>
                                Submit Assignment <ArrowRight className="w-4 h-4" />
                              </>
                            )}
                          </button>
                        </form>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="no-selection"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-6 text-center border border-[#D8CBEB]/20 bg-purple-50/5 rounded-3xl"
                    >
                      <HelpCircle className="w-10 h-10 text-slate-350 mx-auto mb-2" />
                      <p className="text-xs text-slate-500 font-mono">
                        Select a task card on the timeline map to view description, logs, and upload files.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function RoadmapPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F5F2FA] flex justify-center items-center">
        <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
      </div>
    }>
      <RoadmapContent />
    </Suspense>
  );
}

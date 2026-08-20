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
  ExternalLink
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import confetti from "canvas-confetti";
import { HoverSidebar } from "@/components/layout/HoverSidebar";
import { useCompany } from "@/context/CompanyContext";
import {
  useGetProgressQuery,
  useGetRoadmapDetailsQuery,
  useAbandonRoadmapMutation,
  useSubmitTaskMutation,
  useGetTaskSubmissionsQuery
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

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else if (!hasCompletedOnboarding) {
      router.push("/onboarding");
    }
  }, [isAuthenticated, hasCompletedOnboarding, router]);

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

  if (isRoadmapLoading) {
    return (
      <div className="min-h-screen bg-[#F5F2FA] flex font-sans">
        <HoverSidebar />
        <main className="flex-1 ml-20 p-10 flex flex-col justify-center items-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
          <p className="text-sm font-mono text-slate-500">Mapping visual nodes...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F2FA] flex font-sans">
      <HoverSidebar />
      <Toaster position="top-right" />

      {/* Main container */}
      <main className="flex-1 ml-20 p-6 md:p-10 max-w-7xl overflow-x-hidden">
        {!activeRoadmapId ? (
          /* Empty / Selection state */
          <div className="flex flex-col justify-center items-center p-12 text-center h-[70vh]">
            <Sparkles className="w-12 h-12 text-purple-300 mb-4" />
            <h2 className="text-lg font-bold font-mono text-slate-700">No Learning Path Active</h2>
            <p className="text-xs text-slate-400 font-mono mt-1 max-w-xs">
              Assess your skills or start a course module to generate your personalized learning path.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-6 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-mono text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Start Course Module
            </button>
          </div>
        ) : (
          /* Roadmap Detail Layout */
          <div className="space-y-8">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-purple-100">
              <div>
                <span className="px-2.5 py-1 bg-purple-100 text-purple-700 text-[10px] font-extrabold font-mono rounded-full border border-purple-200 uppercase">
                  {roadmapDetails?.status === "completed" ? "COMPLETED" : "ROADMAP IN PROGRESS"}
                </span>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-mono text-slate-900 mt-3">
                  Learning Path Details
                </h1>
                <p className="text-xs text-slate-500 font-mono mt-1">
                  Plotting sequential modules for your customized career goals.
                </p>
              </div>

              {roadmapDetails?.status === "in_progress" && (
                <button
                  onClick={handleAbandon}
                  disabled={isAbandoning}
                  className="flex items-center gap-1.5 px-4 py-2 border border-red-200 hover:bg-red-50 text-red-600 rounded-xl font-mono text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" /> Abandon Path
                </button>
              )}
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
              {/* Left Column: Vertical Timeline Map */}
              <div className="lg:col-span-2 space-y-6">
                {roadmapDetails?.sections?.map((section) => (
                  <div key={section.id} className="space-y-4">
                    {/* Section Header Card */}
                    <div className="bg-[#1c1921] text-white p-4 rounded-2xl flex items-center justify-between border border-slate-800 shadow-md">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-mono text-xs font-bold text-slate-300">
                          {section.order}
                        </span>
                        <h3 className="text-xs font-bold font-mono text-slate-200">{section.title}</h3>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold font-mono ${
                          section.status === "completed"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/25"
                        }`}
                      >
                        {section.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Section Tasks */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-purple-200/40 ml-5 py-2">
                      {section.tasks?.map((task) => {
                        const isSelected = selectedTask?.id === task.id;
                        let statusColor = "bg-slate-100 text-slate-400";
                        let statusText = "Not Started";

                        if (task.status === "completed") {
                          statusColor = "bg-emerald-100 text-emerald-600";
                          statusText = "Approved";
                        } else if (task.status === "in_progress") {
                          statusColor = "bg-amber-100 text-amber-600";
                          statusText = "In Progress";
                        }

                        return (
                          <div
                            key={task.id}
                            onClick={() => setSelectedTask(task)}
                            className={`p-4 border rounded-2xl cursor-pointer bg-white transition-all flex flex-col justify-between h-36 ${
                              isSelected
                                ? "border-purple-600 shadow-sm"
                                : "border-purple-50 hover:border-purple-100 hover:shadow-xs"
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex justify-between items-start gap-2">
                                <span className="text-[9px] font-bold font-mono text-slate-400 uppercase">
                                  Task {task.order}
                                </span>
                                <span className={`px-2 py-0.5 rounded-sm text-[8px] font-bold font-mono ${statusColor}`}>
                                  {statusText}
                                </span>
                              </div>
                              <h4 className="text-xs font-bold font-mono text-slate-800 truncate">
                                {task.title}
                              </h4>
                              <p className="text-[10px] text-slate-400 font-mono line-clamp-2">
                                {task.description}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-semibold text-purple-600 font-mono inline-flex items-center gap-0.5">
                                View Details <ChevronRight className="w-3 h-3" />
                              </span>
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
                      className="bg-white border border-purple-100 rounded-3xl p-5 shadow-xs space-y-6"
                    >
                      {/* Task Info */}
                      <div>
                        <span className="text-[9px] font-bold font-mono text-slate-400 uppercase">
                          Task details Console
                        </span>
                        <h3 className="text-sm font-bold font-mono text-slate-800 mt-1">
                          {selectedTask.title}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-mono mt-1.5 whitespace-pre-wrap leading-relaxed">
                          {selectedTask.description}
                        </p>
                      </div>

                      {/* Submission History / Rejection logs */}
                      {taskSubmissions && taskSubmissions.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-purple-50">
                          <h4 className="text-[10px] font-bold font-mono text-slate-500 uppercase">Submission Logs</h4>
                          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                            {taskSubmissions.map((sub: any, i: number) => (
                              <div
                                key={sub.id}
                                className="p-2.5 border border-purple-50 rounded-xl bg-purple-50/5 text-[10px] font-mono space-y-1.5"
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-semibold text-slate-500">Attempt #{taskSubmissions.length - i}</span>
                                  <span
                                    className={`px-1.5 py-0.5 rounded-sm text-[8px] font-bold ${
                                      sub.status === "approved"
                                        ? "bg-emerald-100 text-emerald-600"
                                        : sub.status === "rejected"
                                        ? "bg-red-100 text-red-600"
                                        : "bg-amber-100 text-amber-600"
                                    }`}
                                  >
                                    {sub.status.toUpperCase()}
                                  </span>
                                </div>
                                {sub.content && <p className="text-slate-600 break-all">{sub.content}</p>}
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
                                  <div className="bg-slate-100 border border-slate-200 text-slate-500 p-1.5 rounded-md mt-1 italic text-[9px] leading-relaxed">
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
                          <p className="font-bold uppercase tracking-wider text-[10px]">Learning Path Inactive / Deleted</p>
                          <p className="text-[10px] text-slate-500 leading-relaxed">
                            This learning roadmap has been archived. Please resume it from your student dashboard to recontinue submitting task exercises.
                          </p>
                        </div>
                      )}

                      {selectedTask.status !== "completed" && roadmapDetails?.status === "in_progress" && hasPendingSubmission && (
                        <div className="bg-amber-50 border border-amber-250 text-amber-800 p-4 rounded-2xl font-mono text-xs text-center space-y-2 mt-4 text-left">
                          <p className="font-bold uppercase tracking-wider text-[10px]">Awaiting Mentor Review</p>
                          <p className="text-[10px] text-slate-500 leading-relaxed">
                            You have already uploaded an exercise submission for this task. Please wait for your mentor to approve or reject your pending submission before uploading a new attempt.
                          </p>
                        </div>
                      )}

                      {selectedTask.status !== "completed" && roadmapDetails?.status === "in_progress" && !hasPendingSubmission && (
                        <form onSubmit={handleTaskSubmit} className="space-y-3 pt-2 border-t border-purple-50">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold font-mono text-slate-500">
                              Submit Deliverable
                            </label>
                            <textarea
                              value={taskSubmissionText}
                              onChange={(e) => setTaskSubmissionText(e.target.value)}
                              placeholder="Describe your implementation details, copy code chunks, or insert github repository URLs..."
                              className="w-full h-32 p-3 border border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-hidden font-mono text-xs resize-none placeholder:text-slate-400"
                            />
                          </div>

                          {/* Links input and display */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold font-mono text-slate-500 block">
                              Add Links (Optional)
                            </label>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
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
                                  placeholder="https://github.com/..."
                                  className="w-full pl-9 pr-3 py-2 border border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-hidden font-mono text-xs"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={handleAddLink}
                                className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-xl border border-purple-100 flex items-center justify-center cursor-pointer transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            {links.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {links.map((link, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between gap-2 p-2 border border-purple-50 rounded-xl bg-purple-50/5 text-[10px] font-mono"
                                  >
                                    <span className="truncate text-slate-600">{link}</span>
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
                            className="w-full flex items-center justify-center gap-1.5 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-mono text-xs font-bold transition-all shadow-xs cursor-pointer disabled:bg-slate-350"
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
                      className="p-6 text-center border border-purple-100 bg-purple-50/5 rounded-3xl"
                    >
                      <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
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

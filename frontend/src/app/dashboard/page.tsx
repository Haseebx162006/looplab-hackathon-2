"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  BookOpen,
  Trophy,
  Award,
  ChevronRight,
  TrendingUp,
  UserCheck,
  ClipboardList,
  AlertTriangle,
  LogOut,
  Settings,
  ShieldAlert,
  Loader2,
  FileCheck,
  CheckCircle,
  XCircle,
  GraduationCap,
  ExternalLink,
  Video
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import confetti from "canvas-confetti";
import { HoverSidebar } from "@/components/layout/HoverSidebar";
import { useCompany } from "@/context/CompanyContext";
import {
  useGetProgressQuery,
  useGetModulesQuery,
  useGenerateTestMutation,
  useGenerateSkillSummaryMutation,
  useGenerateRoadmapMutation,
  useGetPendingSubmissionsQuery,
  useReviewSubmissionMutation,
  useAbandonRoadmapMutation,
  useResumeRoadmapMutation,
  useCreateBookingRequestMutation,
  useGetUserBookingRequestsQuery,
  useGetAdminBookingRequestsQuery,
  useRespondToBookingRequestMutation
} from "@/store/api/learningApi";
import { useGetMeQuery } from "@/store/api/authApi";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, hasCompletedOnboarding } = useCompany();
  
  const { data: userProfile, isLoading: isUserLoading } = useGetMeQuery(undefined, {
    skip: !isAuthenticated,
  });

  const { data: progress, refetch: refetchProgress, isLoading: isProgressLoading } = useGetProgressQuery(undefined, {
    skip: !isAuthenticated,
  });

  const { data: modules } = useGetModulesQuery();
  const [generateTest, { isLoading: isGeneratingTest }] = useGenerateTestMutation();
  const [generateSummary, { isLoading: isGeneratingSummary }] = useGenerateSkillSummaryMutation();
  const [generateRoadmap, { isLoading: isGeneratingRoadmap }] = useGenerateRoadmapMutation();

  const [activeTab, setActiveTab] = useState<"student" | "mentor">("student");

  // Onboarding & Auth checks
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else if (userProfile) {
      if (userProfile.user?.role === "admin") {
        router.push("/admin");
      } else if (!hasCompletedOnboarding) {
        router.push("/onboarding");
      }
    }
  }, [isAuthenticated, userProfile, hasCompletedOnboarding, router]);

  // Form State for creating a path
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  // Admin Review State
  const { data: pendingSubmissions, refetch: refetchPending } = useGetPendingSubmissionsQuery(undefined, {
    skip: !userProfile || userProfile.user?.role !== "admin",
  });
  const [reviewSubmission, { isLoading: isReviewing }] = useReviewSubmissionMutation();
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [reviewComment, setReviewComment] = useState("");

  // Roadmap actions
  const [abandonRoadmap, { isLoading: isAbandoning }] = useAbandonRoadmapMutation();
  const [resumeRoadmap, { isLoading: isResuming }] = useResumeRoadmapMutation();

  // Booking requests hooks
  const { data: userBookingRequests, refetch: refetchUserBookings } = useGetUserBookingRequestsQuery(undefined, {
    skip: !isAuthenticated || (userProfile && userProfile.user?.role === "admin"),
  });
  const { data: adminBookingRequests, refetch: refetchAdminBookings } = useGetAdminBookingRequestsQuery(undefined, {
    skip: !isAuthenticated || !userProfile || userProfile.user?.role !== "admin",
  });
  const [createBookingRequest, { isLoading: isCreatingBooking }] = useCreateBookingRequestMutation();
  const [respondToBookingRequest, { isLoading: isRespondingToBooking }] = useRespondToBookingRequestMutation();

  // Booking form states
  const [showCallRequestModal, setShowCallRequestModal] = useState(false);
  const [callTitle, setCallTitle] = useState("");
  const [callDescription, setCallDescription] = useState("");

  // Admin Booking response modal states
  const [selectedRequestForReview, setSelectedRequestForReview] = useState<any | null>(null);
  const [scheduledAtDate, setScheduledAtDate] = useState("");
  const [scheduledAtTime, setScheduledAtTime] = useState("");
  const [adminResponseComment, setAdminResponseComment] = useState("");

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
      router.push(`/assessments?test_id=${testSession.test_id}`);
    } catch (err: any) {
      toast.error(err.data?.error || err.data?.message || err.message || "Failed to start learning path.");
    }
  };

  const handleReview = async (decision: "approve" | "reject") => {
    if (!selectedSubmission) return;

    try {
      await reviewSubmission({
        submissionId: selectedSubmission.id,
        decision,
        comment: reviewComment,
      }).unwrap();

      toast.success(`Submission successfully ${decision === "approve" ? "approved" : "rejected"}!`);
      
      if (decision === "approve") {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.8 }
        });
      }

      setSelectedSubmission(null);
      setReviewComment("");
      refetchPending();
      refetchProgress();
    } catch (err: any) {
      toast.error(err.data?.error || err.data?.message || err.message || "Failed to process review.");
    }
  };

  const handleAbandonRoadmap = async (roadmapId: string) => {
    if (!confirm("Are you sure you want to abandon/delete this learning path?")) return;
    try {
      await abandonRoadmap(roadmapId).unwrap();
      toast.success("Learning path abandoned.");
      refetchProgress();
    } catch (err: any) {
      toast.error(err.data?.error || err.data?.message || err.message || "Failed to abandon path.");
    }
  };

  const handleResumeRoadmap = async (roadmapId: string) => {
    try {
      await resumeRoadmap(roadmapId).unwrap();
      toast.success("Learning path recontinued successfully!");
      refetchProgress();
    } catch (err: any) {
      toast.error(err.data?.error || err.data?.message || err.message || "Failed to resume path.");
    }
  };

  const handleCreateBookingRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callTitle.trim()) {
      toast.error("Please enter a meeting topic/title.");
      return;
    }
    try {
      await createBookingRequest({
        title: callTitle,
        description: callDescription,
      }).unwrap();
      toast.success("Mentor call requested! Awaiting approval.");
      setCallTitle("");
      setCallDescription("");
      setShowCallRequestModal(false);
      refetchUserBookings();
    } catch (err: any) {
      toast.error(err.data?.error || err.data?.message || err.message || "Failed to submit request.");
    }
  };

  const handleRespondToBooking = async (decision: "approve" | "reject") => {
    if (!selectedRequestForReview) return;
    
    let scheduledAt: string | undefined = undefined;
    if (decision === "approve") {
      if (!scheduledAtDate || !scheduledAtTime) {
        toast.error("Please specify a scheduled date and time.");
        return;
      }
      scheduledAt = `${scheduledAtDate}T${scheduledAtTime}:00`;
    }

    try {
      await respondToBookingRequest({
        requestId: selectedRequestForReview.id,
        decision,
        scheduledAt,
        comment: adminResponseComment,
      }).unwrap();

      toast.success(`Meeting request successfully ${decision === "approve" ? "scheduled" : "rejected"}!`);
      setSelectedRequestForReview(null);
      setScheduledAtDate("");
      setScheduledAtTime("");
      setAdminResponseComment("");
      refetchAdminBookings();
    } catch (err: any) {
      toast.error(err.data?.error || err.data?.message || err.message || "Failed to respond to request.");
    }
  };

  const isAdmin = userProfile?.user?.role === "admin";
  const activeRoadmap = progress?.roadmaps?.find((r) => r.status === "in_progress");
  const completedRoadmaps = progress?.roadmaps?.filter((r) => r.status === "completed") || [];

  if (isUserLoading || isProgressLoading) {
    return (
      <div className="min-h-screen bg-[#F5F2FA] flex flex-col justify-center items-center font-sans">
        <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
        <p className="text-sm font-mono text-slate-500">Syncing learning workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F2FA] flex font-sans">
      <HoverSidebar />
      <Toaster position="top-right" />

      {/* Main Body */}
      <main className="flex-1 ml-0 md:ml-20 p-6 md:p-10 pt-20 md:pt-10 max-w-7xl overflow-x-hidden">
        {/* Header bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-mono text-slate-900">
                Welcome back, {userProfile?.user?.name || "Student"}!
              </h1>
              {isAdmin && (
                <span className="px-2.5 py-1 bg-purple-900/10 text-purple-700 text-[10px] font-extrabold font-mono rounded-full border border-purple-200">
                  MENTOR / ADMIN
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-mono mt-1">
              Analyze diagnostics, generate personalized roadmaps, and submit exercises.
            </p>
          </div>

          {/* Tab selectors for Admin role */}
          {isAdmin && (
            <div className="flex bg-slate-200/80 p-1.5 rounded-2xl border border-purple-100 font-mono text-xs font-semibold">
              <button
                onClick={() => setActiveTab("student")}
                className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                  activeTab === "student"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Student View
              </button>
              <button
                onClick={() => setActiveTab("mentor")}
                className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "mentor"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Mentor Hub
                {pendingSubmissions && pendingSubmissions.length > 0 && (
                  <span className="w-4 h-4 bg-red-500 text-[9px] text-white flex items-center justify-center rounded-full animate-pulse">
                    {pendingSubmissions.length}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "student" ? (
            <motion.div
              key="student-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {/* Quick stats section */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white border border-purple-100 rounded-3xl p-5 shadow-xs flex items-center gap-4">
                  <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl shrink-0">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xl font-bold font-mono text-slate-800">
                      {progress?.roadmaps?.length || 0}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">Learning Paths</div>
                  </div>
                </div>

                <div className="bg-white border border-purple-100 rounded-3xl p-5 shadow-xs flex items-center gap-4">
                  <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl shrink-0">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xl font-bold font-mono text-slate-800">
                      {completedRoadmaps.length}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">Completed Paths</div>
                  </div>
                </div>

                <div className="bg-white border border-purple-100 rounded-3xl p-5 shadow-xs flex items-center gap-4">
                  <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl shrink-0">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xl font-bold font-mono text-slate-800">
                      {progress?.certificates?.length || 0}
                    </div>
                    <div className="text-xs text-slate-400 font-mono">Certificates Issued</div>
                  </div>
                </div>
              </div>

              {/* Main Content Split */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Col: Core Path Controls */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Current Active Path Card */}
                  {activeRoadmap ? (
                    <div className="bg-white border border-purple-100 rounded-3xl p-6 md:p-8 shadow-xs relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-48 h-48 bg-purple-200/20 rounded-full blur-2xl -mr-12 -mt-12 pointer-events-none" />
                      
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className="px-2.5 py-1 bg-purple-100 text-purple-700 text-[10px] font-extrabold font-mono rounded-full border border-purple-200">
                            ACTIVE ROADMAP
                          </span>
                          <h2 className="text-xl font-bold font-mono mt-3 text-slate-800">
                            {activeRoadmap.module_name}
                          </h2>
                          <p className="text-xs text-slate-400 font-mono mt-1">
                            Started {new Date(activeRoadmap.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black font-mono text-purple-600">
                            {activeRoadmap.progress_percentage}%
                          </span>
                          <p className="text-[10px] text-slate-400 font-mono">completed</p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-2 bg-purple-50 rounded-full mt-6 overflow-hidden">
                        <div
                          className="h-full bg-purple-600 rounded-full"
                          style={{ width: `${activeRoadmap.progress_percentage}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-center mt-8">
                        <div className="text-xs font-mono text-slate-500">
                          {activeRoadmap.tasks_completed} of {activeRoadmap.tasks_total} exercises approved
                        </div>
                        <button
                          onClick={() => router.push(`/roadmaps?id=${activeRoadmap.roadmap_id}`)}
                          className="flex items-center gap-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-mono text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          Open learning map <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : hasCompletedOnboarding ? (
                    /* Diagnostic complete / View Roadmap card */
                    <div className="bg-gradient-to-tr from-slate-900 via-indigo-950 to-purple-950 border border-purple-900/40 rounded-3xl p-6 md:p-8 shadow-lg relative overflow-hidden text-white">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                      <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl -ml-12 -mb-12 pointer-events-none" />
                      
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-purple-500/20 border border-purple-400/20 rounded-xl text-purple-300">
                          <Sparkles className="w-5 h-5 animate-pulse" />
                        </div>
                        <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 text-[10px] font-extrabold font-mono rounded-full border border-purple-400/20 uppercase tracking-wider">
                          Diagnostic Verified
                        </span>
                      </div>

                      <h2 className="text-xl font-bold font-mono text-white leading-tight">
                        AI Skill Analysis Complete
                      </h2>
                      <p className="text-xs text-purple-250/70 font-mono mt-3 leading-relaxed max-w-xl">
                        Your technical profile and diagnostic assessment answers have been successfully calibrated. We are ready to synthesize your custom learning roadmap using official mentor materials.
                      </p>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-8 pt-4 border-t border-purple-900/40">
                        <div className="text-[11px] font-mono text-purple-300/80 flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                          Onboarding profile calibration complete
                        </div>
                        <button
                          onClick={() => router.push("/roadmaps")}
                          className="flex items-center justify-center gap-2 px-5 py-3 bg-purple-600 hover:bg-purple-550 active:scale-98 text-white rounded-xl font-mono text-xs font-bold transition-all shadow-md cursor-pointer whitespace-nowrap"
                        >
                          View Personalized Roadmap <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Select Course / Generate Assessment */
                    <div className="bg-white border border-purple-100 rounded-3xl p-6 md:p-8 shadow-xs">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold font-mono">Unlock A New Skill</h2>
                      </div>

                      <form onSubmit={handleStartPath} className="space-y-5">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-600 font-mono">Choose Course Domain</label>
                          <select
                             value={selectedModuleId}
                             onChange={(e) => setSelectedModuleId(e.target.value)}
                             className="w-full p-4 border border-purple-100 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-hidden font-mono text-xs bg-purple-50/5 cursor-pointer"
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
                          <label className="text-xs font-bold text-slate-600 font-mono">Self-Rated Difficulty</label>
                          <div className="grid grid-cols-3 gap-3">
                            {(["easy", "medium", "hard"] as const).map((level) => (
                              <button
                                key={level}
                                type="button"
                                onClick={() => setDifficulty(level)}
                                className={`p-3 rounded-2xl font-mono text-xs capitalize font-semibold border transition-all cursor-pointer ${
                                  difficulty === level
                                    ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                                    : "bg-white text-slate-655 border-purple-50 hover:border-purple-200"
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
                              Begin Skill Diagnostics <ChevronRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  )}

                  {/* My Learning Paths (All roadmaps) */}
                  {progress?.roadmaps && progress.roadmaps.length > 0 && (
                    <div className="bg-white border border-purple-100 rounded-3xl p-6 md:p-8 shadow-xs space-y-4">
                      <div className="flex items-center justify-between border-b border-purple-50 pb-3">
                        <h3 className="text-sm font-bold font-mono text-slate-800 uppercase tracking-wider">My Learning Paths</h3>
                        <span className="px-2 py-0.5 bg-purple-50 text-[9px] font-bold font-mono text-purple-700 rounded-md border border-purple-200">
                          {progress.roadmaps.length} Total
                        </span>
                      </div>

                      <div className="space-y-3">
                        {progress.roadmaps.map((r) => {
                          let statusColor = "bg-slate-100 text-slate-650";
                          if (r.status === "completed") {
                            statusColor = "bg-emerald-100 text-emerald-700";
                          } else if (r.status === "in_progress") {
                            statusColor = "bg-purple-100 text-purple-700";
                          } else if (r.status === "abandoned") {
                            statusColor = "bg-red-100 text-red-700";
                          }

                          return (
                            <div key={r.roadmap_id} className="p-4 border border-purple-50 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-purple-50/5 hover:bg-purple-50/10 transition-all">
                              <div className="space-y-1 min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-xs font-bold font-mono text-slate-700 truncate">{r.module_name}</h4>
                                  <span className={`px-2 py-0.5 text-[8px] font-bold font-mono rounded-md uppercase ${statusColor}`}>
                                    {r.status === 'abandoned' ? 'deleted' : r.status.replace('_', ' ')}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-mono">
                                  Created {new Date(r.created_at).toLocaleDateString()} &middot; {r.tasks_completed}/{r.tasks_total} exercises approved ({r.progress_percentage}%)
                                </p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {r.status === "in_progress" && (
                                  <>
                                    <button
                                      onClick={() => router.push(`/roadmaps?id=${r.roadmap_id}`)}
                                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold font-mono rounded-lg transition-colors cursor-pointer"
                                    >
                                      View
                                    </button>
                                    <button
                                      onClick={() => handleAbandonRoadmap(r.roadmap_id)}
                                      disabled={isAbandoning}
                                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-650 text-[10px] font-bold font-mono rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                    >
                                      Delete
                                    </button>
                                  </>
                                )}
                                {r.status === "abandoned" && (
                                  <button
                                    onClick={() => handleResumeRoadmap(r.roadmap_id)}
                                    disabled={isResuming}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold font-mono rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                  >
                                    Recontinue
                                  </button>
                                )}
                                {r.status === "completed" && (
                                  <button
                                    onClick={() => router.push(`/roadmaps?id=${r.roadmap_id}`)}
                                    className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-750 text-white text-[10px] font-bold font-mono rounded-lg transition-colors cursor-pointer"
                                  >
                                    Open Map
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Book Mentor Call Section */}
                  <div className="bg-white border border-purple-100 rounded-3xl p-6 md:p-8 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-purple-50 pb-3">
                      <div>
                        <h3 className="text-sm font-bold font-mono text-slate-800 uppercase tracking-wider">Book Mentor Session</h3>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">Request a 1-on-1 video call checkpoint with your mentor.</p>
                      </div>
                      <button
                        onClick={() => setShowCallRequestModal(true)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-mono text-[10px] font-bold transition-all shadow-xs cursor-pointer"
                      >
                        Request Call
                      </button>
                    </div>

                    {userBookingRequests && userBookingRequests.length > 0 ? (
                      <div className="space-y-3">
                        {userBookingRequests.map((req: any) => {
                          let reqStatusColor = "bg-slate-100 text-slate-650";
                          if (req.status === "approved") reqStatusColor = "bg-emerald-100 text-emerald-700";
                          if (req.status === "rejected") reqStatusColor = "bg-red-100 text-red-700";

                          return (
                            <div key={req.id} className="p-4 border border-purple-50 rounded-2xl bg-purple-50/5 space-y-3">
                              <div className="flex justify-between items-start gap-3">
                                <div>
                                  <h4 className="text-xs font-bold font-mono text-slate-700">{req.title}</h4>
                                  {req.description && (
                                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">{req.description}</p>
                                  )}
                                </div>
                                <span className={`px-2 py-0.5 text-[8px] font-bold font-mono rounded-md uppercase ${reqStatusColor}`}>
                                  {req.status}
                                </span>
                              </div>

                              {req.status === "approved" && (
                                <div className="p-3 bg-emerald-50/30 border border-emerald-100 rounded-xl space-y-2 text-[10px] font-mono">
                                  <div className="flex justify-between items-center text-emerald-805">
                                    <span><strong>Scheduled:</strong> {new Date(req.scheduled_at).toLocaleString()}</span>
                                  </div>
                                  <a
                                    href={req.meet_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-1.5 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-center transition-colors cursor-pointer text-[10px]"
                                  >
                                    <Video className="w-3.5 h-3.5" /> Join Google Meet
                                  </a>
                                </div>
                              )}

                              {req.comment && (
                                <p className="text-[9px] font-mono text-slate-500 italic bg-slate-50 border border-slate-100 p-2 rounded-lg">
                                  Mentor: "{req.comment}"
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-6 text-center border border-dashed border-purple-100 rounded-2xl">
                        <p className="text-[10px] text-slate-400 font-mono">No call requests yet.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Col: Certificates & History */}
                <div className="space-y-6">
                  {/* Certificates List */}
                  <div className="bg-white border border-purple-100 rounded-3xl p-5 shadow-xs">
                    <h3 className="text-sm font-bold font-mono mb-4 text-slate-800">My Certificates</h3>
                    
                    {progress?.certificates && progress.certificates.length > 0 ? (
                      <div className="space-y-3">
                        {progress.certificates.map((cert) => (
                          <div
                            key={cert.certificate_id}
                            className="p-3 border border-purple-50 hover:border-purple-100 rounded-2xl flex items-center justify-between gap-3 bg-purple-50/5 hover:bg-purple-50/20 transition-all"
                          >
                            <div>
                              <h4 className="text-xs font-bold font-mono text-slate-700">{cert.module_name}</h4>
                              <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                                Issued {new Date(cert.issued_at).toLocaleDateString()}
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                // Show certificate logic or redirect
                                router.push(`/certificates/${cert.certificate_id}`);
                              }}
                              className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-extrabold font-mono rounded-lg transition-colors cursor-pointer"
                            >
                              View
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center border border-dashed border-purple-100 rounded-2xl">
                        <Award className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-[10px] text-slate-400 font-mono">
                          Complete a learning roadmap to unlock certificates.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Booking Request Modal */}
              <AnimatePresence>
                {showCallRequestModal && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-[#1c1921]/60 backdrop-blur-xs flex justify-center items-center p-4 text-left"
                  >
                    <motion.div
                      initial={{ scale: 0.95, y: 15 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.95, y: 15 }}
                      className="bg-white border border-purple-100 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
                    >
                      <div>
                        <h3 className="text-sm font-bold font-mono text-slate-800 uppercase tracking-wider">Request Mentor Call</h3>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">Submit details to schedule a live checkpoint with your mentor.</p>
                      </div>

                      <form onSubmit={handleCreateBookingRequest} className="space-y-4 text-left">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold font-mono text-slate-500">Meeting Topic / Title</label>
                          <input
                            type="text"
                            placeholder="e.g. CV Review checkpoint, Backend doubts..."
                            value={callTitle}
                            onChange={(e) => setCallTitle(e.target.value)}
                            className="w-full p-3 border border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-hidden font-mono text-xs text-slate-700 bg-white"
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold font-mono text-slate-500">Details / Description (Optional)</label>
                          <textarea
                            placeholder="Provide details about what you want to discuss..."
                            value={callDescription}
                            onChange={(e) => setCallDescription(e.target.value)}
                            className="w-full h-24 p-3 border border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-hidden font-mono text-xs resize-none text-slate-700 bg-white"
                          />
                        </div>

                        <div className="flex gap-3 justify-end pt-2">
                          <button
                            type="button"
                            onClick={() => setShowCallRequestModal(false)}
                            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl font-mono text-xs font-semibold cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isCreatingBooking}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-mono text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                          >
                            {isCreatingBooking ? "Submitting..." : "Submit Request"}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            /* Admin Review Hub */
            <motion.div
              key="mentor-hub"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Left Column: Submissions List */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white border border-purple-100 rounded-3xl p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold font-mono text-slate-800">Pending Submissions</h3>
                    <span className="px-2.5 py-1 bg-red-100 text-red-700 text-[10px] font-extrabold font-mono rounded-full">
                      {pendingSubmissions?.length || 0} reviews left
                    </span>
                  </div>

                  {pendingSubmissions && pendingSubmissions.length > 0 ? (
                    <div className="space-y-3">
                      {pendingSubmissions.map((sub) => (
                        <div
                          key={sub.id}
                          onClick={() => setSelectedSubmission(sub)}
                          className={`p-4 border rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-4 ${
                            selectedSubmission?.id === sub.id
                              ? "border-purple-600 bg-purple-50/15"
                              : "border-purple-50 hover:border-purple-100 hover:bg-purple-50/5"
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold font-mono text-slate-700">{sub.task_title}</h4>
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono mt-1">
                              By {sub.student_name} ({sub.student_email})
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[9px] text-slate-400 font-mono block">
                              Submitted {new Date(sub.created_at).toLocaleDateString()}
                            </span>
                            <span className="text-[10px] font-semibold text-purple-600 font-mono mt-0.5 inline-block">
                              Review Now
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-10 text-center border border-dashed border-purple-100 rounded-3xl">
                      <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                      <p className="text-xs text-slate-500 font-mono">Workspace clean! No pending task reviews.</p>
                    </div>
                  )}
                </div>

                {/* Pending Call Requests */}
                <div className="bg-white border border-purple-100 rounded-3xl p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold font-mono text-slate-800">Pending Call Requests</h3>
                    <span className="px-2.5 py-1 bg-red-100 text-red-700 text-[10px] font-extrabold font-mono rounded-full animate-pulse">
                      {adminBookingRequests?.filter((r: any) => r.status === 'pending').length || 0} pending
                    </span>
                  </div>

                  {adminBookingRequests && adminBookingRequests.filter((r: any) => r.status === 'pending').length > 0 ? (
                    <div className="space-y-3">
                      {adminBookingRequests.filter((r: any) => r.status === 'pending').map((req: any) => (
                        <div
                          key={req.id}
                          onClick={() => {
                            setSelectedRequestForReview(req);
                            setSelectedSubmission(null);
                          }}
                          className={`p-4 border rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-4 ${
                            selectedRequestForReview?.id === req.id
                              ? "border-purple-600 bg-purple-50/15"
                              : "border-purple-50 hover:border-purple-100 hover:bg-purple-50/5"
                          }`}
                        >
                          <div>
                            <h4 className="text-xs font-bold font-mono text-slate-700">{req.title}</h4>
                            <p className="text-[10px] text-slate-400 font-mono mt-1">
                              By {req.student_name} ({req.student_email})
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[9px] text-slate-400 font-mono block">
                              Requested {new Date(req.created_at).toLocaleDateString()}
                            </span>
                            <span className="text-[10px] font-semibold text-purple-600 font-mono mt-0.5 inline-block">
                              Respond
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-10 text-center border border-dashed border-purple-100 rounded-3xl">
                      <CheckCircle className="w-12 h-12 text-emerald-450 mx-auto mb-2" />
                      <p className="text-xs text-slate-500 font-mono">No pending mentor call requests.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Review Console */}
              <div>
                <AnimatePresence mode="wait">
                  {selectedRequestForReview ? (
                    <motion.div
                      key={selectedRequestForReview.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="bg-white border border-purple-100 rounded-3xl p-5 shadow-xs space-y-5"
                    >
                      <div>
                        <span className="text-[9px] font-bold font-mono text-slate-400 uppercase font-bold text-[10px]">Call Request Review</span>
                        <h3 className="text-sm font-bold font-mono text-slate-800 mt-1">{selectedRequestForReview.title}</h3>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">Student: {selectedRequestForReview.student_name}</p>
                      </div>

                      {selectedRequestForReview.description && (
                        <div className="space-y-1.5 text-left">
                          <label className="text-[10px] font-bold font-mono text-slate-500">Student Details</label>
                          <div className="p-3 border border-purple-50 rounded-xl bg-purple-50/5 text-xs font-mono text-slate-700 whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
                            {selectedRequestForReview.description}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2 border-t border-purple-50 pt-3 text-left">
                        <label className="text-[10px] font-bold font-mono text-slate-500 block">Schedule Date & Time</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="date"
                            value={scheduledAtDate}
                            onChange={(e) => setScheduledAtDate(e.target.value)}
                            className="p-2 border border-purple-100 rounded-xl font-mono text-xs cursor-pointer bg-white text-slate-700"
                          />
                          <input
                            type="time"
                            value={scheduledAtTime}
                            onChange={(e) => setScheduledAtTime(e.target.value)}
                            className="p-2 border border-purple-100 rounded-xl font-mono text-xs cursor-pointer bg-white text-slate-700"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] font-bold font-mono text-slate-500 block">Feedback Comment (Optional)</label>
                        <textarea
                          value={adminResponseComment}
                          onChange={(e) => setAdminResponseComment(e.target.value)}
                          placeholder="Provide details about Meet agenda, or explain reject reason..."
                          className="w-full h-24 p-3 border border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-hidden font-mono text-xs resize-none text-slate-700 bg-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                          onClick={() => handleRespondToBooking("reject")}
                          disabled={isRespondingToBooking}
                          className="flex items-center justify-center gap-1.5 py-2.5 bg-red-50 hover:bg-red-100 text-red-750 border border-red-200 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" /> Reject Request
                        </button>
                        <button
                          onClick={() => handleRespondToBooking("approve")}
                          disabled={isRespondingToBooking}
                          className="flex items-center justify-center gap-1.5 py-2.5 bg-emerald-650 hover:bg-emerald-750 text-white rounded-xl font-mono text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4" /> Accept Call
                        </button>
                      </div>
                      <button
                        onClick={() => setSelectedRequestForReview(null)}
                        className="w-full py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl font-mono text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        Close
                      </button>
                    </motion.div>
                  ) : selectedSubmission ? (
                    <motion.div
                      key={selectedSubmission.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="bg-white border border-purple-100 rounded-3xl p-5 shadow-xs space-y-5"
                    >
                      <div>
                        <span className="text-[9px] font-bold font-mono text-slate-400 uppercase">Review Console</span>
                        <h3 className="text-sm font-bold font-mono text-slate-800 mt-1">{selectedSubmission.task_title}</h3>
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">Student: {selectedSubmission.student_name}</p>
                      </div>

                      {selectedSubmission.content && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold font-mono text-slate-500">Student Submission Content</label>
                          <div className="p-3 border border-purple-50 rounded-xl bg-purple-50/5 text-xs font-mono text-slate-700 whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
                            {selectedSubmission.content}
                          </div>
                        </div>
                      )}

                      {selectedSubmission.links && selectedSubmission.links.length > 0 && (
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold font-mono text-slate-500">Submitted Links</label>
                          <div className="p-3 border border-purple-50 rounded-xl bg-purple-50/5 text-xs font-mono text-slate-700 space-y-1.5 max-h-36 overflow-y-auto">
                            {selectedSubmission.links.map((link: string, idx: number) => (
                              <a
                                key={idx}
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-600 hover:underline flex items-center gap-1.5 break-all font-semibold"
                              >
                                <ExternalLink className="w-3.5 h-3.5 shrink-0 text-purple-600" />
                                {link}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold font-mono text-slate-500">Feedback Comment (Optional)</label>
                        <textarea
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="e.g. Looks good, approved! Or explain why it is rejected..."
                          className="w-full h-24 p-3 border border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-hidden font-mono text-xs resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                          onClick={() => handleReview("reject")}
                          disabled={isReviewing}
                          className="flex items-center justify-center gap-1.5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                        <button
                          onClick={() => handleReview("approve")}
                          disabled={isReviewing}
                          className="flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-mono text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4" /> Approve
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="no-selection"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-6 text-center border border-purple-100 bg-purple-50/5 rounded-3xl"
                    >
                      <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-500 font-mono">
                        Select a pending task from the list to open the review console.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

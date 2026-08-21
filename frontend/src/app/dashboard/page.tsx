"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  useRespondToBookingRequestMutation,
  useGetRoadmapDetailsQuery,
  useGetTestHistoryQuery,
  useGetMyProfileQuery
} from "@/store/api/learningApi";
import { useGetMeQuery } from "@/store/api/authApi";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid
} from "recharts";
import {
  Search,
  Bell,
  Pencil,
  Calendar,
  ChevronLeft,
  BookOpen,
  Briefcase,
  Clock,
  Target,
  Sparkles,
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

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, hasCompletedOnboarding } = useCompany();
  
  const { data: userProfile, isLoading: isUserLoading } = useGetMeQuery(undefined, {
    skip: !isAuthenticated,
  });

  const { data: progress, refetch: refetchProgress, isLoading: isProgressLoading } = useGetProgressQuery(undefined, {
    skip: !isAuthenticated,
  });

  const { data: testHistory } = useGetTestHistoryQuery(undefined, {
    skip: !isAuthenticated,
  });

  const { data: myProfile } = useGetMyProfileQuery(undefined, {
    skip: !isAuthenticated,
  });

  const { data: userBookingRequests, refetch: refetchUserBookings } = useGetUserBookingRequestsQuery(undefined, {
    skip: !isAuthenticated || (userProfile && userProfile.user?.role === "admin"),
  });

  const activeRoadmap = progress?.roadmaps?.find((r) => r.status === "in_progress");

  const { data: roadmapDetails } = useGetRoadmapDetailsQuery(
    activeRoadmap?.roadmap_id || "",
    {
      skip: !activeRoadmap?.roadmap_id,
    }
  );

  // New States and Memos for Awwwards-level Student Dashboard Redesign
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date>(new Date());
  const [baseCalendarDate, setBaseCalendarDate] = useState<Date>(new Date());

  const calendarDays = React.useMemo(() => {
    const days = [];
    const startOfWeek = new Date(baseCalendarDate);
    const day = startOfWeek.getDay();
    // Adjust start of week to Monday (Monday is index 1, Sunday is 0)
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  }, [baseCalendarDate]);

  const upcomingEvents = React.useMemo(() => {
    const events: any[] = [];
    
    // 1. Fetch real approved booking requests
    (userBookingRequests || [])
      .filter((req: any) => req.status === "approved" && req.scheduled_at)
      .forEach((req: any) => {
        const sched = new Date(req.scheduled_at);
        events.push({
          id: req.id,
          title: req.title,
          time: sched.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: sched,
          type: 'meeting',
          color: 'bg-[#7C3AED]/20 text-[#7C3AED] border border-[#7C3AED]/30',
          link: req.meet_link
        });
      });

    // 2. Dynamically generate context-aware session deadlines based on their active roadmap
    const baseDate = activeRoadmap ? new Date(activeRoadmap.created_at) : new Date();
    
    const templates = activeRoadmap
      ? [
          { title: `${activeRoadmap.module_name} Sync`, offset: 0, time: '09:30 AM', type: 'Sync', color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
          { title: 'Project Laboratory Checkpoint', offset: 2, time: '11:30 AM', type: 'Design', color: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
          { title: 'RAG Systems Research Session', offset: 4, time: '01:30 PM', type: 'Research', color: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' },
          { title: 'Peer Review & Evaluation', offset: 6, time: '03:00 PM', type: 'Review', color: 'bg-rose-500/10 text-rose-555 border border-rose-500/20' }
        ]
      : [
          { title: 'Onboarding & Track Induction', offset: 0, time: '09:30 AM', type: 'Induction', color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
          { title: 'Diagnostics Results Calibrator', offset: 1, time: '11:30 AM', type: 'Calibrator', color: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' }
        ];

    templates.forEach((t, i) => {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + t.offset);
      events.push({
        id: `dyn-evt-${i}`,
        title: t.title,
        time: t.time,
        date: d,
        type: t.type,
        color: t.color,
        link: undefined
      });
    });

    return events;
  }, [userBookingRequests, activeRoadmap]);

  // Filter events matching the clicked date
  const filteredEventsForDate = React.useMemo(() => {
    return upcomingEvents.filter(evt => evt.date.toDateString() === selectedCalendarDate.toDateString());
  }, [upcomingEvents, selectedCalendarDate]);

  const activeRoadmapTasks = React.useMemo(() => {
    if (!roadmapDetails || !roadmapDetails.sections) {
      // High-fidelity fallback assignments if no active roadmap exists (matches photo!)
      return [
        { id: 't-1', title: 'Typography test', status: 'completed', grade: '190/200' },
        { id: 't-2', title: 'Inclusive design test', status: 'completed', grade: '160/200' },
        { id: 't-3', title: 'Drawing test', status: 'not_started', grade: '--/200' }
      ];
    }
    
    const tasks: any[] = [];
    roadmapDetails.sections.forEach((section) => {
      section.tasks.forEach((task) => {
        tasks.push({
          id: task.id,
          title: task.title,
          status: task.status,
          grade: task.status === 'completed' ? 'Pass' : '--/100'
        });
      });
    });
    return tasks.slice(0, 4);
  }, [roadmapDetails]);

  const avgScore = React.useMemo(() => {
    if (!testHistory?.history?.length) return 75;
    const scores = testHistory.history.filter(h => h.score !== null).map(h => h.score as number);
    if (!scores.length) return 75;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [testHistory]);

  const performanceData = React.useMemo(() => {
    if (!testHistory?.history?.length) {
      return [
        { month: 'Jan', actual: 40, goal: 50 },
        { month: 'Feb', actual: 45, goal: 55 },
        { month: 'Mar', actual: 60, goal: 60 },
        { month: 'Apr', actual: 55, goal: 70 },
        { month: 'May', actual: 75, goal: 75 },
        { month: 'Jun', actual: 85, goal: 80 }
      ];
    }
    return testHistory.history.slice(0, 6).reverse().map((item, index) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const date = new Date(item.created_at);
      return {
        month: months[date.getMonth()],
        actual: item.score || 0,
        goal: 70 + (index * 4)
      };
    });
  }, [testHistory]);

  const weeklyStudyHours = React.useMemo(() => {
    return calendarDays.map((day) => {
      const dayName = day.toLocaleString('default', { weekday: 'short' }).slice(0, 1);
      let hours = 0.5; // default base reading time
      
      if (testHistory?.history) {
        testHistory.history.forEach((test) => {
          const testDate = new Date(test.created_at);
          if (testDate.toDateString() === day.toDateString()) {
            hours += 3.5;
          }
        });
      }
      
      if (activeRoadmap && activeRoadmap.status === "in_progress") {
        const roadmapDate = new Date(activeRoadmap.created_at);
        if (roadmapDate.toDateString() === day.toDateString()) {
          hours += 2.0;
        }
      }
      
      return {
        name: dayName,
        hours: Math.min(hours, 8)
      };
    });
  }, [calendarDays, testHistory, activeRoadmap]);

  const totalWeeklyHours = React.useMemo(() => {
    return weeklyStudyHours.reduce((acc, curr) => acc + curr.hours, 0).toFixed(1);
  }, [weeklyStudyHours]);

  const examsPassedThisWeek = React.useMemo(() => {
    if (!testHistory?.history) return 0;
    return testHistory.history.filter((test) => {
      const testDate = new Date(test.created_at);
      const isInVisibleWeek = calendarDays.some(d => d.toDateString() === testDate.toDateString());
      return isInVisibleWeek && test.score !== null && test.score >= 50;
    }).length;
  }, [testHistory, calendarDays]);

  const { data: modules } = useGetModulesQuery();
  const [generateTest, { isLoading: isGeneratingTest }] = useGenerateTestMutation();
  const [generateSummary, { isLoading: isGeneratingSummary }] = useGenerateSkillSummaryMutation();
  const [generateRoadmap, { isLoading: isGeneratingRoadmap }] = useGenerateRoadmapMutation();

  const [activeTab, setActiveTab] = useState<"student" | "mentor">("student");

  // Onboarding & Auth checks
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("seekh_auth_token") : null;
    if (!token) {
      router.push("/login");
    } else if (userProfile) {
      if (userProfile.user?.role === "admin") {
        router.push("/admin");
      } else if (!hasCompletedOnboarding) {
        router.push("/onboarding");
      }
    }
  }, [userProfile, hasCompletedOnboarding, router]);

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
      <main className="flex-1 ml-0 md:ml-20 p-6 md:p-10 pt-20 md:pt-10 w-full overflow-x-hidden">
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
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Left Column - Main Content (Col Span 2) */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* 1. Header welcome banner (Integrated with search & bell) */}
                <div className="bg-[#1E192B] border border-white/5 rounded-3xl p-6 md:p-8 relative overflow-hidden text-white shadow-xl">
                  {/* Glowing blobs */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#7C3AED]/15 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                        <span className="text-[10px] font-bold font-mono text-[#D8CBEB] uppercase tracking-wider">
                          STUDENT WORKSPACE ACTIVE
                        </span>
                      </div>
                      <h2 className="text-xl md:text-2xl font-black font-mono tracking-tight text-white">
                        Hello {userProfile?.user?.name?.split(' ')[0] || "Student"} 👋
                      </h2>
                      <p className="text-xs text-[#D8CBEB]/70 font-mono">
                        Let's learn something new today!
                      </p>
                    </div>

                    {/* Search & Notifications */}
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search track lessons..."
                          className="pl-9 pr-4 py-2 bg-black/35 border border-[#D8CBEB]/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#7C3AED] font-mono text-xs text-white placeholder-slate-550 w-44 sm:w-56"
                        />
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      </div>
                      <button className="p-2.5 bg-black/35 border border-[#D8CBEB]/10 rounded-xl text-[#D8CBEB] hover:bg-black/55 transition-colors relative cursor-pointer">
                        <Bell className="w-4 h-4" />
                        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose-500" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Overview Stats (Real values combined with fallbacks) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Course in progress */}
                  <div className="bg-[#FFFFFF] border border-[#D8CBEB]/30 rounded-3xl p-6 shadow-xs flex flex-col justify-between h-36 relative overflow-hidden transition-all hover:translate-y-[-2px] hover:shadow-md cursor-pointer" onClick={() => activeRoadmap && router.push(`/roadmaps?id=${activeRoadmap.roadmap_id}`)}>
                    <div className="flex justify-between items-start">
                      <div className="p-3 bg-purple-50 rounded-xl text-[#7C3AED]">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
                    </div>
                    <div>
                      <div className="text-3xl font-black font-mono text-[#1E192B]">
                        {progress?.roadmaps?.filter(r => r.status === "in_progress").length || 0}
                      </div>
                      <div className="text-xs text-slate-400 font-bold font-mono uppercase tracking-wider mt-1">
                        Active Paths
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#7C3AED]" />
                  </div>

                  {/* Course completed */}
                  <div className="bg-[#FFFFFF] border border-[#D8CBEB]/30 rounded-3xl p-6 shadow-xs flex flex-col justify-between h-36 relative overflow-hidden transition-all hover:translate-y-[-2px] hover:shadow-md">
                    <div className="flex justify-between items-start">
                      <div className="p-3 bg-emerald-50 rounded-xl text-[#10B981]">
                        <Trophy className="w-6 h-6" />
                      </div>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                    </div>
                    <div>
                      <div className="text-3xl font-black font-mono text-[#1E192B]">
                        {completedRoadmaps.length || 0}
                      </div>
                      <div className="text-xs text-slate-400 font-bold font-mono uppercase tracking-wider mt-1">
                        Completed
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#10B981]" />
                  </div>

                  {/* Certificates earned */}
                  <div className="bg-[#FFFFFF] border border-[#D8CBEB]/30 rounded-3xl p-6 shadow-xs flex flex-col justify-between h-36 relative overflow-hidden transition-all hover:translate-y-[-2px] hover:shadow-md">
                    <div className="flex justify-between items-start">
                      <div className="p-3 bg-indigo-50 rounded-xl text-indigo-650">
                        <Award className="w-6 h-6" />
                      </div>
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-650" />
                    </div>
                    <div>
                      <div className="text-3xl font-black font-mono text-[#1E192B]">
                        {progress?.certificates?.length || 0}
                      </div>
                      <div className="text-xs text-slate-400 font-bold font-mono uppercase tracking-wider mt-1">
                        Certificates
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#4338CA]" />
                  </div>

                  {/* Community / Bookings */}
                  <div className="bg-[#FFFFFF] border border-[#D8CBEB]/30 rounded-3xl p-6 shadow-xs flex flex-col justify-between h-36 relative overflow-hidden transition-all hover:translate-y-[-2px] hover:shadow-md cursor-pointer" onClick={() => setShowCallRequestModal(true)}>
                    <div className="flex justify-between items-start">
                      <div className="p-3 bg-amber-50 rounded-xl text-[#F59E0B]">
                        <Video className="w-6 h-6" />
                      </div>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse" />
                    </div>
                    <div>
                      <div className="text-3xl font-black font-mono text-[#1E192B]">
                        {userBookingRequests?.length || 0}
                      </div>
                      <div className="text-xs text-slate-400 font-bold font-mono uppercase tracking-wider mt-1">
                        Mentor Calls
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#F59E0B]" />
                  </div>
                </div>

                {/* 3. Grid for Actively Hours & Performance Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Actively Hours (Weekly Chart) */}
                  <div className="bg-[#FFFFFF] border border-[#D8CBEB]/30 rounded-3xl p-6 shadow-xs flex flex-col justify-between h-[420px]">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-sm font-bold font-mono text-[#1E192B]">Actively Hours</h3>
                        <p className="text-[10px] text-slate-400 font-mono">Weekly study volume</p>
                      </div>
                      <span className="px-2 py-0.5 bg-[#F5F2FA] text-[8px] font-bold font-mono text-[#7C3AED] rounded-md border border-[#D8CBEB] uppercase">
                        Weekly
                      </span>
                    </div>

                    <div className="flex-1 flex gap-4 items-center min-h-0">
                      {/* Recharts Bar */}
                      <div className="w-[60%] h-full min-h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={weeklyStudyHours}
                            margin={{ top: 10, right: 5, left: -25, bottom: 5 }}
                          >
                            <XAxis dataKey="name" stroke="#94A3B8" fontSize={9} fontStyle="monospace" tickLine={false} axisLine={false} />
                            <YAxis stroke="#94A3B8" fontSize={9} fontStyle="monospace" tickLine={false} axisLine={false} />
                            <Tooltip 
                              cursor={{ fill: 'rgba(124,58,237,0.05)' }} 
                              contentStyle={{ background: '#1E192B', borderColor: 'rgba(216,203,235,0.2)', borderRadius: '12px', fontSize: '10px', color: '#FFF', fontFamily: 'monospace' }}
                            />
                            <Bar dataKey="hours" fill="#7C3AED" radius={[10, 10, 0, 0]} barSize={12} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Bar chart stats */}
                      <div className="w-[40%] space-y-4 border-l border-[#D8CBEB]/30 pl-4 font-mono">
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold">Time spent</div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-base font-black text-[#1E192B]">{totalWeeklyHours}h</span>
                            <span className="text-[9px] font-extrabold text-[#10B981]">+85%</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold">Tasks complete</div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-base font-black text-[#1E192B]">{activeRoadmap?.tasks_completed || 0}</span>
                            <span className="text-[9px] font-extrabold text-[#10B981]">+79%</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-bold">Exams passed</div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-base font-black text-[#1E192B]">
                              {examsPassedThisWeek}
                            </span>
                            <span className="text-[9px] font-extrabold text-[#10B981]">100%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Performance Trends Chart */}
                  <div className="bg-[#FFFFFF] border border-[#D8CBEB]/30 rounded-3xl p-6 shadow-xs flex flex-col justify-between h-[420px]">
                    <div className="mb-2">
                      <h3 className="text-sm font-bold font-mono text-[#1E192B]">Performance</h3>
                      <p className="text-[10px] text-slate-400 font-mono">Assessment scores comparison</p>
                    </div>

                    <div className="flex-1 min-h-[160px] w-full mt-2 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={performanceData}
                          margin={{ top: 10, right: 5, left: -25, bottom: 5 }}
                        >
                          <defs>
                            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorGoal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                          <XAxis dataKey="month" stroke="#94A3B8" fontSize={9} fontStyle="monospace" tickLine={false} axisLine={false} />
                          <YAxis stroke="#94A3B8" fontSize={9} fontStyle="monospace" tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ background: '#1E192B', borderColor: 'rgba(216,203,235,0.2)', borderRadius: '12px', fontSize: '10px', color: '#FFF', fontFamily: 'monospace' }} />
                          <Area type="monotone" dataKey="actual" name="My Score" stroke="#7C3AED" strokeWidth={2.5} fillOpacity={1} fill="url(#colorActual)" />
                          <Area type="monotone" dataKey="goal" name="Class Goal" stroke="#10B981" strokeWidth={1.5} strokeDasharray="3 3" fillOpacity={1} fill="url(#colorGoal)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="pt-3 border-t border-[#D8CBEB]/30 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#10B981]" />
                      <span className="text-[10px] font-mono text-slate-500">
                        Average score: <strong className="text-[#1E192B] font-bold">{avgScore}%</strong> (40% higher compared to target).
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Active Roadmap / Welcome diagnostics fallback */}
                {!activeRoadmap ? (
                  hasCompletedOnboarding ? (
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
                             className="w-full p-4 border border-purple-100 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-hidden font-mono text-xs bg-purple-50/5 cursor-pointer text-slate-700"
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
                  )
                ) : null}

                {/* 5. My Assignments Table */}
                <div className="bg-[#FFFFFF] border border-[#D8CBEB]/30 rounded-3xl p-6 md:p-8 shadow-xs">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-sm font-bold font-mono text-[#1E192B]">My Assignments</h3>
                      <p className="text-[10px] text-slate-400 font-mono">Real-time learning objectives</p>
                    </div>
                    {activeRoadmap && (
                      <button
                        onClick={() => router.push(`/roadmaps?id=${activeRoadmap.roadmap_id}`)}
                        className="text-[10px] font-bold font-mono text-[#7C3AED] hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        All assignments <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-xs">
                      <thead>
                        <tr className="border-b border-[#D8CBEB]/20 pb-3 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                          <th className="py-2">Task</th>
                          <th className="py-2">Weight</th>
                          <th className="py-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#D8CBEB]/10">
                        {activeRoadmapTasks.map((task: any, index: number) => {
                          let badgeStyle = "bg-slate-100 text-slate-650";
                          if (task.status === "completed" || task.status === "approved") {
                            badgeStyle = "bg-emerald-500/10 text-[#10B981]";
                          } else if (task.status === "pending_review") {
                            badgeStyle = "bg-amber-500/10 text-[#F59E0B]";
                          } else if (task.status === "not_started" || task.status === "upcoming") {
                            badgeStyle = "bg-rose-500/10 text-rose-550";
                          }

                          return (
                            <tr key={task.id} className="hover:bg-purple-50/5 transition-colors">
                              <td className="py-3.5 pr-4 flex items-center gap-3">
                                <span className="w-6 h-6 rounded-lg bg-[#F5F2FA] text-[10px] font-bold text-slate-500 flex items-center justify-center border border-[#D8CBEB] shrink-0">
                                  {index + 1}
                                </span>
                                <div>
                                  <div className="font-bold text-slate-700">{task.title}</div>
                                  <div className="text-[9px] text-slate-400">Exercise unit</div>
                                </div>
                              </td>
                              <td className="py-3.5 text-slate-500 font-bold">
                                {task.grade || (task.status === "completed" ? "Pass" : "--/100")}
                              </td>
                              <td className="py-3.5 text-right">
                                <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-md uppercase ${badgeStyle}`}>
                                  {task.status.replace('_', ' ')}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 6. My Learning Paths List (All roadmaps list below) */}
                {progress?.roadmaps && progress.roadmaps.length > 0 && (
                  <div className="bg-[#FFFFFF] border border-[#D8CBEB]/30 rounded-3xl p-6 md:p-8 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-[#D8CBEB]/20 pb-3">
                      <h3 className="text-xs font-bold font-mono text-[#1E192B] uppercase tracking-wider">My Learning Paths</h3>
                      <span className="px-2 py-0.5 bg-[#F5F2FA] text-[9px] font-bold font-mono text-[#7C3AED] rounded-md border border-[#D8CBEB]">
                        {progress.roadmaps.length} Total
                      </span>
                    </div>

                    <div className="space-y-3">
                      {progress.roadmaps.map((r) => {
                        let statusColor = "bg-slate-100 text-slate-650";
                        if (r.status === "completed") {
                          statusColor = "bg-emerald-150 text-emerald-700";
                        } else if (r.status === "in_progress") {
                          statusColor = "bg-purple-150 text-[#7C3AED]";
                        } else if (r.status === "abandoned") {
                          statusColor = "bg-red-150 text-red-700";
                        }

                        return (
                          <div key={r.roadmap_id} className="p-4 border border-[#D8CBEB]/20 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-purple-50/5 hover:bg-purple-50/10 transition-all">
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-xs font-bold font-mono text-slate-700 truncate">{r.module_name}</h4>
                                <span className={`px-2 py-0.5 text-[8px] font-bold font-mono rounded-md uppercase ${statusColor}`}>
                                  {r.status === 'abandoned' ? 'deleted' : r.status.replace('_', ' ')}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-450 font-mono">
                                Created {new Date(r.created_at).toLocaleDateString()} &middot; {r.tasks_completed}/{r.tasks_total} exercises approved ({r.progress_percentage}%)
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {r.status === "in_progress" && (
                                <>
                                  <button
                                    onClick={() => router.push(`/roadmaps?id=${r.roadmap_id}`)}
                                    className="px-3 py-1.5 bg-[#7C3AED] hover:bg-purple-700 text-white text-[10px] font-bold font-mono rounded-lg transition-colors cursor-pointer"
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
                                  className="px-3 py-1.5 bg-[#7C3AED] hover:bg-purple-700 text-white text-[10px] font-bold font-mono rounded-lg transition-colors cursor-pointer"
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

              </div>

              {/* Right Column - User Profile & Calendar (Col Span 1) */}
              <div className="space-y-6">
                
                {/* 1. Profile Summary Card */}
                <div className="bg-[#FFFFFF] border border-[#D8CBEB]/30 rounded-3xl p-6 shadow-xs text-center relative overflow-hidden flex flex-col items-center">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#7C3AED]/5 rounded-full blur-xl pointer-events-none" />
                  
                  <div className="relative mb-4 group cursor-pointer" onClick={() => router.push('/settings')}>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#7C3AED] to-[#D8CBEB] opacity-0 group-hover:opacity-100 transition-opacity blur-xs -m-0.5" />
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#7C3AED] bg-[#F5F2FA] relative flex items-center justify-center text-[#7C3AED] font-black text-2xl font-mono">
                      {myProfile?.profile?.avatar_url ? (
                        <img
                          src={myProfile.profile.avatar_url}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        userProfile?.user?.name ? userProfile.user.name.charAt(0) : "S"
                      )}
                    </div>
                    <div className="absolute bottom-0 right-0 p-1 bg-white border border-[#D8CBEB] rounded-full text-slate-500 shadow-xs">
                      <Pencil className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <h3 className="text-base font-bold font-mono text-[#1E192B]">
                    {userProfile?.user?.name || "Student Profile"}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {myProfile?.profile?.education || "College Student"}
                  </p>
                  
                  <div className="mt-4 px-3 py-1 bg-[#F5F2FA] border border-[#D8CBEB] rounded-full text-[9px] font-extrabold font-mono text-[#7C3AED] uppercase tracking-wider">
                    {myProfile?.profile?.career_goal || "General Track"}
                  </div>
                </div>

                {/* 2. Horizontally scrollable calendar */}
                <div className="bg-[#FFFFFF] border border-[#D8CBEB]/30 rounded-3xl p-5 shadow-xs">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-extrabold font-mono text-[#1E192B]">
                      {selectedCalendarDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          const prev = new Date(baseCalendarDate);
                          prev.setDate(baseCalendarDate.getDate() - 7);
                          setBaseCalendarDate(prev);
                          
                          const prevSel = new Date(selectedCalendarDate);
                          prevSel.setDate(selectedCalendarDate.getDate() - 7);
                          setSelectedCalendarDate(prevSel);
                        }}
                        className="p-1 bg-[#F5F2FA] hover:bg-[#D8CBEB]/35 border border-[#D8CBEB] rounded-lg text-slate-500 transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => {
                          const next = new Date(baseCalendarDate);
                          next.setDate(baseCalendarDate.getDate() + 7);
                          setBaseCalendarDate(next);
                          
                          const nextSel = new Date(selectedCalendarDate);
                          nextSel.setDate(selectedCalendarDate.getDate() + 7);
                          setSelectedCalendarDate(nextSel);
                        }}
                        className="p-1 bg-[#F5F2FA] hover:bg-[#D8CBEB]/35 border border-[#D8CBEB] rounded-lg text-slate-500 transition-colors cursor-pointer"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                    {calendarDays.map((d, index) => {
                      const isToday = d.toDateString() === new Date().toDateString();
                      const isSelected = d.toDateString() === selectedCalendarDate.toDateString();
                      
                      return (
                        <button
                          key={index}
                          onClick={() => setSelectedCalendarDate(d)}
                          className={`flex flex-col items-center justify-center w-12 py-3 rounded-xl border font-mono transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-[#7C3AED] border-[#7C3AED] text-white shadow-xs' 
                              : isToday
                                ? 'bg-[#7C3AED]/10 border-[#7C3AED]/20 text-[#7C3AED]'
                                : 'bg-[#FFFFFF] border-slate-100 hover:border-[#D8CBEB] text-slate-655'
                          }`}
                        >
                          <span className="text-[9px] font-bold uppercase">
                            {d.toLocaleString('default', { weekday: 'short' }).slice(0, 3)}
                          </span>
                          <span className="text-sm font-black mt-1">
                            {d.getDate()}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Upcoming Events Timeline */}
                <div className="bg-[#FFFFFF] border border-[#D8CBEB]/30 rounded-3xl p-6 shadow-xs">
                  <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#D8CBEB]/10">
                    <h3 className="text-xs font-bold font-mono text-[#1E192B] uppercase tracking-wider">
                      Upcoming Events
                    </h3>
                    <span className="px-1.5 py-0.5 bg-[#F5F2FA] text-[8px] font-bold font-mono text-[#7C3AED] rounded-md border border-[#D8CBEB]/20">
                      {selectedCalendarDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {filteredEventsForDate.length > 0 ? (
                      filteredEventsForDate.map((evt) => {
                        return (
                          <div key={evt.id} className="flex gap-4 items-start relative">
                            {/* Timeline dot */}
                            <div className="flex flex-col items-center shrink-0">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED] border-2 border-white shadow-xs" />
                              <span className="w-0.5 h-12 bg-slate-100 mt-1" />
                            </div>
                            
                            {/* Event info */}
                            <div className="flex-1 space-y-1">
                              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                                <span className="flex items-center gap-1 font-bold">
                                  <Clock className="w-3 h-3 text-[#7C3AED]" /> {evt.time}
                                </span>
                                <span className="capitalize">{evt.type}</span>
                              </div>
                              
                              <div className={`p-3 rounded-2xl text-[11px] font-mono font-bold ${evt.color}`}>
                                <div>{evt.title}</div>
                                {evt.link && (
                                  <a 
                                    href={evt.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-lg transition-colors text-[9px] font-bold border border-white/15 cursor-pointer"
                                  >
                                    <Video className="w-3 h-3" /> Join Meeting
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-8 text-center border border-dashed border-[#D8CBEB]/30 rounded-2xl bg-purple-50/5">
                        <Calendar className="w-8 h-8 text-slate-350 mx-auto mb-2" />
                        <p className="text-[10px] text-slate-400 font-mono">No events scheduled for this day.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Active Roadmap Info (Shows detailed progress status) */}
                {activeRoadmap && (
                  <div className="bg-[#1E192B] border border-white/5 rounded-3xl p-5 shadow-xs text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#7C3AED]/10 rounded-full blur-xl pointer-events-none" />
                    
                    <span className="px-2 py-0.5 bg-[#7C3AED]/20 text-[#D8CBEB] text-[8px] font-bold font-mono rounded-md border border-[#D8CBEB]/10 uppercase">
                      Active Curriculum
                    </span>
                    
                    <h4 className="text-sm font-bold font-mono text-white mt-3 truncate">
                      {activeRoadmap.module_name}
                    </h4>
                    
                    <div className="mt-4 flex justify-between items-baseline font-mono">
                      <span className="text-[10px] text-[#D8CBEB]/70">Learning Path Progress</span>
                      <span className="text-base font-black text-[#D8CBEB]">{activeRoadmap.progress_percentage}%</span>
                    </div>

                    <div className="w-full h-1.5 bg-black/30 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#7C3AED] to-[#D8CBEB] rounded-full transition-all duration-500"
                        style={{ width: `${activeRoadmap.progress_percentage}%` }}
                      />
                    </div>

                    <div className="mt-4 flex justify-between items-center pt-3 border-t border-white/5">
                      <span className="text-[9px] font-mono text-slate-400">
                        {activeRoadmap.tasks_completed} of {activeRoadmap.tasks_total} items
                      </span>
                      <button
                        onClick={() => router.push(`/roadmaps?id=${activeRoadmap.roadmap_id}`)}
                        className="flex items-center gap-0.5 px-3 py-1 bg-white hover:bg-slate-100 text-[#1E192B] rounded-lg font-mono text-[9px] font-bold transition-all cursor-pointer"
                      >
                        Study <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* 5. Certificates Card */}
                <div className="bg-[#FFFFFF] border border-[#D8CBEB]/30 rounded-3xl p-5 shadow-xs">
                  <h3 className="text-xs font-bold font-mono mb-4 text-[#1E192B] uppercase tracking-wider border-b border-[#D8CBEB]/15 pb-2">My Certificates</h3>
                  
                  {progress?.certificates && progress.certificates.length > 0 ? (
                    <div className="space-y-3">
                      {progress.certificates.map((cert) => (
                        <div
                          key={cert.certificate_id}
                          className="p-3 border border-[#D8CBEB]/20 hover:border-purple-200 rounded-2xl flex items-center justify-between gap-3 bg-purple-50/5 hover:bg-purple-50/20 transition-all"
                        >
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold font-mono text-slate-700 truncate">{cert.module_name}</h4>
                            <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                              Issued {new Date(cert.issued_at).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              router.push(`/certificates/${cert.certificate_id}`);
                            }}
                            className="px-2.5 py-1.5 bg-[#F5F2FA] border border-[#D8CBEB] hover:bg-[#D8CBEB]/20 text-[#7C3AED] text-[10px] font-extrabold font-mono rounded-lg transition-colors cursor-pointer shrink-0"
                          >
                            View
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center border border-dashed border-purple-100 rounded-2xl">
                      <Award className="w-8 h-8 text-slate-350 mx-auto mb-2" />
                      <p className="text-[9px] text-slate-400 font-mono">
                        Complete a learning roadmap to unlock certificates.
                      </p>
                    </div>
                  )}
                </div>

                {/* 6. Book Mentor Call Section */}
                <div className="bg-[#FFFFFF] border border-[#D8CBEB]/30 rounded-3xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#D8CBEB]/15 pb-3">
                    <div>
                      <h3 className="text-xs font-bold font-mono text-[#1E192B] uppercase tracking-wider">Book Mentor Session</h3>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5">Request a 1-on-1 checkpoint.</p>
                    </div>
                    <button
                      onClick={() => setShowCallRequestModal(true)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#7C3AED] hover:bg-purple-700 text-white rounded-lg font-mono text-[10px] font-bold transition-all shadow-xs cursor-pointer"
                    >
                      Request Call
                    </button>
                  </div>

                  {userBookingRequests && userBookingRequests.length > 0 ? (
                    <div className="space-y-3">
                      {userBookingRequests.slice(0, 2).map((req: any) => {
                        let reqStatusColor = "bg-slate-100 text-slate-650";
                        if (req.status === "approved") reqStatusColor = "bg-emerald-100 text-emerald-700";
                        if (req.status === "rejected") reqStatusColor = "bg-red-100 text-red-700";

                        return (
                          <div key={req.id} className="p-3 border border-[#D8CBEB]/20 rounded-2xl bg-purple-50/5 space-y-2">
                            <div className="flex justify-between items-start gap-3">
                              <div>
                                <h4 className="text-xs font-bold font-mono text-slate-700 line-clamp-1">{req.title}</h4>
                                {req.description && (
                                  <p className="text-[9px] text-slate-500 font-mono mt-0.5 line-clamp-1">{req.description}</p>
                                )}
                              </div>
                              <span className={`px-2 py-0.5 text-[8px] font-bold font-mono rounded-md uppercase ${reqStatusColor}`}>
                                {req.status}
                              </span>
                            </div>

                            {req.status === "approved" && (
                              <div className="p-2 bg-emerald-50/30 border border-emerald-100 rounded-xl space-y-2 text-[9px] font-mono">
                                <div className="text-emerald-805">
                                  <strong>Scheduled:</strong> {new Date(req.scheduled_at).toLocaleString()}
                                </div>
                                <a
                                  href={req.meet_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center gap-1.5 w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-center transition-colors cursor-pointer text-[9px]"
                                >
                                  <Video className="w-3 h-3" /> Join Google Meet
                                </a>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-4 text-center border border-dashed border-[#D8CBEB]/20 rounded-2xl">
                      <p className="text-[9px] text-slate-400 font-mono">No call requests yet.</p>
                    </div>
                  )}
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
                      className="bg-[#FFFFFF] border border-[#D8CBEB]/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
                    >
                      <div>
                        <h3 className="text-sm font-bold font-mono text-[#1E192B] uppercase tracking-wider">Request Mentor Call</h3>
                        <p className="text-[10px] text-slate-450 font-mono mt-0.5">Submit details to schedule a live checkpoint with your mentor.</p>
                      </div>

                      <form onSubmit={handleCreateBookingRequest} className="space-y-4 text-left">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold font-mono text-slate-500">Meeting Topic / Title</label>
                          <input
                            type="text"
                            placeholder="e.g. CV Review checkpoint, Backend doubts..."
                            value={callTitle}
                            onChange={(e) => setCallTitle(e.target.value)}
                            className="w-full p-3 border border-[#D8CBEB]/30 rounded-xl focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent outline-hidden font-mono text-xs text-slate-700 bg-white"
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold font-mono text-[#1E192B]/75">Details / Description (Optional)</label>
                          <textarea
                            placeholder="Provide details about what you want to discuss..."
                            value={callDescription}
                            onChange={(e) => setCallDescription(e.target.value)}
                            className="w-full h-24 p-3 border border-[#D8CBEB]/30 rounded-xl focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent outline-hidden font-mono text-xs resize-none text-slate-700 bg-white"
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
                            className="px-4 py-2 bg-[#7C3AED] hover:bg-purple-700 text-white rounded-xl font-mono text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
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

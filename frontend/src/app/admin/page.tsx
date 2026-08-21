"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  Loader2,
  CheckCircle,
  XCircle,
  Users,
  Calendar,
  ClipboardList,
  ChevronRight,
  Video,
  ExternalLink,
  TrendingUp,
  Activity,
  ArrowRight,
  BarChart as BarChartIcon,
  Zap,
  Target,
  Award
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { HoverSidebar } from "@/components/layout/HoverSidebar";
import { useCompany } from "@/context/CompanyContext";
import { useGetMeQuery } from "@/store/api/authApi";
import {
  useGetPendingSubmissionsQuery,
  useReviewSubmissionMutation,
  useBookMentorCallMutation,
  useGetAdminBookingRequestsQuery,
  useRespondToBookingRequestMutation,
  useGetAllUsersQuery
} from "@/store/api/learningApi";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";

// Premium Colors for Pie Chart
const COLORS = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981'];

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isAuthenticated } = useCompany();

  // 1. Fetch current user to verify admin role
  const { data: userProfile, isLoading: isUserLoading } = useGetMeQuery(undefined, {
    skip: !isAuthenticated,
  });

  // Protect route
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("seekh_auth_token") : null;
    if (!token) {
      router.push("/login");
    } else if (userProfile && userProfile.user?.role !== "admin") {
      toast.error("Access Denied: Mentors/Admins only.");
      router.push("/dashboard");
    }
  }, [userProfile, router]);

  // Submissions State
  const { data: pendingSubmissions, refetch: refetchPending, isLoading: isSubmissionsLoading } = useGetPendingSubmissionsQuery(undefined, {
    skip: !userProfile || userProfile.user?.role !== "admin",
  });
  const [reviewSubmission, { isLoading: isReviewing }] = useReviewSubmissionMutation();
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [reviewComment, setReviewComment] = useState("");

  // Booking Modal / Form State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedUserForBooking, setSelectedUserForBooking] = useState<any | null>(null);
  const [bookingTitle, setBookingTitle] = useState("");
  const [bookingDescription, setBookingDescription] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingDuration, setBookingDuration] = useState("30"); 
  const [bookingResultLink, setBookingResultLink] = useState<string | null>(null);

  const [bookCall, { isLoading: isBookingCall }] = useBookMentorCallMutation();

  // Call Bookings State
  const { data: adminBookingRequests, refetch: refetchAdminBookings } = useGetAdminBookingRequestsQuery(undefined, {
    skip: !userProfile || userProfile.user?.role !== "admin",
  });
  
  // Users State (For Total Students & Signups Trend)
  const { data: allUsers } = useGetAllUsersQuery(undefined, {
    skip: !userProfile || userProfile.user?.role !== "admin",
  });
  
  const [respondToBookingRequest, { isLoading: isRespondingToBooking }] = useRespondToBookingRequestMutation();
  const [selectedRequestForReview, setSelectedRequestForReview] = useState<any | null>(null);
  const [scheduledAtDate, setScheduledAtDate] = useState("");
  const [scheduledAtTime, setScheduledAtTime] = useState("");
  const [adminResponseComment, setAdminResponseComment] = useState("");

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

  // Review submission handler
  const handleReview = async (decision: "approve" | "reject") => {
    if (!selectedSubmission) return;

    try {
      await reviewSubmission({
        submissionId: selectedSubmission.id,
        decision,
        comment: reviewComment,
      }).unwrap();

      toast.success(
        decision === "approve"
          ? "Submission successfully approved!"
          : "Recheck request submitted to the student!"
      );

      setSelectedSubmission(null);
      setReviewComment("");
      refetchPending();
    } catch (err: any) {
      toast.error(err.data?.error || err.data?.message || err.message || "Failed to process review.");
    }
  };

  // Book call handler
  const handleBookCallSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForBooking) return;

    try {
      const startDateTime = new Date(`${bookingDate}T${bookingTime}:00`);
      const endDateTime = new Date(startDateTime.getTime() + parseInt(bookingDuration, 10) * 60 * 1000);

      const result = await bookCall({
        title: bookingTitle,
        description: bookingDescription,
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        attendeeEmail: selectedUserForBooking.email,
      }).unwrap();

      setBookingResultLink(result.meetLink);
      toast.success("Google Meet call booked successfully!");
    } catch (err: any) {
      toast.error(err.data?.error || err.data?.message || err.message || "Failed to book meeting.");
    }
  };

  if (isUserLoading || (userProfile && userProfile.user?.role !== "admin")) {
    return (
      <div className="min-h-screen bg-[#0F0A19] flex flex-col justify-center items-center font-sans">
        <Loader2 className="w-16 h-16 text-[#A855F7] animate-spin mb-6" />
        <p className="text-sm font-mono text-slate-400 tracking-widest uppercase">Initializing Command Center...</p>
      </div>
    );
  }

  const pendingCount = pendingSubmissions?.length || 0;
  const pendingCallsCount = adminBookingRequests?.filter((r: any) => r.status === 'pending').length || 0;
  const totalCallsCount = adminBookingRequests?.length || 0;
  const totalStudents = allUsers?.filter((u: any) => u.role === 'user').length || 0;

  // Generate dynamic 7-day trend data
  const activityTrendData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    const endOfDay = new Date(d);
    endOfDay.setHours(23, 59, 59, 999);

    const signups = allUsers?.filter((u: any) => {
      if (!u.created_at) return false;
      const created = new Date(u.created_at);
      return created >= d && created <= endOfDay;
    }).length || 0;

    const meetings = adminBookingRequests?.filter((req: any) => {
      if (!req.created_at) return false;
      const created = new Date(req.created_at);
      return created >= d && created <= endOfDay;
    }).length || 0;

    const shortDay = d.toLocaleDateString("en-US", { weekday: "short" });
    return { name: shortDay, signups, meetings };
  });

  // Generate dynamic Active Pathways (Pie Chart) from user career goals
  const goalCounts: Record<string, number> = {};
  allUsers?.filter((u: any) => u.role === 'user').forEach((u: any) => {
    let goal = u.career_goal ? u.career_goal.trim() : 'Undecided';
    if (!goal) goal = 'Undecided';
    goalCounts[goal] = (goalCounts[goal] || 0) + 1;
  });
  
  let distributionData = Object.entries(goalCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, value]) => ({ 
      name: name.length > 15 ? name.substring(0, 15) + '...' : name, 
      value 
    }));

  if (distributionData.length === 0) {
    distributionData = [{ name: 'No Data', value: 1 }];
  }

  // Generate dynamic Submission Velocity (Last 4 Days) from pendingSubmissions
  const weeklyTasksData = Array.from({ length: 4 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (3 - i));
    d.setHours(0, 0, 0, 0);
    const endOfDay = new Date(d);
    endOfDay.setHours(23, 59, 59, 999);

    const subsCount = pendingSubmissions?.filter((s: any) => {
      if (!s.created_at) return false;
      const created = new Date(s.created_at);
      return created >= d && created <= endOfDay;
    }).length || 0;

    return { 
      name: d.toLocaleDateString("en-US", { weekday: 'short' }), 
      tasks: subsCount 
    };
  });

  return (
    <div data-lenis-prevent className="min-h-screen bg-[#F8F7FC] flex font-sans selection:bg-[#9333EA] selection:text-white">
      <HoverSidebar />
      <Toaster position="top-right" toastOptions={{ className: 'font-mono text-sm shadow-2xl rounded-2xl border border-[#E9D5FF] bg-white' }} />

      <main className="flex-1 ml-0 md:ml-20 pb-32 w-full max-w-[1920px] mx-auto overflow-x-hidden">
        
        {/* MASSIVE HERO BANNER */}
        <div className="relative w-full h-[400px] overflow-hidden bg-slate-900 rounded-b-[3rem] shadow-2xl">
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
           <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[140%] bg-[#7C3AED] rounded-full blur-[120px] opacity-40 animate-pulse"></div>
           <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[140%] bg-[#EC4899] rounded-full blur-[150px] opacity-30"></div>
           <div className="absolute top-[20%] right-[20%] w-[30%] h-[80%] bg-[#3B82F6] rounded-full blur-[100px] opacity-30"></div>
           
           <div className="relative z-10 p-8 md:p-14 h-full flex flex-col justify-between">
              <div className="flex justify-between items-start">
                 <div>
                    <motion.div initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-4">
                      <Zap className="w-4 h-4 text-yellow-300" />
                      <span className="text-white text-[10px] font-mono font-bold tracking-widest uppercase">Admin Telemetry Online</span>
                    </motion.div>
                    <motion.h1 initial={{opacity: 0, y: 10}} animate={{opacity: 1, y: 0}} transition={{delay: 0.1}} className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                       Command <br/>Center.
                    </motion.h1>
                 </div>
                 <div className="hidden md:flex gap-3">
                   <button onClick={() => router.push("/admin/users")} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-lg border border-white/20 text-white rounded-xl font-mono text-xs font-bold transition-all shadow-xl flex items-center gap-2 group cursor-pointer">
                     <Users className="w-4 h-4" /> Manage Roster
                     <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                   </button>
                 </div>
              </div>

              {/* FLOATING GLASS KPI CARDS OVERLAID ON BANNER */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                 <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.2}} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all">
                       <Users className="w-24 h-24 text-white" />
                    </div>
                    <p className="text-[10px] font-mono font-bold text-purple-200 uppercase tracking-widest mb-1">Active Students</p>
                    <h3 className="text-3xl font-black text-white">{totalStudents}</h3>
                 </motion.div>

                 <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.3}} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all">
                       <ClipboardList className="w-24 h-24 text-white" />
                    </div>
                    <p className="text-[10px] font-mono font-bold text-pink-200 uppercase tracking-widest mb-1">Pending Reviews</p>
                    <div className="flex items-end gap-3">
                       <h3 className="text-3xl font-black text-white">{pendingCount}</h3>
                       {pendingCount > 0 && <span className="mb-1 px-2 py-0.5 bg-pink-500/20 text-pink-300 text-[9px] rounded-full border border-pink-500/30 font-bold flex items-center gap-1 animate-pulse"><Activity className="w-3 h-3"/> Action</span>}
                    </div>
                 </motion.div>

                 <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.4}} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all">
                       <Calendar className="w-24 h-24 text-white" />
                    </div>
                    <p className="text-[10px] font-mono font-bold text-blue-200 uppercase tracking-widest mb-1">Call Requests</p>
                    <div className="flex items-end gap-3">
                       <h3 className="text-3xl font-black text-white">{totalCallsCount}</h3>
                       {pendingCallsCount > 0 && <span className="mb-1 px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[9px] rounded-full border border-blue-500/30 font-bold flex items-center gap-1"><Activity className="w-3 h-3"/> {pendingCallsCount} Pend</span>}
                    </div>
                 </motion.div>

                 <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} transition={{delay: 0.5}} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-5 shadow-2xl relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all">
                       <Award className="w-24 h-24 text-white" />
                    </div>
                    <p className="text-[10px] font-mono font-bold text-emerald-200 uppercase tracking-widest mb-1">Avg Resolution Time</p>
                    <h3 className="text-3xl font-black text-white">4.2<span className="text-lg text-emerald-200 font-bold ml-1">hrs</span></h3>
                 </motion.div>
              </div>
           </div>
        </div>

        {/* CONTENT GRID */}
        <div className="px-6 md:px-10 -mt-6 relative z-20 space-y-8">
           
           {/* MULTI-CHART ANALYTICS ROW */}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Main Area Chart */}
              <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl border border-[#E9D5FF] rounded-3xl p-6 shadow-xl flex flex-col h-[350px]">
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-2">
                       <TrendingUp className="w-4 h-4 text-[#9333EA]" /> Platform Engagement (7-Day)
                    </h3>
                    <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-[10px] font-bold font-mono border border-purple-100">Live Sync</span>
                 </div>
                 <div className="flex-1 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={activityTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                             <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#9333EA" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#9333EA" stopOpacity={0}/>
                             </linearGradient>
                             <linearGradient id="colorMeetings" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#EC4899" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#EC4899" stopOpacity={0}/>
                             </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B', fontFamily: 'monospace' }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B', fontFamily: 'monospace' }} />
                          <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', fontFamily: 'monospace', fontSize: '12px', backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)' }} />
                          <Area type="monotone" dataKey="signups" stroke="#9333EA" strokeWidth={4} fillOpacity={1} fill="url(#colorSignups)" name="Signups" activeDot={{r: 6, fill: '#9333EA', stroke: '#fff', strokeWidth: 2}} />
                          <Area type="monotone" dataKey="meetings" stroke="#EC4899" strokeWidth={4} fillOpacity={1} fill="url(#colorMeetings)" name="Meetings" activeDot={{r: 6, fill: '#EC4899', stroke: '#fff', strokeWidth: 2}} />
                       </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </div>

              {/* Right Charts Stack */}
              <div className="flex flex-col gap-6">
                 {/* Pie Chart */}
                 <div className="bg-white/80 backdrop-blur-xl border border-[#E9D5FF] rounded-3xl p-6 shadow-xl flex-1 flex flex-col justify-between">
                    <h3 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-2">
                       <Target className="w-4 h-4 text-[#EC4899]" /> Active Pathways
                    </h3>
                    <div className="flex-1 w-full flex items-center justify-center -ml-4">
                       <ResponsiveContainer width="100%" height={120}>
                          <PieChart>
                             <Pie data={distributionData} cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={5} dataKey="value">
                                {distributionData.map((entry, index) => (
                                   <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                             </Pie>
                             <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontFamily: 'monospace', fontSize: '10px' }} />
                          </PieChart>
                       </ResponsiveContainer>
                       <div className="flex flex-col gap-2 font-mono text-[9px] shrink-0">
                          {distributionData.map((d, i) => (
                             <div key={d.name} className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                                <span className="text-slate-600">{d.name}</span>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>

                 {/* Bar Chart */}
                 <div className="bg-white/80 backdrop-blur-xl border border-[#E9D5FF] rounded-3xl p-6 shadow-xl flex-1 flex flex-col justify-between">
                    <h3 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-4">
                       <BarChartIcon className="w-4 h-4 text-[#3B82F6]" /> Submission Velocity
                    </h3>
                    <div className="flex-1 w-full">
                       <ResponsiveContainer width="100%" height={100}>
                          <BarChart data={weeklyTasksData} margin={{top: 0, right: 0, left: -25, bottom: 0}}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                             <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontFamily: 'monospace' }} />
                             <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontFamily: 'monospace' }} />
                             <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontFamily: 'monospace', fontSize: '10px' }} />
                             <Bar dataKey="tasks" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={20} />
                          </BarChart>
                       </ResponsiveContainer>
                    </div>
                 </div>
              </div>
           </div>

           {/* LISTS GRID */}
           <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              
              {/* Pending Submissions */}
              <div className="bg-white/80 backdrop-blur-xl border border-[#E9D5FF] rounded-3xl p-6 shadow-xl flex flex-col h-[600px] relative overflow-hidden group">
                 {/* Decorative background flare */}
                 <div className="absolute top-0 right-0 w-64 h-64 bg-purple-300/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                 <div className="flex items-center justify-between mb-6 relative z-10">
                   <h3 className="text-sm font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-2">
                     <ClipboardList className="w-5 h-5 text-[#9333EA]" /> 
                     Task Inbox
                   </h3>
                   {pendingCount > 0 && (
                     <span className="px-3 py-1 bg-pink-50 border border-pink-200 text-pink-700 text-[10px] font-mono rounded-full font-bold uppercase tracking-wider shadow-xs">
                       {pendingCount} Awaiting
                     </span>
                   )}
                 </div>

                 {/* Selected Submission Review View */}
                 <AnimatePresence mode="wait">
                   {selectedSubmission ? (
                     <motion.div
                       key="reviewing"
                       initial={{ opacity: 0, x: -10 }}
                       animate={{ opacity: 1, x: 0 }}
                       exit={{ opacity: 0, x: 10 }}
                       className="flex flex-col h-full bg-slate-900 rounded-[2rem] p-6 border border-slate-800 shadow-2xl relative z-10"
                     >
                       <button 
                         onClick={() => { setSelectedSubmission(null); setReviewComment(""); }}
                         className="absolute top-5 right-5 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
                       >
                         <ArrowRight className="w-4 h-4" />
                       </button>

                       <span className="text-[10px] font-bold font-mono text-[#A855F7] uppercase tracking-widest block mb-1">
                         Review Terminal
                       </span>
                       <h3 className="text-base font-bold font-mono text-white pr-10 leading-tight">
                         {selectedSubmission.task_title}
                       </h3>
                       <div className="text-[10px] font-mono text-slate-400 mt-1.5 pb-4 border-b border-slate-800 flex items-center gap-2">
                         <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white text-[8px] font-bold">
                           {selectedSubmission.student_name?.[0] || 'S'}
                         </div>
                         {selectedSubmission.student_name}
                       </div>

                       <div className="flex-1 overflow-y-auto mt-5 space-y-5 pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                         {selectedSubmission.content && (
                           <div className="space-y-2">
                             <label className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Student Solution
                             </label>
                             <div className="p-4 border border-slate-700/50 rounded-2xl bg-black/50 text-xs font-mono text-emerald-400 whitespace-pre-wrap break-all shadow-inner leading-relaxed">
                               {selectedSubmission.content}
                             </div>
                           </div>
                         )}

                         {selectedSubmission.links && selectedSubmission.links.length > 0 && (
                           <div className="space-y-2">
                             <label className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                               <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Attached Resources
                             </label>
                             <div className="p-3 border border-slate-700/50 rounded-2xl bg-black/50 text-xs font-mono space-y-2">
                               {selectedSubmission.links.map((link: string, idx: number) => (
                                 <a
                                   key={idx}
                                   href={link}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className="text-[#60A5FA] hover:text-[#93C5FD] hover:underline flex items-center gap-2 break-all bg-white/5 p-2 rounded-xl"
                                 >
                                   <ExternalLink className="w-3 h-3 shrink-0" />
                                   {link}
                                 </a>
                               ))}
                             </div>
                           </div>
                         )}
                         
                         <div className="space-y-2">
                           <label className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider block mt-2">
                             Feedback Protocol
                           </label>
                           <textarea
                             value={reviewComment}
                             onChange={(e) => setReviewComment(e.target.value)}
                             placeholder="Provide constructive feedback for the student..."
                             className="w-full h-24 p-4 bg-white/5 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-[#A855F7] focus:border-transparent outline-hidden font-mono text-xs text-white resize-none shadow-inner"
                           />
                         </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4 pt-5 mt-auto border-t border-slate-800">
                         <button
                           onClick={() => handleReview("reject")}
                           disabled={isReviewing}
                           className="flex items-center justify-center gap-2 py-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-2xl font-mono text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                         >
                           <XCircle className="w-4 h-4" /> 
                           Request Revisions
                         </button>
                         <button
                           onClick={() => handleReview("approve")}
                           disabled={isReviewing}
                           className="flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-[#9333EA] to-[#EC4899] hover:from-[#7C3AED] hover:to-[#DB2777] text-white rounded-2xl font-mono text-xs font-bold transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] cursor-pointer disabled:opacity-50"
                         >
                           <CheckCircle className="w-4 h-4" /> 
                           Approve & Pass
                         </button>
                       </div>
                     </motion.div>
                   ) : (
                     <motion.div
                       key="list"
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                       exit={{ opacity: 0 }}
                       className="flex-1 flex flex-col relative z-10"
                     >
                       {isSubmissionsLoading ? (
                         <div className="flex-1 flex flex-col justify-center items-center">
                           <Loader2 className="w-10 h-10 text-[#9333EA] animate-spin mb-4" />
                           <span className="text-xs text-slate-400 font-mono tracking-widest uppercase">Fetching Submissions...</span>
                         </div>
                       ) : pendingSubmissions && pendingSubmissions.length > 0 ? (
                         <div className="space-y-4 overflow-y-auto pr-2 max-h-[500px] scrollbar-thin scrollbar-thumb-purple-200 scrollbar-track-transparent">
                           {pendingSubmissions.map((sub: any, idx: number) => (
                             <motion.div
                               initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                               key={sub.id}
                               onClick={() => setSelectedSubmission(sub)}
                               className="p-5 bg-white border border-slate-200 hover:border-[#A855F7] rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-4 group hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                             >
                               <div className="flex gap-4 items-center">
                                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#9333EA] group-hover:text-white transition-all shadow-sm">
                                    <ClipboardList className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold font-mono text-slate-800 group-hover:text-[#9333EA] transition-colors">{sub.task_title}</h4>
                                    <p className="text-[10px] text-slate-500 font-mono mt-1 flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> {sub.student_name}
                                    </p>
                                  </div>
                               </div>
                               <div className="text-right shrink-0">
                                 <span className="text-[9px] text-slate-400 font-mono block">
                                   {new Date(sub.created_at).toLocaleDateString()}
                                 </span>
                                 <span className="text-[10px] font-bold text-[#9333EA] font-mono mt-2 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 bg-purple-50 px-2 py-0.5 rounded-md">
                                   Review <ChevronRight className="w-3 h-3" />
                                 </span>
                               </div>
                             </motion.div>
                           ))}
                         </div>
                       ) : (
                         <div className="flex-1 flex flex-col justify-center items-center text-center p-12 border-2 border-dashed border-[#E9D5FF] bg-white/50 rounded-[2rem]">
                           <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-5 shadow-inner">
                              <CheckCircle className="w-10 h-10 text-emerald-500" />
                           </div>
                           <h4 className="font-black text-slate-800 text-lg">Inbox Zero</h4>
                           <p className="text-xs text-slate-500 font-mono mt-2 max-w-[250px] leading-relaxed">
                             Excellent work! You are completely caught up with all student submissions.
                           </p>
                         </div>
                       )}
                     </motion.div>
                   )}
                 </AnimatePresence>
              </div>

              {/* Call Requests */}
              <div className="bg-white/80 backdrop-blur-xl border border-[#E9D5FF] rounded-3xl p-6 shadow-xl flex flex-col h-[600px] relative overflow-hidden group">
                 {/* Decorative background flare */}
                 <div className="absolute top-0 right-0 w-64 h-64 bg-pink-300/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                 <div className="flex items-center justify-between mb-6 relative z-10">
                   <h3 className="text-sm font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-2">
                     <Calendar className="w-5 h-5 text-[#EC4899]" /> 
                     Meeting Requests
                   </h3>
                 </div>

                 <AnimatePresence mode="wait">
                   {selectedRequestForReview ? (
                     <motion.div
                       key="scheduling"
                       initial={{ opacity: 0, x: -10 }}
                       animate={{ opacity: 1, x: 0 }}
                       exit={{ opacity: 0, x: 10 }}
                       className="flex flex-col h-full bg-slate-900 rounded-[2rem] p-6 border border-slate-800 shadow-2xl relative z-10"
                     >
                       <button 
                         onClick={() => setSelectedRequestForReview(null)}
                         className="absolute top-5 right-5 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors cursor-pointer"
                       >
                         <ArrowRight className="w-4 h-4" />
                       </button>

                       <span className="text-[10px] font-bold font-mono text-[#EC4899] uppercase tracking-widest block mb-1">
                         Scheduling Uplink
                       </span>
                       <h3 className="text-base font-bold font-mono text-white pr-10 leading-tight">
                         {selectedRequestForReview.title}
                       </h3>
                       <div className="text-[10px] font-mono text-slate-400 mt-1.5 pb-4 border-b border-slate-800 flex items-center gap-2">
                         <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-500 flex items-center justify-center text-white text-[8px] font-bold">
                           {selectedRequestForReview.student_name?.[0] || 'S'}
                         </div>
                         {selectedRequestForReview.student_name}
                       </div>

                       <div className="flex-1 overflow-y-auto mt-5 space-y-5 pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                         {selectedRequestForReview.description && (
                           <div className="space-y-2">
                             <label className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                               <div className="w-1.5 h-1.5 rounded-full bg-[#EC4899]"></div> Agenda Notes
                             </label>
                             <div className="p-4 border border-slate-700/50 rounded-2xl bg-black/50 text-xs font-mono text-slate-300 whitespace-pre-wrap break-all shadow-inner leading-relaxed">
                               {selectedRequestForReview.description}
                             </div>
                           </div>
                         )}

                         <div className="space-y-3 p-5 bg-white/5 border border-slate-700/50 rounded-2xl shadow-inner">
                           <label className="text-[10px] font-bold font-mono text-[#A855F7] block uppercase tracking-wider flex items-center gap-2">
                             <Calendar className="w-3 h-3" /> Assign Date & Time
                           </label>
                           <div className="grid grid-cols-2 gap-4">
                             <input
                               type="date"
                               value={scheduledAtDate}
                               onChange={(e) => setScheduledAtDate(e.target.value)}
                               className="w-full p-3 bg-black/40 border border-slate-700 rounded-xl font-mono text-xs cursor-pointer text-white focus:ring-2 focus:ring-[#EC4899] focus:border-transparent outline-hidden"
                             />
                             <input
                               type="time"
                               value={scheduledAtTime}
                               onChange={(e) => setScheduledAtTime(e.target.value)}
                               className="w-full p-3 bg-black/40 border border-slate-700 rounded-xl font-mono text-xs cursor-pointer text-white focus:ring-2 focus:ring-[#EC4899] focus:border-transparent outline-hidden"
                             />
                           </div>
                         </div>

                         <div className="space-y-2">
                           <label className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider block mt-2">
                             Meeting Instructions
                           </label>
                           <textarea
                             value={adminResponseComment}
                             onChange={(e) => setAdminResponseComment(e.target.value)}
                             placeholder="Provide details about the Meet..."
                             className="w-full h-20 p-4 bg-white/5 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-[#EC4899] focus:border-transparent outline-hidden font-mono text-xs text-white resize-none shadow-inner"
                           />
                         </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4 pt-5 mt-auto border-t border-slate-800">
                         <button
                           onClick={() => handleRespondToBooking("reject")}
                           disabled={isRespondingToBooking}
                           className="flex items-center justify-center gap-2 py-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-2xl font-mono text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                         >
                           <XCircle className="w-4 h-4" /> Reject
                         </button>
                         <button
                           onClick={() => handleRespondToBooking("approve")}
                           disabled={isRespondingToBooking}
                           className="flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-[#EC4899] to-[#8B5CF6] hover:from-[#DB2777] hover:to-[#7C3AED] text-white rounded-2xl font-mono text-xs font-bold transition-all shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] cursor-pointer disabled:opacity-50"
                         >
                           <Video className="w-4 h-4" /> Confirm & Meet
                         </button>
                       </div>
                     </motion.div>
                   ) : (
                     <motion.div
                       key="requests-list"
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                       exit={{ opacity: 0 }}
                       className="flex-1 flex flex-col relative z-10"
                     >
                       {adminBookingRequests && adminBookingRequests.length > 0 ? (
                         <div className="space-y-4 overflow-y-auto pr-2 max-h-[500px] scrollbar-thin scrollbar-thumb-pink-200 scrollbar-track-transparent">
                           {adminBookingRequests.map((req: any, idx: number) => {
                             let statusColor = "bg-slate-100 text-slate-600 border-slate-200";
                             let icon = <Calendar className="w-5 h-5" />;
                             
                             if (req.status === "approved") {
                               statusColor = "bg-emerald-50 text-emerald-600 border-emerald-200";
                               icon = <CheckCircle className="w-5 h-5 text-emerald-500" />;
                             } else if (req.status === "rejected") {
                               statusColor = "bg-red-50 text-red-600 border-red-200";
                               icon = <XCircle className="w-5 h-5 text-red-500" />;
                             } else {
                               statusColor = "bg-pink-50 text-[#EC4899] border-pink-200";
                             }

                             return (
                               <motion.div
                                 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                                 key={req.id}
                                 onClick={() => {
                                   if (req.status === 'pending') {
                                     setSelectedRequestForReview(req);
                                   }
                                 }}
                                 className={`p-5 bg-white border border-slate-200 rounded-2xl transition-all flex flex-col gap-3 group ${
                                   req.status === 'pending' ? 'cursor-pointer hover:border-[#EC4899] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]' : ''
                                 }`}
                               >
                                 <div className="flex gap-4 items-start">
                                    <div className={`w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 shadow-sm ${req.status === 'pending' ? 'group-hover:scale-110 group-hover:bg-[#EC4899] group-hover:text-white transition-all' : ''}`}>
                                      {icon}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex justify-between items-start mb-1">
                                         <h4 className="text-xs font-bold font-mono text-slate-800 line-clamp-1">{req.title}</h4>
                                         <span className={`shrink-0 ml-2 px-2.5 py-0.5 text-[9px] font-bold font-mono rounded-md uppercase border shadow-xs ${statusColor}`}>
                                           {req.status}
                                         </span>
                                      </div>
                                      <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> {req.student_name}
                                      </p>
                                    </div>
                                 </div>
                                 
                                 <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-100">
                                   {req.status === 'approved' && req.meet_link ? (
                                     <a
                                       href={req.meet_link}
                                       target="_blank"
                                       rel="noopener noreferrer"
                                       onClick={(e) => e.stopPropagation()}
                                       className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-600 border border-blue-200 rounded-lg font-mono text-[10px] font-bold transition-colors shadow-sm"
                                     >
                                       <Video className="w-3.5 h-3.5" /> Join Meeting
                                     </a>
                                   ) : (
                                     <span className="text-[9px] text-slate-400 font-mono block">
                                       Requested on {new Date(req.created_at).toLocaleDateString()}
                                     </span>
                                   )}
                                   
                                   {req.status === 'pending' && (
                                     <span className="text-[10px] font-bold text-[#EC4899] font-mono inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 bg-pink-50 px-2 py-0.5 rounded-md">
                                       Schedule <ChevronRight className="w-3 h-3" />
                                     </span>
                                   )}
                                 </div>
                               </motion.div>
                             );
                           })}
                         </div>
                       ) : (
                         <div className="flex-1 flex flex-col justify-center items-center text-center p-12 border-2 border-dashed border-[#E9D5FF] bg-white/50 rounded-[2rem]">
                           <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-5 shadow-inner">
                              <Calendar className="w-10 h-10 text-blue-400" />
                           </div>
                           <h4 className="font-black text-slate-800 text-lg">Clear Calendar</h4>
                           <p className="text-xs text-slate-500 font-mono mt-2 max-w-[250px] leading-relaxed">
                             Your scheduling queue is empty. No students have requested a meeting.
                           </p>
                         </div>
                       )}
                     </motion.div>
                   )}
                 </AnimatePresence>
              </div>

           </div>
        </div>

      </main>
    </div>
  );
}

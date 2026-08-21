"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Calendar,
  Video,
  X,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { HoverSidebar } from "@/components/layout/HoverSidebar";
import { useCompany } from "@/context/CompanyContext";
import { useGetMeQuery } from "@/store/api/authApi";
import {
  useGetAdminBookingRequestsQuery,
  useRespondToBookingRequestMutation,
} from "@/store/api/learningApi";

export default function AdminMeetingsPage() {
  const router = useRouter();
  const { isAuthenticated } = useCompany();

  const { data: userProfile, isLoading: isUserLoading } = useGetMeQuery(undefined, {
    skip: !isAuthenticated,
  });

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("seekh_auth_token") : null;
    if (!token) {
      router.push("/login");
    } else if (userProfile && userProfile.user?.role !== "admin") {
      toast.error("Access Denied: Mentors/Admins only.");
      router.push("/dashboard");
    }
  }, [userProfile, router]);

  const { data: adminBookingRequests, refetch: refetchAdminBookings, isLoading: isBookingsLoading } = useGetAdminBookingRequestsQuery(undefined, {
    skip: !userProfile || userProfile.user?.role !== "admin",
  });
  
  const [respondToBookingRequest, { isLoading: isRespondingToBooking }] = useRespondToBookingRequestMutation();
  const [selectedRequestForReview, setSelectedRequestForReview] = useState<any | null>(null);
  
  // Schedule Form State
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

  if (isUserLoading || (userProfile && userProfile.user?.role !== "admin")) {
    return (
      <div className="min-h-screen bg-[#F8F7FC] flex flex-col justify-center items-center font-sans">
        <Loader2 className="w-16 h-16 text-[#8B5CF6] animate-spin mb-6" />
        <p className="text-sm font-mono text-slate-400 tracking-widest uppercase">Initializing Scheduler...</p>
      </div>
    );
  }

  const pendingRequests = adminBookingRequests?.filter((r: any) => r.status === 'pending') || [];
  const handledRequests = adminBookingRequests?.filter((r: any) => r.status !== 'pending') || [];

  return (
    <div data-lenis-prevent className="min-h-screen bg-[#F8F7FC] flex font-sans selection:bg-[#8B5CF6] selection:text-white relative overflow-hidden">
      <HoverSidebar />
      <Toaster position="top-right" toastOptions={{ className: 'font-mono text-sm shadow-2xl rounded-2xl border border-[#E9D5FF] bg-white' }} />

      <main className="flex-1 ml-0 md:ml-20 pb-32 w-full max-w-[1920px] mx-auto overflow-x-hidden relative">
        {/* HEADER */}
        <div className="px-6 md:px-10 pt-10 pb-6 bg-white/50 backdrop-blur-md border-b border-[#E9D5FF]/50 sticky top-0 z-30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-sm">
                 <Video className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight font-mono text-slate-900 flex items-center gap-2">
                  Call Requests
                  <span className="px-2 py-0.5 bg-[#8B5CF6]/10 text-[#8B5CF6] text-[10px] font-extrabold font-mono rounded-full border border-purple-200 uppercase tracking-widest">
                    {pendingRequests.length} Pending
                  </span>
                </h1>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase tracking-wider">
                  Manage Mentorship Meetings
                </p>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => router.push("/admin")}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer shadow-xs group"
          >
            <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-1 transition-transform" /> Dashboard
          </button>
        </div>

        <div className="px-6 md:px-10 mt-8 max-w-7xl mx-auto space-y-12 pb-20">
          
          {/* PENDING REQUESTS */}
          <section>
            <h3 className="text-sm font-bold font-mono text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" /> Action Required
            </h3>
            
            {isBookingsLoading ? (
              <div className="p-16 flex flex-col justify-center items-center bg-white border border-[#E9D5FF] rounded-3xl shadow-sm">
                <Loader2 className="w-8 h-8 text-[#8B5CF6] animate-spin mb-3" />
              </div>
            ) : pendingRequests.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {pendingRequests.map((req: any) => (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-slate-200 hover:border-[#8B5CF6]/50 rounded-2xl p-6 shadow-xs hover:shadow-xl transition-all cursor-pointer group"
                    onClick={() => setSelectedRequestForReview(req)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-2 py-1 bg-amber-50 text-amber-600 border border-amber-200 rounded-md text-[9px] font-bold font-mono uppercase tracking-widest">
                        Needs Scheduling
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(req.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-lg mb-1">{req.topic}</h4>
                    <p className="text-xs text-slate-500 font-mono line-clamp-2 mb-4">{req.description}</p>
                    
                    <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#8B5CF6] to-[#3B82F6] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {req.student_name?.[0]?.toUpperCase()}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-800 truncate">{req.student_name}</p>
                        <p className="text-[10px] text-slate-500 font-mono truncate">{req.student_email}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-10 flex flex-col justify-center items-center bg-white border border-dashed border-[#E9D5FF] rounded-3xl text-center">
                <CheckCircle className="w-8 h-8 text-emerald-400 mb-3" />
                <p className="text-sm font-bold text-slate-800">Inbox Zero!</p>
                <p className="text-xs text-slate-500 font-mono">No pending call requests.</p>
              </div>
            )}
          </section>

          {/* HISTORY */}
          <section>
            <h3 className="text-sm font-bold font-mono text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" /> Call History & Scheduled
            </h3>
            
            {!isBookingsLoading && handledRequests.length > 0 ? (
              <div className="bg-white border border-[#E9D5FF]/50 rounded-3xl overflow-hidden shadow-sm">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                      <th className="p-4">Student</th>
                      <th className="p-4">Topic</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Scheduled Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {handledRequests.map((req: any) => (
                      <tr key={req.id} className="hover:bg-purple-50/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                              {req.student_name?.[0]?.toUpperCase()}
                            </div>
                            <span className="font-bold text-slate-700">{req.student_name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-600 truncate max-w-[200px]">{req.topic}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase ${
                            req.status === 'approved' 
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                              : 'bg-red-50 text-red-600 border border-red-200'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="p-4 text-right text-slate-500">
                          {req.scheduled_at ? new Date(req.scheduled_at).toLocaleString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-10 flex flex-col justify-center items-center bg-transparent border border-dashed border-slate-200 rounded-3xl text-center">
                <p className="text-xs text-slate-400 font-mono">No handled requests in history.</p>
              </div>
            )}
          </section>

        </div>

        {/* REVIEW/SCHEDULE SLIDE-OVER */}
        <AnimatePresence>
          {selectedRequestForReview && (
            <>
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => !isRespondingToBooking && setSelectedRequestForReview(null)}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
              />
              
              {/* Panel */}
              <motion.div
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 bottom-0 w-full md:w-[500px] bg-white border-l border-[#E9D5FF] shadow-[0_0_50px_rgba(139,92,246,0.1)] z-50 flex flex-col overflow-hidden font-sans"
              >
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                  <h3 className="font-bold font-mono text-slate-800 flex items-center gap-2">
                     <Video className="w-4 h-4 text-[#8B5CF6]" /> Schedule Call
                  </h3>
                  <button 
                    onClick={() => !isRespondingToBooking && setSelectedRequestForReview(null)}
                    disabled={isRespondingToBooking}
                    className="p-1.5 hover:bg-slate-200 rounded-full text-slate-500 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  
                  {/* Student Request Info */}
                  <div className="bg-purple-50/50 p-5 rounded-2xl border border-purple-100">
                    <h4 className="text-[10px] font-bold font-mono text-purple-600 uppercase tracking-widest mb-1">Requesting Student</h4>
                    <p className="font-bold text-slate-900 text-sm">{selectedRequestForReview.student_name}</p>
                    <p className="text-xs text-slate-500 font-mono mb-4">{selectedRequestForReview.student_email}</p>
                    
                    <h4 className="text-[10px] font-bold font-mono text-purple-600 uppercase tracking-widest mb-1">Topic</h4>
                    <p className="font-bold text-slate-800">{selectedRequestForReview.topic}</p>
                    
                    <h4 className="text-[10px] font-bold font-mono text-purple-600 uppercase tracking-widest mt-4 mb-1">Description</h4>
                    <p className="text-xs text-slate-600 font-mono bg-white p-3 rounded-lg border border-purple-100/50">{selectedRequestForReview.description}</p>
                  </div>

                  {/* Scheduling Form */}
                  <div className="space-y-4">
                     <h4 className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-widest">Schedule Meeting (If Approving)</h4>
                     
                     <div>
                       <label className="block text-xs font-mono font-bold text-slate-700 mb-1">Date</label>
                       <input
                         type="date"
                         value={scheduledAtDate}
                         onChange={(e) => setScheduledAtDate(e.target.value)}
                         className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent outline-hidden font-mono text-sm bg-slate-50"
                       />
                     </div>
                     <div>
                       <label className="block text-xs font-mono font-bold text-slate-700 mb-1">Time</label>
                       <input
                         type="time"
                         value={scheduledAtTime}
                         onChange={(e) => setScheduledAtTime(e.target.value)}
                         className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent outline-hidden font-mono text-sm bg-slate-50"
                       />
                     </div>
                  </div>

                  {/* Comment */}
                  <div className="space-y-1">
                     <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Message to Student</label>
                     <textarea
                       value={adminResponseComment}
                       onChange={(e) => setAdminResponseComment(e.target.value)}
                       placeholder="Add meeting link, prep instructions, or rejection reason..."
                       className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent outline-hidden font-mono text-xs bg-slate-50 min-h-[100px] resize-none"
                     />
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-white shrink-0 grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleRespondToBooking("reject")}
                    disabled={isRespondingToBooking}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl font-mono font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                  <button
                    onClick={() => handleRespondToBooking("approve")}
                    disabled={isRespondingToBooking}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-xl font-mono font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 shadow-lg shadow-purple-500/30"
                  >
                    <Calendar className="w-4 h-4" /> Schedule Call
                  </button>
                </div>

              </motion.div>
            </>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}

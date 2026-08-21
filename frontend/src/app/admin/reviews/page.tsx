"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  CheckCircle,
  XCircle,
  ClipboardList,
  ExternalLink,
  ArrowLeft,
  X
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { HoverSidebar } from "@/components/layout/HoverSidebar";
import { useCompany } from "@/context/CompanyContext";
import { useGetMeQuery } from "@/store/api/authApi";
import {
  useGetPendingSubmissionsQuery,
  useReviewSubmissionMutation,
} from "@/store/api/learningApi";

export default function AdminReviewsPage() {
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

  const { data: pendingSubmissions, refetch: refetchPending, isLoading: isSubmissionsLoading } = useGetPendingSubmissionsQuery(undefined, {
    skip: !userProfile || userProfile.user?.role !== "admin",
  });
  
  const [reviewSubmission, { isLoading: isReviewing }] = useReviewSubmissionMutation();
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [reviewComment, setReviewComment] = useState("");

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

  if (isUserLoading || (userProfile && userProfile.user?.role !== "admin")) {
    return (
      <div className="min-h-screen bg-[#F8F7FC] flex flex-col justify-center items-center font-sans">
        <Loader2 className="w-16 h-16 text-[#8B5CF6] animate-spin mb-6" />
        <p className="text-sm font-mono text-slate-400 tracking-widest uppercase">Initializing Reviews...</p>
      </div>
    );
  }

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
                 <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight font-mono text-slate-900 flex items-center gap-2">
                  Task Reviews
                  <span className="px-2 py-0.5 bg-[#8B5CF6]/10 text-[#8B5CF6] text-[10px] font-extrabold font-mono rounded-full border border-purple-200 uppercase tracking-widest">
                    {pendingSubmissions?.length || 0} Pending
                  </span>
                </h1>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase tracking-wider">
                  Assess Student Submissions
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

        <div className="px-6 md:px-10 mt-8 max-w-7xl mx-auto pb-20">
          {/* SUBMISSIONS LIST */}
          <div className="space-y-4">
            {isSubmissionsLoading ? (
              <div className="p-16 flex flex-col justify-center items-center bg-white border border-[#E9D5FF] rounded-3xl shadow-sm">
                <Loader2 className="w-8 h-8 text-[#8B5CF6] animate-spin mb-3" />
                <span className="text-xs text-slate-500 font-mono uppercase tracking-widest">Loading submissions...</span>
              </div>
            ) : pendingSubmissions && pendingSubmissions.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {pendingSubmissions.map((sub: any) => (
                  <motion.div
                    key={sub.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-slate-200 hover:border-[#8B5CF6]/50 rounded-2xl p-6 shadow-xs hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
                    onClick={() => setSelectedSubmission(sub)}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="px-2 py-1 bg-amber-50 text-amber-600 border border-amber-200 rounded-md text-[9px] font-bold font-mono uppercase tracking-widest">
                          Awaiting Review
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {new Date(sub.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <h4 className="font-bold text-slate-900 group-hover:text-[#8B5CF6] transition-colors line-clamp-1">{sub.task_title}</h4>
                      
                      <div className="flex items-center gap-2 mt-2 bg-slate-50 p-2 rounded-xl">
                        <div className="w-6 h-6 rounded-full bg-[#8B5CF6]/20 text-[#8B5CF6] flex items-center justify-center text-[10px] font-bold shrink-0">
                          {sub.student_name?.[0]?.toUpperCase()}
                        </div>
                        <div className="truncate">
                          <p className="text-[10px] font-bold text-slate-700 truncate">{sub.student_name}</p>
                          <p className="text-[9px] text-slate-500 truncate">{sub.student_email}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-16 flex flex-col justify-center items-center bg-white border border-dashed border-[#E9D5FF] rounded-3xl shadow-sm text-center">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                   <CheckCircle className="w-6 h-6 text-emerald-500" />
                </div>
                <h4 className="font-bold text-slate-800 text-lg">All caught up!</h4>
                <p className="text-xs text-slate-500 font-mono mt-2">There are no pending submissions requiring your review right now.</p>
              </div>
            )}
          </div>
        </div>

        {/* REVIEW MODAL / SLIDE-OVER */}
        <AnimatePresence>
          {selectedSubmission && (
            <>
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => !isReviewing && setSelectedSubmission(null)}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
              />
              
              {/* Panel */}
              <motion.div
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 bottom-0 w-full md:w-[500px] lg:w-[600px] bg-white border-l border-[#E9D5FF] shadow-[0_0_50px_rgba(139,92,246,0.1)] z-50 flex flex-col overflow-hidden font-sans"
              >
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                  <h3 className="font-bold font-mono text-slate-800 flex items-center gap-2">
                     <ClipboardList className="w-4 h-4 text-[#8B5CF6]" /> Submission Review
                  </h3>
                  <button 
                    onClick={() => !isReviewing && setSelectedSubmission(null)}
                    disabled={isReviewing}
                    className="p-1.5 hover:bg-slate-200 rounded-full text-slate-500 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  
                  {/* Student Info */}
                  <div className="flex items-center gap-4 bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
                     <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#8B5CF6] to-[#EC4899] text-white flex items-center justify-center text-lg font-black shadow-inner shrink-0">
                        {selectedSubmission.student_name?.[0]?.toUpperCase()}
                     </div>
                     <div>
                        <p className="text-[10px] font-mono text-purple-600 font-bold uppercase tracking-widest mb-0.5">Submitted By</p>
                        <h4 className="font-bold text-slate-900 leading-tight">{selectedSubmission.student_name}</h4>
                        <p className="text-xs text-slate-500 font-mono">{selectedSubmission.student_email}</p>
                     </div>
                  </div>

                  <div>
                     <h4 className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-widest mb-2">Task Details</h4>
                     <p className="font-bold text-slate-800 text-lg">{selectedSubmission.task_title}</p>
                     <p className="text-xs text-slate-400 font-mono mt-1">
                        Submitted on {new Date(selectedSubmission.created_at).toLocaleString()}
                     </p>
                  </div>

                  {selectedSubmission.content && (
                    <div>
                       <h4 className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-widest mb-2">Submission Content</h4>
                       <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-700 whitespace-pre-wrap font-mono leading-relaxed max-h-[300px] overflow-y-auto">
                         {selectedSubmission.content}
                       </div>
                    </div>
                  )}

                  {selectedSubmission.links && selectedSubmission.links.length > 0 && (
                    <div>
                       <h4 className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-widest mb-2">Attached Links</h4>
                       <div className="flex flex-col gap-2">
                         {selectedSubmission.links.map((link: string, idx: number) => (
                           <a
                             key={idx}
                             href={link}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="flex items-center gap-2 p-3 bg-white border border-slate-200 hover:border-[#8B5CF6] rounded-xl text-xs font-mono text-[#8B5CF6] font-bold transition-all hover:shadow-sm"
                           >
                             <ExternalLink className="w-4 h-4 shrink-0" />
                             <span className="truncate">{link}</span>
                           </a>
                         ))}
                       </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-widest mb-2">Review Feedback (Optional)</h4>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Provide constructive feedback..."
                      className="w-full p-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent outline-hidden font-mono text-sm shadow-inner min-h-[100px] resize-none"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-white shrink-0 grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleReview("reject")}
                    disabled={isReviewing}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl font-mono font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" /> Request Changes
                  </button>
                  <button
                    onClick={() => handleReview("approve")}
                    disabled={isReviewing}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 rounded-xl font-mono font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve Task
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

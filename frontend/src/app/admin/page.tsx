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
  UserX,
  UserCheck,
  Video,
  ExternalLink,
  Search,
  Sparkles,
  Info,
  Clock,
  ArrowRight
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { HoverSidebar } from "@/components/layout/HoverSidebar";
import { useCompany } from "@/context/CompanyContext";
import { useGetMeQuery } from "@/store/api/authApi";
import {
  useGetPendingSubmissionsQuery,
  useReviewSubmissionMutation,
  useGetAllUsersQuery,
  useBlockUserMutation,
  useUnblockUserMutation,
  useBookMentorCallMutation,
  useGetAdminBookingRequestsQuery,
  useRespondToBookingRequestMutation
} from "@/store/api/learningApi";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isAuthenticated } = useCompany();

  // 1. Fetch current user to verify admin role
  const { data: userProfile, isLoading: isUserLoading } = useGetMeQuery(undefined, {
    skip: !isAuthenticated,
  });

  // Protect route
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else if (userProfile && userProfile.user?.role !== "admin") {
      toast.error("Access Denied: Mentors/Admins only.");
      router.push("/dashboard");
    }
  }, [isAuthenticated, userProfile, router]);

  // Tab State
  const [activeTab, setActiveTab] = useState<"submissions" | "users" | "bookings">("submissions");

  // Filter & Search State
  const [userSearchQuery, setUserSearchQuery] = useState("");

  // Submissions State
  const { data: pendingSubmissions, refetch: refetchPending, isLoading: isSubmissionsLoading } = useGetPendingSubmissionsQuery(undefined, {
    skip: !userProfile || userProfile.user?.role !== "admin",
  });
  const [reviewSubmission, { isLoading: isReviewing }] = useReviewSubmissionMutation();
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [reviewComment, setReviewComment] = useState("");

  // Users State
  const { data: users, refetch: refetchUsers, isLoading: isUsersLoading } = useGetAllUsersQuery(undefined, {
    skip: !userProfile || userProfile.user?.role !== "admin",
  });
  const [blockUser, { isLoading: isBlocking }] = useBlockUserMutation();
  const [unblockUser, { isLoading: isUnblocking }] = useUnblockUserMutation();

  // Booking Modal / Form State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedUserForBooking, setSelectedUserForBooking] = useState<any | null>(null);
  const [bookingTitle, setBookingTitle] = useState("");
  const [bookingDescription, setBookingDescription] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingDuration, setBookingDuration] = useState("30"); // minutes
  const [bookingResultLink, setBookingResultLink] = useState<string | null>(null);

  const [bookCall, { isLoading: isBookingCall }] = useBookMentorCallMutation();

  // Call Bookings State
  const { data: adminBookingRequests, refetch: refetchAdminBookings } = useGetAdminBookingRequestsQuery(undefined, {
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

  // Block/Unblock handlers
  const handleBlockToggle = async (user: any) => {
    try {
      if (user.is_blocked) {
        await unblockUser(user.id).unwrap();
        toast.success(`User ${user.name} successfully unblocked!`);
      } else {
        await blockUser(user.id).unwrap();
        toast.error(`User ${user.name} has been blocked!`);
      }
      refetchUsers();
    } catch (err: any) {
      toast.error(err.data?.error || err.data?.message || err.message || "Failed to change user block status.");
    }
  };

  // Open booking modal
  const openBooking = (user: any) => {
    setSelectedUserForBooking(user);
    setBookingTitle(`Mentor Session with ${user.name}`);
    setBookingDescription(`Adaptive Learning Checkpoint session with ${user.name}.`);
    setBookingResultLink(null);
    setShowBookingModal(true);
  };

  // Book call handler
  const handleBookCallSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForBooking) return;

    try {
      // Calculate start and end ISO dates
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
      refetchUsers();
    } catch (err: any) {
      toast.error(err.data?.error || err.data?.message || err.message || "Failed to book meeting.");
    }
  };

  // Filtered users roster
  const filteredUsers = users?.filter((u) => {
    const query = userSearchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      (u.career_goal || "").toLowerCase().includes(query)
    );
  });

  if (isUserLoading || (userProfile && userProfile.user?.role !== "admin")) {
    return (
      <div className="min-h-screen bg-[#F5F2FA] flex flex-col justify-center items-center font-sans">
        <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
        <p className="text-sm font-mono text-slate-500">Checking credentials & loading mentor dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F2FA] flex font-sans">
      <HoverSidebar />
      <Toaster position="top-right" />

      {/* Main Body */}
      <main className="flex-1 ml-20 p-6 md:p-10 max-w-7xl overflow-x-hidden">
        {/* Header bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-mono text-slate-900">
                Mentor Hub
              </h1>
              <span className="px-2.5 py-1 bg-purple-900/10 text-purple-700 text-[10px] font-extrabold font-mono rounded-full border border-purple-200">
                ADMIN CONSOLE
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-1">
              Approve student exercises, manage system accounts, and coordinate video check-ins.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex bg-slate-200/80 p-1.5 rounded-2xl border border-purple-100 font-mono text-xs font-semibold">
            <button
              onClick={() => setActiveTab("submissions")}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "submissions"
                  ? "bg-[#1E192B] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span>Pending Reviews</span>
              {pendingSubmissions && pendingSubmissions.length > 0 && (
                <span className="w-5 h-5 bg-red-500 text-[10px] text-white flex items-center justify-center rounded-full">
                  {pendingSubmissions.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "users"
                  ? "bg-[#1E192B] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>User Roster</span>
            </button>
            <button
              onClick={() => setActiveTab("bookings")}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "bookings"
                  ? "bg-[#1E192B] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Call Requests</span>
              {adminBookingRequests && adminBookingRequests.filter((r: any) => r.status === 'pending').length > 0 && (
                <span className="w-5 h-5 bg-red-500 text-[10px] text-white flex items-center justify-center rounded-full">
                  {adminBookingRequests.filter((r: any) => r.status === 'pending').length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab Content Rendering */}
        <AnimatePresence mode="wait">
          {activeTab === "submissions" ? (
            <motion.div
              key="submissions-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Submissions List */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white border border-purple-100 rounded-3xl p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold font-mono text-slate-800 uppercase tracking-wider">
                      Student Submissions
                    </h3>
                    <span className="px-2.5 py-1 bg-red-50 border border-red-200 text-red-700 text-[10px] font-mono rounded-full font-bold">
                      {pendingSubmissions?.length || 0} Awaiting Action
                    </span>
                  </div>

                  {isSubmissionsLoading ? (
                    <div className="p-10 flex flex-col justify-center items-center">
                      <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-2" />
                      <span className="text-xs text-slate-400 font-mono">Loading exercises...</span>
                    </div>
                  ) : pendingSubmissions && pendingSubmissions.length > 0 ? (
                    <div className="space-y-3">
                      {pendingSubmissions.map((sub) => (
                        <div
                          key={sub.id}
                          onClick={() => setSelectedSubmission(sub)}
                          className={`p-4 border rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-4 ${
                            selectedSubmission?.id === sub.id
                              ? "border-purple-600 bg-purple-50/15 shadow-sm"
                              : "border-purple-50 hover:border-purple-100 hover:bg-purple-50/5"
                          }`}
                        >
                          <div>
                            <h4 className="text-xs font-bold font-mono text-slate-800">{sub.task_title}</h4>
                            <p className="text-[10px] text-slate-500 font-mono mt-1">
                              By {sub.student_name} ({sub.student_email})
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[9px] text-slate-400 font-mono block">
                              Submitted {new Date(sub.created_at).toLocaleDateString()}
                            </span>
                            <span className="text-[10px] font-bold text-purple-700 font-mono mt-1 inline-flex items-center gap-0.5">
                              Open Review <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 text-center border border-dashed border-purple-100 rounded-3xl">
                      <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                      <p className="text-xs text-slate-500 font-mono">
                        Workspace clean! No pending task reviews.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Review Console Panel */}
              <div>
                <AnimatePresence mode="wait">
                  {selectedSubmission ? (
                    <motion.div
                      key={selectedSubmission.id}
                      initial={{ opacity: 0, x: 15 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 15 }}
                      className="bg-white border border-purple-100 rounded-3xl p-6 shadow-xs space-y-6"
                    >
                      <div>
                        <span className="text-[9px] font-bold font-mono text-purple-600 uppercase tracking-widest block">
                          Review Terminal
                        </span>
                        <h3 className="text-sm font-bold font-mono text-slate-800 mt-1.5">
                          {selectedSubmission.task_title}
                        </h3>
                        <div className="p-3 bg-purple-50/40 rounded-xl mt-3 space-y-1">
                          <p className="text-[10px] font-mono text-slate-600">
                            <strong>Student:</strong> {selectedSubmission.student_name}
                          </p>
                          <p className="text-[10px] font-mono text-slate-600">
                            <strong>Email:</strong> {selectedSubmission.student_email}
                          </p>
                        </div>
                      </div>

                      {selectedSubmission.content && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider block">
                            Submitted Exercise Answer
                          </label>
                          <div className="p-4 border border-purple-50 rounded-2xl bg-slate-900 text-xs font-mono text-emerald-400 whitespace-pre-wrap break-all max-h-56 overflow-y-auto shadow-inner leading-relaxed">
                            {selectedSubmission.content}
                          </div>
                        </div>
                      )}

                      {selectedSubmission.links && selectedSubmission.links.length > 0 && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider block">
                            Submitted Links
                          </label>
                          <div className="p-3 border border-purple-50 rounded-2xl bg-slate-900 text-xs font-mono text-emerald-400 space-y-1.5 max-h-36 overflow-y-auto shadow-inner">
                            {selectedSubmission.links.map((link: string, idx: number) => (
                              <a
                                key={idx}
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-400 hover:text-purple-300 hover:underline flex items-center gap-1.5 break-all"
                              >
                                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                {link}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider block">
                          Feedback Comment (Optional)
                        </label>
                        <textarea
                          value={reviewComment}
                          onChange={(e) => setReviewComment(e.target.value)}
                          placeholder="Provide constructive feedback. Students will see this in their roadmap details..."
                          className="w-full h-24 p-3 border border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-hidden font-mono text-xs resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <button
                          onClick={() => handleReview("reject")}
                          disabled={isReviewing}
                          className="flex items-center justify-center gap-1.5 py-3 bg-red-50 hover:bg-red-150 text-red-700 border border-red-200 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" /> 
                          <span>Ask for Recheck</span>
                        </button>
                        <button
                          onClick={() => handleReview("approve")}
                          disabled={isReviewing}
                          className="flex items-center justify-center gap-1.5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-mono text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4" /> 
                          <span>Approve Task</span>
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="no-submission-selection"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-8 text-center border border-purple-150 bg-purple-50/5 rounded-3xl"
                    >
                      <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-500 font-mono">
                        Select a student submission from the list to view its code/answer and perform review actions.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : activeTab === "users" ? (
            /* Users Roster List */
            <motion.div
              key="users-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-white border border-purple-100 rounded-3xl p-6 shadow-xs">
                {/* Search Header */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
                  <h3 className="text-sm font-bold font-mono text-slate-800 uppercase tracking-wider">
                    Student & System Users ({filteredUsers?.length || 0})
                  </h3>
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search users name, email..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-hidden font-mono text-xs"
                    />
                  </div>
                </div>

                {isUsersLoading ? (
                  <div className="p-10 flex flex-col justify-center items-center">
                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-2" />
                    <span className="text-xs text-slate-400 font-mono">Loading rosters...</span>
                  </div>
                ) : filteredUsers && filteredUsers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                          <th className="pb-3 pl-2">Name</th>
                          <th className="pb-3">Email</th>
                          <th className="pb-3">Onboarding</th>
                          <th className="pb-3">Career Target</th>
                          <th className="pb-3">Role</th>
                          <th className="pb-3 text-right pr-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredUsers.map((user) => (
                          <tr
                            key={user.id}
                            className={`hover:bg-purple-50/10 transition-colors ${
                              user.is_blocked ? "bg-red-50/10 text-slate-400" : ""
                            }`}
                          >
                            <td className="py-4 pl-2 font-semibold flex items-center gap-2">
                              <span>{user.name}</span>
                              {user.is_blocked && (
                                <span className="px-1.5 py-0.5 bg-red-100 border border-red-200 text-red-700 text-[8px] font-bold rounded-sm uppercase">
                                  Blocked
                                </span>
                              )}
                            </td>
                            <td className="py-4">{user.email}</td>
                            <td className="py-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                  user.profile_complete
                                    ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                                    : "bg-amber-50 border border-amber-200 text-amber-700"
                                }`}
                              >
                                {user.profile_complete ? "Complete" : "Incomplete"}
                              </span>
                            </td>
                            <td className="py-4 text-slate-700 truncate max-w-xs">
                              {user.career_goal || "Not set"}
                            </td>
                            <td className="py-4 capitalize font-semibold">{user.role}</td>
                            <td className="py-4 text-right pr-2 space-x-2 shrink-0 whitespace-nowrap">
                              {/* Book Meeting */}
                              <button
                                onClick={() => openBooking(user)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                              >
                                <Video className="w-3.5 h-3.5" />
                                <span>Book Meet</span>
                              </button>

                              {/* Block/Unblock toggle */}
                              <button
                                onClick={() => handleBlockToggle(user)}
                                disabled={isBlocking || isUnblocking}
                                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                  user.is_blocked
                                    ? "bg-emerald-50 border-emerald-250 text-emerald-700 hover:bg-emerald-100"
                                    : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                                }`}
                              >
                                {user.is_blocked ? (
                                  <>
                                    <UserCheck className="w-3.5 h-3.5" />
                                    <span>Unblock</span>
                                  </>
                                ) : (
                                  <>
                                    <UserX className="w-3.5 h-3.5" />
                                    <span>Block</span>
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center border border-dashed border-purple-100 rounded-3xl">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-mono">No users found matching query.</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            /* Bookings tab */
            <motion.div
              key="bookings-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Bookings List */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white border border-purple-100 rounded-3xl p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold font-mono text-slate-800 uppercase tracking-wider">
                      Mentor Call Requests
                    </h3>
                    <span className="px-2.5 py-1 bg-red-50 border border-red-200 text-red-700 text-[10px] font-mono rounded-full font-bold font-extrabold font-mono">
                      {adminBookingRequests?.filter((r: any) => r.status === 'pending').length || 0} Pending
                    </span>
                  </div>

                  {adminBookingRequests && adminBookingRequests.length > 0 ? (
                    <div className="space-y-3">
                      {adminBookingRequests.map((req: any) => {
                        let statusColor = "bg-slate-100 text-slate-605 border-slate-200";
                        if (req.status === "approved") {
                          statusColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
                        } else if (req.status === "rejected") {
                          statusColor = "bg-red-50 text-red-700 border-red-200";
                        } else {
                          statusColor = "bg-purple-50 text-purple-700 border-purple-200";
                        }

                        return (
                          <div
                            key={req.id}
                            onClick={() => {
                              if (req.status === 'pending') {
                                setSelectedRequestForReview(req);
                              }
                            }}
                            className={`p-4 border rounded-2xl transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
                              req.status === 'pending' ? 'cursor-pointer hover:border-purple-105 hover:bg-purple-50/5' : ''
                            } ${
                              selectedRequestForReview?.id === req.id
                                ? "border-purple-600 bg-purple-50/15 shadow-xs"
                                : "border-purple-50"
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-xs font-bold font-mono text-slate-700">{req.title}</h4>
                                <span className={`px-2 py-0.5 text-[8px] font-bold font-mono rounded-md uppercase border ${statusColor}`}>
                                  {req.status}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-450 font-mono">
                                Student: {req.student_name} ({req.student_email})
                              </p>
                              {req.description && (
                                <p className="text-[10px] font-mono text-slate-500 bg-slate-50 border border-slate-100 p-2 rounded-lg mt-1">
                                  "{req.description}"
                                </p>
                              )}
                            </div>
                            <div className="text-right shrink-0 font-mono text-[9px] text-slate-400">
                              {req.status === 'approved' ? (
                                <div className="space-y-1">
                                  <span className="block text-slate-655 font-bold">Scheduled: {new Date(req.scheduled_at).toLocaleDateString()}</span>
                                  <a
                                    href={req.meet_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-purple-600 hover:underline font-semibold"
                                  >
                                    <ExternalLink className="w-3 h-3" /> Meet Link
                                  </a>
                                </div>
                              ) : (
                                <span>Requested {new Date(req.created_at).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-10 text-center border border-dashed border-purple-100 rounded-3xl">
                      <Calendar className="w-12 h-12 text-slate-350 mx-auto mb-2" />
                      <p className="text-xs text-slate-505 font-mono">No call requests submitted yet.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Respond Console */}
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
                        <h3 className="text-sm font-bold font-mono text-slate-808 mt-1 text-slate-800">{selectedRequestForReview.title}</h3>
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
                        <label className="text-[10px] font-bold font-mono text-slate-550 block">Schedule Date & Time</label>
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
                          className="flex items-center justify-center gap-1.5 py-2.5 bg-red-50 hover:bg-red-100 text-red-755 border border-red-200 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
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
                  ) : (
                    <motion.div
                      key="no-selection"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-6 text-center border border-purple-100 bg-purple-50/5 rounded-3xl"
                    >
                      <Calendar className="w-10 h-10 text-slate-350 mx-auto mb-2" />
                      <p className="text-xs text-slate-505 font-mono">
                        Select a pending call request from the list to view details and schedule check-in.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Booking Google Meet Modal */}
      <AnimatePresence>
        {showBookingModal && selectedUserForBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-purple-100 rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-5"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-700">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-mono text-slate-800">Schedule Google Meet</h3>
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                      Inviting: {selectedUserForBooking.name} ({selectedUserForBooking.email})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {!bookingResultLink ? (
                <form onSubmit={handleBookCallSubmit} className="space-y-4">
                  {/* Title */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider block">
                      Meeting Title
                    </label>
                    <input
                      type="text"
                      required
                      value={bookingTitle}
                      onChange={(e) => setBookingTitle(e.target.value)}
                      className="w-full p-3 border border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-hidden font-mono text-xs"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider block">
                      Description
                    </label>
                    <textarea
                      value={bookingDescription}
                      onChange={(e) => setBookingDescription(e.target.value)}
                      className="w-full h-16 p-3 border border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-hidden font-mono text-xs resize-none"
                    />
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider block">
                        Select Date
                      </label>
                      <input
                        type="date"
                        required
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full p-3 border border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-hidden font-mono text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider block">
                        Start Time
                      </label>
                      <input
                        type="time"
                        required
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                        className="w-full p-3 border border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-hidden font-mono text-xs"
                      />
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-wider block">
                      Duration
                    </label>
                    <select
                      value={bookingDuration}
                      onChange={(e) => setBookingDuration(e.target.value)}
                      className="w-full p-3 border border-purple-100 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-hidden font-mono text-xs"
                    >
                      <option value="15">15 Minutes</option>
                      <option value="30">30 Minutes</option>
                      <option value="45">45 Minutes</option>
                      <option value="60">60 Minutes (1 Hour)</option>
                    </select>
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={isBookingCall}
                    className="w-full flex items-center justify-center gap-1.5 py-3 bg-[#1E192B] hover:bg-purple-950 text-white rounded-xl font-mono text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {isBookingCall ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Reserving Google Meet...</span>
                      </>
                    ) : (
                      <>
                        <Calendar className="w-4 h-4" />
                        <span>Confirm & Generate Call Link</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* Success Link Screen */
                <div className="space-y-4 pt-2 text-center font-mono">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">Meeting Successfully Booked!</h4>
                  <p className="text-[10px] text-slate-500">
                    A calendar event has been scheduled and the invitation has been dispatched to {selectedUserForBooking.email}.
                  </p>

                  <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-2xl space-y-2">
                    <span className="text-[9px] font-bold text-purple-600 uppercase block tracking-wider">
                      Google Meet URL
                    </span>
                    <a
                      href={bookingResultLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-indigo-700 hover:underline flex items-center justify-center gap-1.5 break-all select-all font-mono"
                    >
                      <span>{bookingResultLink}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  </div>

                  <button
                    onClick={() => {
                      setShowBookingModal(false);
                      setBookingResultLink(null);
                    }}
                    className="w-full py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Close Modal
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

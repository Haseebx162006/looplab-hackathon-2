"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Users,
  Search,
  UserX,
  UserCheck,
  ArrowLeft
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { HoverSidebar } from "@/components/layout/HoverSidebar";
import { useCompany } from "@/context/CompanyContext";
import { useGetMeQuery } from "@/store/api/authApi";
import {
  useGetAllUsersQuery,
  useBlockUserMutation,
  useUnblockUserMutation,
} from "@/store/api/learningApi";

export default function AdminUsersRosterPage() {
  const router = useRouter();
  const { isAuthenticated } = useCompany();

  // Verify admin role
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

  const [userSearchQuery, setUserSearchQuery] = useState("");

  const { data: users, refetch: refetchUsers, isLoading: isUsersLoading } = useGetAllUsersQuery(undefined, {
    skip: !userProfile || userProfile.user?.role !== "admin",
  });
  const [blockUser, { isLoading: isBlocking }] = useBlockUserMutation();
  const [unblockUser, { isLoading: isUnblocking }] = useUnblockUserMutation();

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

  const filteredUsers = users?.filter((u: any) => {
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
        <Loader2 className="w-12 h-12 text-[#7C3AED] animate-spin mb-4" />
        <p className="text-sm font-mono text-slate-500">Checking credentials...</p>
      </div>
    );
  }

  return (
    <div data-lenis-prevent className="min-h-screen bg-[#F5F2FA] flex font-sans selection:bg-[#7C3AED] selection:text-white">
      <HoverSidebar />
      <Toaster position="top-right" toastOptions={{ className: 'font-mono text-sm shadow-xl rounded-2xl' }} />

      <main className="flex-1 ml-0 md:ml-20 p-6 md:p-10 pt-20 md:pt-10 max-w-7xl overflow-x-hidden pb-32">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-mono text-slate-900">
                User Roster
              </h1>
              <span className="px-2.5 py-1 bg-purple-900/10 text-[#7C3AED] text-[10px] font-extrabold font-mono rounded-full border border-purple-200 uppercase">
                System Accounts
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-1">
              Manage student accounts, control access, and view user profiles.
            </p>
          </div>
          
          <button
            onClick={() => router.push("/admin")}
            className="flex items-center gap-1.5 px-4 py-2 border border-[#D8CBEB] hover:bg-purple-50 text-slate-700 rounded-xl font-mono text-xs font-semibold transition-colors cursor-pointer shrink-0 shadow-xs bg-white"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-[#D8CBEB]/50 rounded-3xl p-6 shadow-xs relative overflow-hidden"
        >
          {/* Decorative blur */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6 relative z-10">
            <h3 className="text-sm font-bold font-mono text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-[#7C3AED]" /> 
              Student Directory ({filteredUsers?.length || 0})
            </h3>
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, email, role..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-[#D8CBEB]/50 rounded-xl focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent outline-hidden font-mono text-xs shadow-inner bg-slate-50/50"
              />
            </div>
          </div>

          <div className="relative z-10">
            {isUsersLoading ? (
              <div className="p-16 flex flex-col justify-center items-center bg-slate-50/50 rounded-2xl border border-slate-100">
                <Loader2 className="w-8 h-8 text-[#7C3AED] animate-spin mb-3" />
                <span className="text-xs text-slate-500 font-mono">Fetching student records...</span>
              </div>
            ) : filteredUsers && filteredUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                      <th className="pb-4 pl-4">Student Info</th>
                      <th className="pb-4">Email Address</th>
                      <th className="pb-4">Status</th>
                      <th className="pb-4">Career Objective</th>
                      <th className="pb-4">Role</th>
                      <th className="pb-4 text-right pr-4">Access Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredUsers.map((user: any) => (
                      <tr
                        key={user.id}
                        className={`hover:bg-purple-50/30 transition-colors group ${
                          user.is_blocked ? "bg-red-50/10 text-slate-400" : ""
                        }`}
                      >
                        <td className="py-4 pl-4 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#7C3AED] to-[#B794F4] text-white flex items-center justify-center font-bold shadow-sm shrink-0">
                            {user.name?.[0]?.toUpperCase() || "S"}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 group-hover:text-[#7C3AED] transition-colors">{user.name}</span>
                            {user.is_blocked && (
                              <span className="ml-2 px-1.5 py-0.5 bg-red-100 border border-red-200 text-red-700 text-[8px] font-bold rounded-sm uppercase inline-block">
                                Blocked
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 text-slate-500">{user.email}</td>
                        <td className="py-4">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wide border shadow-xs ${
                              user.profile_complete
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                : "bg-amber-50 border-amber-200 text-amber-700"
                            }`}
                          >
                            {user.profile_complete ? "Complete" : "Pending"}
                          </span>
                        </td>
                        <td className="py-4 text-slate-600 truncate max-w-[180px]" title={user.career_goal}>
                          {user.career_goal || <span className="text-slate-300 italic">Not specified</span>}
                        </td>
                        <td className="py-4 font-bold text-slate-700">
                           <span className="px-2 py-0.5 bg-slate-100 rounded-lg border border-slate-200 uppercase text-[9px]">
                             {user.role}
                           </span>
                        </td>
                        <td className="py-4 text-right pr-4 shrink-0 whitespace-nowrap">
                          <button
                            onClick={() => handleBlockToggle(user)}
                            disabled={isBlocking || isUnblocking}
                            className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all shadow-xs cursor-pointer ${
                              user.is_blocked
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:shadow-emerald-200/50"
                                : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:shadow-red-200/50"
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
                                <span>Suspend</span>
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
              <div className="p-16 text-center border border-dashed border-[#D8CBEB]/50 bg-slate-50/30 rounded-2xl">
                <div className="w-16 h-16 bg-white border border-[#D8CBEB]/50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Users className="w-8 h-8 text-slate-300" />
                </div>
                <h4 className="text-sm font-bold text-slate-700 mb-1">No users found</h4>
                <p className="text-xs text-slate-500 font-mono max-w-md mx-auto">
                  We couldn't find any user matching your search query. Try adjusting your filters or terms.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}

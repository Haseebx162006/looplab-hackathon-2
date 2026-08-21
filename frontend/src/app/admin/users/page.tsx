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
  ArrowLeft,
  Filter,
  Shield,
  Briefcase,
  Target,
  GraduationCap,
  Calendar,
  ChevronRight,
  Activity,
  X,
  CheckCircle2,
  Lock,
  Unlock,
  AlertTriangle
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { HoverSidebar } from "@/components/layout/HoverSidebar";
import { useCompany } from "@/context/CompanyContext";
import { useGetMeQuery } from "@/store/api/authApi";
import {
  useGetAllUsersQuery,
  useBlockUserMutation,
  useUnblockUserMutation,
  useGetAdminUserProgressQuery
} from "@/store/api/learningApi";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

const PIE_COLORS = ['#10B981', '#F43F5E', '#F59E0B'];
const BAR_COLORS = ['#8B5CF6', '#3B82F6', '#EC4899', '#14B8A6'];

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

  // Filters
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [completionFilter, setCompletionFilter] = useState("all");

  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  
  const { data: adminProgressData } = useGetAdminUserProgressQuery(selectedUser?.id || '', {
    skip: !selectedUser?.id,
  });

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
      if (selectedUser?.id === user.id) {
        setSelectedUser({ ...selectedUser, is_blocked: !user.is_blocked });
      }
    } catch (err: any) {
      toast.error(err.data?.error || err.data?.message || err.message || "Failed to change user block status.");
    }
  };

  const filteredUsers = users?.filter((u: any) => {
    const query = userSearchQuery.toLowerCase();
    const matchesSearch = u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query) || (u.career_goal || "").toLowerCase().includes(query);
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesStatus = statusFilter === "all" ? true : statusFilter === "blocked" ? u.is_blocked : !u.is_blocked;
    const matchesCompletion = completionFilter === "all" ? true : completionFilter === "complete" ? u.profile_complete : !u.profile_complete;

    return matchesSearch && matchesRole && matchesStatus && matchesCompletion;
  });

  // Dynamic Chart Data
  let statusData = [
    { name: 'Active', value: 0 },
    { name: 'Blocked', value: 0 },
    { name: 'Unverified', value: 0 }
  ];
  
  let roleData: any[] = [];
  
  if (users) {
    let active = 0, blocked = 0, unverified = 0;
    const rolesCount: Record<string, number> = {};
    
    users.forEach((u: any) => {
      if (u.is_blocked) blocked++;
      else if (!u.is_verified) unverified++;
      else active++;

      const r = u.role || 'user';
      rolesCount[r] = (rolesCount[r] || 0) + 1;
    });

    statusData = [
      { name: 'Active', value: active },
      { name: 'Blocked', value: blocked },
      { name: 'Unverified', value: unverified }
    ].filter(d => d.value > 0);

    roleData = Object.entries(rolesCount).map(([name, value]) => ({ name, users: value }));
  }

  if (isUserLoading || (userProfile && userProfile.user?.role !== "admin")) {
    return (
      <div className="min-h-screen bg-[#0F0A19] flex flex-col justify-center items-center font-sans">
        <Loader2 className="w-16 h-16 text-[#8B5CF6] animate-spin mb-6" />
        <p className="text-sm font-mono text-slate-400 tracking-widest uppercase">Accessing Roster...</p>
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
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                 <Users className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight font-mono text-slate-900 flex items-center gap-2">
                  System Roster
                  <span className="px-2 py-0.5 bg-[#8B5CF6]/10 text-[#8B5CF6] text-[10px] font-extrabold font-mono rounded-full border border-purple-200 uppercase tracking-widest">
                    {users?.length || 0} Total
                  </span>
                </h1>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase tracking-wider">
                  Identity & Access Management
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

        <div className="px-6 md:px-10 mt-8 space-y-6 max-w-7xl mx-auto">
          
          {/* CHARTS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/80 backdrop-blur-xl border border-[#E9D5FF]/50 rounded-3xl p-6 shadow-xl relative overflow-hidden h-[220px] flex items-center">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
               <div className="w-1/2">
                 <h3 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider mb-1">Account Health</h3>
                 <p className="text-[10px] text-slate-500 font-mono mb-4">Current user status distribution</p>
                 <div className="space-y-2 font-mono text-[10px]">
                    {statusData.map((d, i) => (
                      <div key={d.name} className="flex items-center justify-between pr-4">
                         <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full" style={{backgroundColor: PIE_COLORS[i % PIE_COLORS.length]}}></div>
                           <span className="text-slate-600">{d.name}</span>
                         </div>
                         <span className="font-bold text-slate-800">{d.value}</span>
                      </div>
                    ))}
                 </div>
               </div>
               <div className="w-1/2 h-[150px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                          {statusData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                       </Pie>
                       <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontFamily: 'monospace', fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
               </div>
            </div>

            <div className="bg-white/80 backdrop-blur-xl border border-[#E9D5FF]/50 rounded-3xl p-6 shadow-xl relative overflow-hidden h-[220px] flex flex-col">
               <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
               <h3 className="text-xs font-bold font-mono text-slate-800 uppercase tracking-wider mb-1 relative z-10">Role Distribution</h3>
               <div className="flex-1 w-full mt-4 relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={roleData} margin={{top: 0, right: 0, left: -25, bottom: 0}} layout="vertical">
                       <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                       <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontFamily: 'monospace' }} />
                       <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748B', fontFamily: 'monospace' }} />
                       <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontFamily: 'monospace', fontSize: '10px' }} />
                       <Bar dataKey="users" radius={[0, 4, 4, 0]} barSize={20}>
                         {roleData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                         ))}
                       </Bar>
                    </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>
          </div>

          {/* FILTERS & SEARCH */}
          <div className="bg-white/80 backdrop-blur-xl border border-[#E9D5FF]/50 rounded-2xl p-4 shadow-xl flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative w-full lg:w-96 shrink-0">
              <Search className="w-4 h-4 text-[#8B5CF6] absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, email, objective..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent outline-hidden font-mono text-xs shadow-inner bg-slate-50/50 transition-all hover:bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
               <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                 <Filter className="w-3.5 h-3.5 text-slate-400" />
                 <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="bg-transparent border-none outline-hidden font-mono text-[10px] font-bold text-slate-700 cursor-pointer">
                   <option value="all">All Roles</option>
                   <option value="user">User</option>
                   <option value="admin">Admin</option>
                 </select>
               </div>
               <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                 <Activity className="w-3.5 h-3.5 text-slate-400" />
                 <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-transparent border-none outline-hidden font-mono text-[10px] font-bold text-slate-700 cursor-pointer">
                   <option value="all">All Statuses</option>
                   <option value="active">Active</option>
                   <option value="blocked">Blocked</option>
                 </select>
               </div>
               <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                 <Target className="w-3.5 h-3.5 text-slate-400" />
                 <select value={completionFilter} onChange={(e) => setCompletionFilter(e.target.value)} className="bg-transparent border-none outline-hidden font-mono text-[10px] font-bold text-slate-700 cursor-pointer">
                   <option value="all">Any Profile State</option>
                   <option value="complete">Complete</option>
                   <option value="incomplete">Incomplete</option>
                 </select>
               </div>
            </div>
          </div>

          {/* ROSTER GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
            {isUsersLoading ? (
              <div className="col-span-full py-20 flex flex-col justify-center items-center">
                <Loader2 className="w-8 h-8 text-[#8B5CF6] animate-spin mb-3" />
                <span className="text-xs text-slate-500 font-mono tracking-widest uppercase">Fetching Roster...</span>
              </div>
            ) : filteredUsers && filteredUsers.length > 0 ? (
              filteredUsers.map((user: any, idx: number) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`bg-white border rounded-3xl p-5 cursor-pointer transition-all hover:-translate-y-1 relative overflow-hidden group ${
                    user.id === selectedUser?.id 
                      ? 'border-[#8B5CF6] shadow-[0_0_30px_rgba(139,92,246,0.15)] ring-1 ring-[#8B5CF6]' 
                      : 'border-slate-200 hover:border-[#8B5CF6]/50 hover:shadow-xl'
                  }`}
                >
                  {user.is_blocked && (
                    <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-bl-[100px] flex justify-end items-start p-3 pointer-events-none">
                       <Lock className="w-3 h-3 text-red-500" />
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-inner shrink-0 overflow-hidden ${
                       user.is_blocked 
                        ? 'bg-red-50 text-red-400' 
                        : user.role === 'admin' 
                          ? 'bg-gradient-to-tr from-[#8B5CF6] to-[#3B82F6] text-white' 
                          : 'bg-slate-100 text-slate-600'
                     }`}>
                       {user.avatar_url ? (
                         <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                       ) : (
                         user.name?.[0]?.toUpperCase() || "U"
                       )}
                     </div>
                     <div className="flex-1 min-w-0 pr-6">
                        <h4 className="font-bold text-slate-900 truncate font-mono text-sm group-hover:text-[#8B5CF6] transition-colors">{user.name}</h4>
                        <p className="text-[10px] text-slate-500 truncate font-mono mt-0.5">{user.email}</p>
                        
                        <div className="flex items-center gap-2 mt-3">
                           <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-[9px] font-bold font-mono uppercase text-slate-600">
                             {user.role || 'user'}
                           </span>
                           {user.profile_complete ? (
                             <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-md text-[9px] font-bold font-mono uppercase text-emerald-600 flex items-center gap-1">
                               <CheckCircle2 className="w-2.5 h-2.5" /> Setup
                             </span>
                           ) : (
                             <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-md text-[9px] font-bold font-mono uppercase text-amber-600">
                               Pending
                             </span>
                           )}
                        </div>
                     </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-20 flex flex-col justify-center items-center text-center border-2 border-dashed border-[#E9D5FF] bg-white/50 rounded-[2rem]">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                   <Search className="w-6 h-6 text-slate-400" />
                </div>
                <h4 className="font-bold text-slate-800">No students found</h4>
                <p className="text-xs text-slate-500 font-mono mt-2">Try adjusting your filters or search query.</p>
              </div>
            )}
          </div>
        </div>

        {/* SLIDE-OVER DETAIL PANEL */}
        <AnimatePresence>
          {selectedUser && (
            <>
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSelectedUser(null)}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
              />
              
              {/* Panel */}
              <motion.div
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 bottom-0 w-full md:w-[450px] lg:w-[500px] bg-white border-l border-[#E9D5FF] shadow-[0_0_50px_rgba(139,92,246,0.1)] z-50 flex flex-col overflow-hidden font-sans"
              >
                {/* Header */}
                <div className="relative h-40 bg-gradient-to-br from-[#8B5CF6]/10 to-[#EC4899]/10 flex items-end px-8 pb-8 shrink-0">
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
                  <button 
                    onClick={() => setSelectedUser(null)}
                    className="absolute top-6 left-6 p-2 bg-white/50 hover:bg-white/80 border border-slate-200 backdrop-blur-md rounded-full text-slate-600 transition-colors cursor-pointer z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  
                  {selectedUser.is_blocked && (
                    <div className="absolute top-6 right-6 px-3 py-1.5 bg-red-500/20 backdrop-blur-md border border-red-500/50 rounded-full text-red-200 text-[10px] font-bold font-mono uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                      <Lock className="w-3 h-3" /> Account Suspended
                    </div>
                  )}

                  <div className="relative z-10 flex items-center gap-5 translate-y-12">
                    <div className="w-24 h-24 rounded-[2rem] bg-white border-4 border-white shadow-xl flex items-center justify-center text-4xl font-black text-slate-800 shrink-0 relative overflow-hidden group">
                      {selectedUser.avatar_url ? (
                        <img src={selectedUser.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#8B5CF6] to-[#3B82F6] opacity-10 group-hover:opacity-20 transition-opacity"></div>
                      )}
                      {!selectedUser.avatar_url && <span className="relative z-10">{selectedUser.name?.[0]?.toUpperCase() || "U"}</span>}
                    </div>
                    <div className="pt-8">
                       <h2 className="text-2xl font-black text-slate-900 truncate max-w-[200px]">{selectedUser.name}</h2>
                       <p className="text-[10px] font-mono text-[#8B5CF6] uppercase tracking-widest bg-[#8B5CF6]/10 px-2 py-0.5 rounded-md inline-block mt-1 border border-[#8B5CF6]/20">
                         {selectedUser.role || 'user'}
                       </p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto pt-16 px-8 pb-10 scrollbar-thin scrollbar-thumb-[#E9D5FF] scrollbar-track-transparent">
                  
                  <div className="space-y-8">
                    {/* Identity Details */}
                    <div>
                      <h4 className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Shield className="w-3 h-3 text-[#8B5CF6]" /> Digital Identity
                      </h4>
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4 shadow-xs">
                        <div>
                          <label className="text-[9px] text-slate-500 font-mono uppercase block mb-1">Email Address</label>
                          <p className="text-sm text-slate-800 font-mono break-all">{selectedUser.email}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                             <label className="text-[9px] text-slate-500 font-mono uppercase block mb-1">Joined</label>
                             <p className="text-xs text-slate-600 font-mono">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                           </div>
                           <div>
                             <label className="text-[9px] text-slate-500 font-mono uppercase block mb-1">Verification</label>
                             <p className="text-xs text-slate-600 font-mono">{selectedUser.is_verified ? 'Verified' : 'Pending'}</p>
                           </div>
                        </div>
                      </div>
                    </div>

                    {/* Career Profile */}
                    <div>
                      <h4 className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Briefcase className="w-3 h-3 text-[#8B5CF6]" /> Career Objectives
                      </h4>
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4 shadow-xs">
                        <div>
                          <label className="text-[9px] text-slate-500 font-mono uppercase block mb-1">Career Goal</label>
                          <p className="text-sm text-[#8B5CF6] font-bold font-mono">{selectedUser.career_goal || 'Not specified'}</p>
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-500 font-mono uppercase block mb-1">Current Experience</label>
                          <p className="text-xs text-slate-600 font-mono capitalize">{selectedUser.experience?.replace('_', ' ') || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Real Roadmap Progress UI */}
                    <div>
                      <h4 className="text-[10px] font-bold font-mono text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <GraduationCap className="w-3 h-3 text-[#8B5CF6]" /> Roadmap Trajectory
                      </h4>
                      
                      {selectedUser.profile_complete ? (
                        <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
                          {(!adminProgressData?.roadmaps || adminProgressData.roadmaps.length === 0) ? (
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 font-mono">
                              No active roadmaps found for this user.
                            </div>
                          ) : (
                            adminProgressData.roadmaps.map((rm, idx) => (
                              <div key={rm.roadmap_id} className="relative">
                                <div className="absolute -left-[29px] top-1 w-4 h-4 rounded-full bg-[#8B5CF6] border-4 border-white shadow-[0_0_10px_rgba(139,92,246,0.3)]"></div>
                                <h5 className="text-xs font-bold font-mono text-slate-800">{rm.module_name}</h5>
                                <div className="mt-2 bg-slate-200 rounded-full h-1.5 w-full overflow-hidden">
                                   <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${rm.progress_percentage}%` }}
                                      className="bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] h-full"
                                   />
                                </div>
                                <p className="text-[10px] text-slate-500 font-mono mt-1 flex justify-between">
                                   <span>{rm.status === 'completed' ? 'Completed' : 'In Progress'} ({rm.tasks_completed}/{rm.tasks_total} Tasks)</span>
                                   <span className="text-[#8B5CF6] font-bold">{Math.round(rm.progress_percentage)}%</span>
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      ) : (
                        <div className="p-5 border border-dashed border-[#E9D5FF] bg-purple-50/50 rounded-2xl flex flex-col items-center justify-center text-center">
                          <AlertTriangle className="w-6 h-6 text-amber-500 mb-2" />
                          <p className="text-xs font-mono text-slate-500">Roadmap generation pending profile setup completion.</p>
                        </div>
                      )}
                    </div>

                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-[#E9D5FF]/50 bg-slate-50 shrink-0">
                  <button
                    onClick={() => handleBlockToggle(selectedUser)}
                    disabled={isBlocking || isUnblocking}
                    className={`w-full py-3.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${
                      selectedUser.is_blocked
                        ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {selectedUser.is_blocked ? (
                      <><Unlock className="w-4 h-4" /> Restore Access</>
                    ) : (
                      <><UserX className="w-4 h-4" /> Suspend Account</>
                    )}
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

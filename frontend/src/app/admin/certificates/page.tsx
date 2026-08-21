"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  Users,
  FileText,
  Palette,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Calendar,
  Sparkles,
  Search,
  Check,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { HoverSidebar } from "@/components/layout/HoverSidebar";
import { useCompany } from "@/context/CompanyContext";
import { useGetMeQuery } from "@/store/api/authApi";
import { useGetAllUsersQuery, useIssueCertificateMutation } from "@/store/api/learningApi";

const STYLES = [
  { id: "Classical Gold", name: "Classical Gold", desc: "Cream canvas, traditional double border, gold accents.", previewColor: "bg-[#FCFAF2] border-amber-300 text-amber-900" },
  { id: "Modern Dark", name: "Modern Dark", desc: "Jet dark canvas, neon violet ornaments, glowing elements.", previewColor: "bg-[#0C0717] border-purple-800 text-purple-300" },
  { id: "Creative Minimal", name: "Creative Minimal", desc: "Clean layout, elegant grids, minimalist grey lines.", previewColor: "bg-[#FAFAFD] border-slate-200 text-slate-800" }
];

export default function AdminCertificatesPage() {
  const router = useRouter();
  const { isAuthenticated } = useCompany();
  const { data: userProfile, isLoading: isMeLoading } = useGetMeQuery(undefined, { skip: !isAuthenticated });
  const { data: users, isLoading: isUsersLoading } = useGetAllUsersQuery(undefined, { skip: !isAuthenticated });
  const [issueCertificate, { isLoading: isIssuing }] = useIssueCertificateMutation();

  // Form State
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("Classical Gold");
  const [searchQuery, setSearchQuery] = useState("");

  // Route protection
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("seekh_auth_token") : null;
    if (!token) {
      router.push("/login");
      return;
    }
    if (userProfile && userProfile.user?.role !== "admin") {
      router.push("/dashboard");
    }
  }, [userProfile, router]);

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAll = (filteredUsers: any[]) => {
    const filteredIds = filteredUsers.map((u) => u.id);
    const allSelected = filteredIds.every((id) => selectedUserIds.includes(id));
    if (allSelected) {
      setSelectedUserIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedUserIds((prev) => [...new Set([...prev, ...filteredIds])]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserIds.length === 0) {
      toast.error("Please select at least one student.");
      return;
    }
    if (!title.trim() || !message.trim()) {
      toast.error("Title and message line are required.");
      return;
    }

    try {
      await issueCertificate({
        userIds: selectedUserIds,
        title,
        message,
        style: selectedStyle
      }).unwrap();

      toast.success(`Successfully issued certificate to ${selectedUserIds.length} student(s)!`);
      setSelectedUserIds([]);
      setTitle("");
      setMessage("");
    } catch (err: any) {
      toast.error(err.data?.error || err.data?.message || err.message || "Failed to issue certificates.");
    }
  };

  if (isMeLoading || (userProfile && userProfile.user?.role !== "admin")) {
    return (
      <div className="min-h-screen bg-[#F5F2FA] flex justify-center items-center font-sans">
        <Loader2 className="w-12 h-12 text-[#7C3AED] animate-spin" />
      </div>
    );
  }

  const studentUsers = (users || []).filter((u: any) => u.role !== "admin");
  const filteredUsers = studentUsers.filter((u: any) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F5F2FA] flex font-sans selection:bg-[#7C3AED] selection:text-white pb-32">
      <HoverSidebar />
      <Toaster position="top-right" toastOptions={{
        className: 'font-mono text-sm shadow-xl rounded-2xl border border-slate-100',
        success: { iconTheme: { primary: '#7C3AED', secondary: '#fff' } }
      }} />

      {/* Main content */}
      <main className="flex-1 ml-0 md:ml-20 overflow-y-auto">
        {/* Top Banner (Matches Settings and Knowledge-base Style) */}
        <div className="h-48 md:h-60 bg-gradient-to-br from-[#7C3AED] via-[#9F7AEA] to-[#B794F4] relative w-full overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
          <div className="absolute top-10 right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 left-20 w-64 h-64 bg-purple-900/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-6xl mx-auto px-6 h-full flex flex-col justify-end pb-8 md:pb-12 text-white">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full border border-white/20 mb-3 text-xs font-mono tracking-wider uppercase w-fit">
              <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
              Mentor Credentials Engine
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase font-sans">
              Issue Verified Certificates
            </h1>
            <p className="text-sm text-purple-100 font-mono mt-1 max-w-2xl">
              Design, customize, and issue cryptographically verifiable credentials directly to your mentees' portals.
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-6xl mx-auto px-6 mt-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Form & Design Options (Col Span 7) */}
            <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-8">
              
              {/* Step 1: Layout style */}
              <div className="bg-white/80 backdrop-blur-xl border border-white rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/40 space-y-6">
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                  <Palette className="w-5 h-5 text-[#7C3AED]" />
                  <h2 className="text-base font-bold font-mono uppercase text-slate-800">1. Select Visual Design</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {STYLES.map((style) => (
                    <div
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between h-40 group ${
                        selectedStyle === style.id
                          ? "bg-purple-50/50 border-[#7C3AED] shadow-lg shadow-purple-500/5 scale-[1.02]"
                          : "bg-slate-50/30 border-slate-200 hover:border-slate-350 hover:bg-white"
                      }`}
                    >
                      <div>
                        <div className="text-sm font-extrabold font-mono text-slate-800 group-hover:text-[#7C3AED] transition-colors">{style.name}</div>
                        <div className="text-[10px] text-slate-500 mt-1 leading-relaxed">{style.desc}</div>
                      </div>

                      <div className={`w-full h-8 rounded-xl border flex items-center justify-center text-[8px] font-black tracking-widest uppercase transition-all shadow-xs ${style.previewColor}`}>
                        {selectedStyle === style.id ? (
                          <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Selected</span>
                        ) : "Preview"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 2: Custom content */}
              <div className="bg-white/80 backdrop-blur-xl border border-white rounded-3xl p-6 md:p-8 shadow-xl shadow-slate-200/40 space-y-6">
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                  <FileText className="w-5 h-5 text-pink-500" />
                  <h2 className="text-base font-bold font-mono uppercase text-slate-800">2. Certificate Content</h2>
                </div>

                <div className="space-y-5">
                  <div className="group">
                    <label className="block text-xs font-bold font-mono text-slate-455 uppercase tracking-wider mb-2 group-focus-within:text-[#7C3AED] transition-colors">
                      Certificate Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Outstanding Achievement in Full-Stack Engineering"
                      className="w-full text-sm font-medium text-slate-800 bg-slate-50/50 border border-slate-200 rounded-2xl px-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-[#7C3AED] outline-hidden transition-all placeholder:text-slate-400"
                      required
                    />
                  </div>

                  <div className="group">
                    <label className="block text-xs font-bold font-mono text-slate-455 uppercase tracking-wider mb-2 group-focus-within:text-pink-500 transition-colors">
                      Assessment / Commendation Line
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="e.g. For demonstrating exceptional software design, robust testing practices, and outstanding performance in RAG systems integration."
                      rows={4}
                      className="w-full text-sm font-medium text-slate-800 bg-slate-50/50 border border-slate-200 rounded-2xl px-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-hidden resize-none leading-relaxed placeholder:text-slate-400 transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Submit Dispatch */}
              <button
                type="submit"
                disabled={isIssuing || selectedUserIds.length === 0}
                className="w-full py-4.5 bg-slate-900 hover:bg-[#7C3AED] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-extrabold font-mono text-xs tracking-widest uppercase rounded-2xl transition-all shadow-lg hover:shadow-purple-500/10 cursor-pointer flex items-center justify-center gap-2"
              >
                {isIssuing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Dispatching Credentials...
                  </>
                ) : (
                  <>
                    <Award className="w-4 h-4" /> Dispatch Certificate ({selectedUserIds.length} Recipient{selectedUserIds.length === 1 ? "" : "s"})
                  </>
                )}
              </button>
            </form>

            {/* Right Column: Student selector (Col Span 5) */}
            <div className="lg:col-span-5 bg-white/80 backdrop-blur-xl border border-white rounded-3xl p-6 shadow-xl shadow-slate-200/40 flex flex-col max-h-[580px]">
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-500" />
                  <h2 className="text-base font-bold font-mono uppercase text-slate-800">3. Select Mentees</h2>
                </div>
                
                {filteredUsers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleSelectAll(filteredUsers)}
                    className="text-[10px] font-extrabold font-mono text-[#7C3AED] hover:underline cursor-pointer"
                  >
                    {filteredUsers.every((u) => selectedUserIds.includes(u.id)) ? "Deselect All" : "Select All"}
                  </button>
                )}
              </div>

              {/* Search Bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full text-xs font-mono text-slate-700 bg-slate-50/50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 focus:bg-white focus:border-[#7C3AED] outline-hidden"
                />
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {isUsersLoading ? (
                  <div className="h-full flex items-center justify-center py-10">
                    <Loader2 className="w-8 h-8 text-[#7C3AED] animate-spin" />
                  </div>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user: any) => {
                    const isSelected = selectedUserIds.includes(user.id);
                    return (
                      <div
                        key={user.id}
                        onClick={() => toggleUserSelection(user.id)}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-purple-50/50 border-[#7C3AED]"
                            : "bg-slate-50/30 border-slate-100 hover:border-slate-200 hover:bg-white"
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div className="text-xs font-extrabold text-slate-800 truncate">{user.name}</div>
                          <div className="text-[10px] font-mono text-slate-455 truncate mt-0.5">{user.email}</div>
                        </div>

                        <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? "bg-[#7C3AED] border-[#7C3AED] text-white" : "border-slate-300"
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-slate-400 font-mono text-xs">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-slate-300 animate-pulse" />
                    No students matching search query.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  BookOpen,
  Target,
  Briefcase,
  Camera,
  Heart,
  Save,
  Plus,
  ArrowLeft,
  X,
  Loader2,
  Settings,
  Bell,
  Shield,
  Palette,
  Mail,
  Smartphone,
  LogOut
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { HoverSidebar } from "@/components/layout/HoverSidebar";
import { useCompany } from "@/context/CompanyContext";
import { useGetMyProfileQuery, useSaveProfileMutation, useUploadAvatarMutation } from "@/store/api/learningApi";
import { useGetMeQuery } from "@/store/api/authApi";

const EXPERIENCE_OPTIONS = [
  "Complete Beginner",
  "Some Exposure",
  "Intermediate",
  "Advanced",
  "Professional",
];

const EDUCATION_OPTIONS = [
  "High School",
  "Associate Degree",
  "Bachelor's Degree",
  "Master's Degree",
  "PhD",
  "Bootcamp / Self-taught",
  "Other",
];

// Helper to convert File object to Base64
function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

export default function SettingsPage() {
  const router = useRouter();
  const { isAuthenticated, logout } = useCompany();
  const { data: profileData, isLoading: isProfileLoading } = useGetMyProfileQuery();
  const [saveProfile, { isLoading: isSaving }] = useSaveProfileMutation();
  const [uploadAvatar, { isLoading: isUploadingAvatar }] = useUploadAvatarMutation();
  const { data: meData } = useGetMeQuery(undefined, { skip: !isAuthenticated });

  const [activeTab, setActiveTab] = useState<"profile" | "preferences" | "notifications" | "security">("profile");

  // Form state
  const [education, setEducation] = useState("");
  const [experience, setExperience] = useState("");
  const [careerGoal, setCareerGoal] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [interestsInput, setInterestsInput] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Populate form from fetched profile
  useEffect(() => {
    if (profileData?.profile) {
      const p = profileData.profile;
      setEducation(p.education || "");
      setExperience(p.experience || "");
      setCareerGoal(p.career_goal || "");
      setSkills(p.skills || []);
      setInterests(p.interests || []);
      setAvatarUrl(p.avatar_url || "");
    }
  }, [profileData]);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("seekh_auth_token") : null;
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const addTag = (
    value: string,
    list: string[],
    setList: (v: string[]) => void,
    setInput: (v: string) => void
  ) => {
    const trimmed = value.trim();
    if (trimmed && !list.includes(trimmed)) {
      setList([...list, trimmed]);
    }
    setInput("");
  };

  const removeTag = (tag: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.filter((t) => t !== tag));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, or WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Profile picture must be smaller than 5MB.");
      return;
    }

    try {
      const base64Data = await readFileAsBase64(file);
      const res = await uploadAvatar({ file: base64Data }).unwrap();
      setAvatarUrl(res.avatar_url);
      toast.success("Profile picture uploaded successfully!");
    } catch (err: any) {
      const msg = err?.data?.error || err?.message || "Profile picture upload failed.";
      toast.error(msg);
    }
  };

  const handleSave = async () => {
    try {
      await saveProfile({
        education,
        experience,
        career_goal: careerGoal,
        skills,
        interests,
        avatar_url: avatarUrl || undefined,
      }).unwrap();
      toast.success("Profile saved successfully!");
    } catch (err: any) {
      toast.error(err.data?.message || err.message || "Failed to save profile.");
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (isProfileLoading) {
    return (
      <div className="min-h-screen bg-[#F5F2FA] flex font-sans">
        <HoverSidebar />
        <main className="flex-1 ml-0 md:ml-20 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="w-12 h-12 text-[#7C3AED]" />
          </motion.div>
        </main>
      </div>
    );
  }

  const initials = meData?.user?.name?.[0]?.toUpperCase() || "S";

  const tabs = [
    { id: "profile", label: "Public Profile", icon: User },
    { id: "preferences", label: "Preferences", icon: Palette },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-[#F5F2FA] flex font-sans selection:bg-[#7C3AED] selection:text-white">
      <HoverSidebar />
      <Toaster position="top-right" toastOptions={{
        className: 'font-mono text-sm shadow-xl rounded-2xl border border-slate-100',
        success: { iconTheme: { primary: '#7C3AED', secondary: '#fff' } }
      }} />

      {/* Main content */}
      <main data-lenis-prevent className="flex-1 ml-0 md:ml-20 overflow-y-auto pb-32">
        {/* Top Banner */}
        <div className="h-48 md:h-64 bg-gradient-to-br from-[#7C3AED] via-[#9F7AEA] to-[#B794F4] relative w-full overflow-hidden">
          {/* Abstract background shapes */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black opacity-5 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />
          
          <div className="absolute top-6 left-6 md:top-10 md:left-10 z-10">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-xl font-mono text-xs font-semibold transition-all shadow-sm border border-white/20 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-8 -mt-20 md:-mt-24 relative z-10">
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Left Sidebar Layout */}
            <div className="w-full lg:w-72 shrink-0 space-y-6">
              
              {/* Profile Overview Card */}
              <div className="bg-white/80 backdrop-blur-xl border border-white rounded-3xl p-6 shadow-xl shadow-slate-200/40 text-center flex flex-col items-center">
                
                <div className="relative group w-32 h-32 mb-5 ring-4 ring-white rounded-full bg-white shadow-lg shadow-purple-500/10">
                  {isUploadingAvatar ? (
                    <div className="w-full h-full rounded-full border-2 border-dashed border-[#7C3AED] bg-purple-50 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-[#7C3AED] animate-spin" />
                    </div>
                  ) : avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-full h-full rounded-full object-cover shadow-inner"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#7C3AED] to-[#B794F4] text-white text-4xl font-black flex items-center justify-center shadow-inner">
                      {initials}
                    </div>
                  )}

                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute bottom-1 right-1 p-2.5 bg-slate-900 hover:bg-[#7C3AED] text-white rounded-full cursor-pointer shadow-lg transition-all scale-95 hover:scale-110"
                    title="Upload picture"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  {meData?.user?.name || "Professional Profile"}
                </h2>
                <p className="text-xs font-mono text-slate-500 mt-1 mb-4 px-4 bg-slate-50 py-1 rounded-full border border-slate-100">
                  {meData?.user?.email || "email@example.com"}
                </p>

                <input
                  type="file"
                  ref={avatarInputRef}
                  onChange={handleAvatarUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Navigation Menu */}
              <div className="bg-white/80 backdrop-blur-xl border border-white rounded-3xl p-4 shadow-xl shadow-slate-200/40">
                <nav className="flex flex-col gap-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer ${
                          isActive
                            ? "bg-gradient-to-r from-purple-50 to-indigo-50 text-[#7C3AED] shadow-sm border border-purple-100/50"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? "text-[#7C3AED]" : "text-slate-400"}`} />
                        {tab.label}
                      </button>
                    );
                  })}
                  <div className="h-px bg-slate-100 my-2" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </nav>
              </div>

            </div>

            {/* Main Settings Area */}
            <div className="flex-1 bg-white/80 backdrop-blur-xl border border-white rounded-3xl p-6 md:p-10 shadow-xl shadow-slate-200/40 min-h-[600px]">
              
              <AnimatePresence mode="wait">
                
                {/* PROFILE TAB */}
                {activeTab === "profile" && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-10"
                  >
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">Public Profile</h2>
                      <p className="text-sm text-slate-500 font-mono">Manage your personal information and professional details.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Education & Experience */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 mb-4">
                          <BookOpen className="w-5 h-5 text-[#7C3AED]" />
                          <h3 className="text-base font-bold text-slate-800">Background</h3>
                        </div>

                        <div className="space-y-5">
                          <div className="group">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 group-focus-within:text-[#7C3AED] transition-colors">
                              Education Level
                            </label>
                            <select
                              value={education}
                              onChange={(e) => setEducation(e.target.value)}
                              className="w-full text-sm font-semibold text-slate-800 bg-slate-50/50 border border-slate-200 rounded-2xl px-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-[#7C3AED] outline-hidden cursor-pointer transition-all appearance-none"
                            >
                              <option value="">Select education...</option>
                              {EDUCATION_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </div>

                          <div className="group">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 group-focus-within:text-[#7C3AED] transition-colors">
                              Experience Level
                            </label>
                            <select
                              value={experience}
                              onChange={(e) => setExperience(e.target.value)}
                              className="w-full text-sm font-semibold text-slate-800 bg-slate-50/50 border border-slate-200 rounded-2xl px-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-[#7C3AED] outline-hidden cursor-pointer transition-all appearance-none"
                            >
                              <option value="">Select experience...</option>
                              {EXPERIENCE_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Career Goals */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Target className="w-5 h-5 text-rose-500" />
                          <h3 className="text-base font-bold text-slate-800">Career Objectives</h3>
                        </div>

                        <div className="group">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 group-focus-within:text-rose-500 transition-colors">
                            Professional Ambitions
                          </label>
                          <textarea
                            value={careerGoal}
                            onChange={(e) => setCareerGoal(e.target.value)}
                            placeholder="Describe your target role, what you are building, or what you want to achieve..."
                            rows={5}
                            className="w-full text-sm font-medium text-slate-800 bg-slate-50/50 border border-slate-200 rounded-2xl px-4 py-3.5 focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-hidden resize-none leading-relaxed placeholder:text-slate-400 transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="w-full h-px bg-slate-100" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Skills */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Briefcase className="w-5 h-5 text-emerald-500" />
                          <h3 className="text-base font-bold text-slate-800">Skills</h3>
                        </div>

                        <div className="group">
                          <div className="flex gap-2 mb-4">
                            <input
                              type="text"
                              value={skillsInput}
                              onChange={(e) => setSkillsInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === ",") {
                                  e.preventDefault();
                                  addTag(skillsInput, skills, setSkills, setSkillsInput);
                                }
                              }}
                              placeholder="e.g. React, Node.js..."
                              className="flex-1 text-sm font-medium text-slate-800 bg-slate-50/50 border border-slate-200 rounded-2xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-hidden transition-all"
                            />
                            <button
                              onClick={() => addTag(skillsInput, skills, setSkills, setSkillsInput)}
                              className="px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-2xl border border-emerald-100 flex items-center justify-center cursor-pointer transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-2 min-h-[40px]">
                            {skills.map((skill) => (
                              <span
                                key={skill}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl shadow-xs"
                              >
                                {skill}
                                <button
                                  onClick={() => removeTag(skill, skills, setSkills)}
                                  className="hover:text-red-500 transition-colors cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </span>
                            ))}
                            {skills.length === 0 && (
                              <span className="text-xs text-slate-400 italic py-1">No skills added.</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Interests */}
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Heart className="w-5 h-5 text-pink-500" />
                          <h3 className="text-base font-bold text-slate-800">Interests</h3>
                        </div>

                        <div className="group">
                          <div className="flex gap-2 mb-4">
                            <input
                              type="text"
                              value={interestsInput}
                              onChange={(e) => setInterestsInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === ",") {
                                  e.preventDefault();
                                  addTag(interestsInput, interests, setInterests, setInterestsInput);
                                }
                              }}
                              placeholder="e.g. UX Design, Web3..."
                              className="flex-1 text-sm font-medium text-slate-800 bg-slate-50/50 border border-slate-200 rounded-2xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-hidden transition-all"
                            />
                            <button
                              onClick={() => addTag(interestsInput, interests, setInterests, setInterestsInput)}
                              className="px-4 py-3 bg-pink-50 hover:bg-pink-100 text-pink-600 rounded-2xl border border-pink-100 flex items-center justify-center cursor-pointer transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-2 min-h-[40px]">
                            {interests.map((interest) => (
                              <span
                                key={interest}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-pink-200 text-pink-700 text-xs font-bold rounded-xl shadow-xs"
                              >
                                {interest}
                                <button
                                  onClick={() => removeTag(interest, interests, setInterests)}
                                  className="hover:text-red-500 transition-colors cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </span>
                            ))}
                            {interests.length === 0 && (
                              <span className="text-xs text-slate-400 italic py-1">No interests added.</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-8 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-8 py-3.5 bg-slate-900 hover:bg-[#7C3AED] text-white rounded-2xl text-sm font-bold transition-all shadow-md hover:shadow-xl hover:shadow-purple-500/20 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" /> Save Profile
                          </>
                        )}
                      </button>
                    </div>

                  </motion.div>
                )}

                {/* PREFERENCES TAB (MOCK) */}
                {activeTab === "preferences" && (
                  <motion.div
                    key="preferences"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-8"
                  >
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">Preferences</h2>
                      <p className="text-sm text-slate-500 font-mono">Customize your workspace and learning environment.</p>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-slate-800">Theme Preference</h4>
                          <p className="text-xs text-slate-500 mt-1">Select your preferred color theme for the dashboard.</p>
                        </div>
                        <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                          <button className="px-4 py-2 text-xs font-bold bg-slate-100 text-slate-800 rounded-lg">Light</button>
                          <button className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-not-allowed">Dark</button>
                          <button className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-not-allowed">System</button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-slate-800">Accessibility</h4>
                          <p className="text-xs text-slate-500 mt-1">Enable high contrast mode and reduce motion.</p>
                        </div>
                        <div className="w-12 h-6 bg-slate-200 rounded-full relative cursor-not-allowed opacity-50">
                          <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* NOTIFICATIONS TAB (MOCK) */}
                {activeTab === "notifications" && (
                  <motion.div
                    key="notifications"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-8"
                  >
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">Notifications</h2>
                      <p className="text-sm text-slate-500 font-mono">Choose how and when we contact you.</p>
                    </div>

                    <div className="space-y-4">
                      {[
                        { title: "Weekly Digest", desc: "Receive a summary of your learning progress", icon: Mail },
                        { title: "Task Reminders", desc: "Get notified when roadmap tasks are pending", icon: Bell },
                        { title: "Mobile Push Alerts", desc: "Urgent alerts on your mobile device", icon: Smartphone },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-5 border border-slate-100 rounded-2xl hover:border-slate-200 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-purple-50 text-[#7C3AED] rounded-xl">
                              <item.icon className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-800 text-sm">{item.title}</h4>
                              <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                            </div>
                          </div>
                          <div className="w-11 h-6 bg-[#7C3AED] rounded-full relative cursor-not-allowed opacity-80 shadow-inner">
                            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* SECURITY TAB (MOCK) */}
                {activeTab === "security" && (
                  <motion.div
                    key="security"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-8"
                  >
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">Security</h2>
                      <p className="text-sm text-slate-500 font-mono">Manage your account security and data privacy.</p>
                    </div>

                    <div className="p-6 border border-slate-100 rounded-3xl space-y-4">
                      <h4 className="font-bold text-slate-800">Password & Authentication</h4>
                      <div className="flex justify-between items-center py-3 border-b border-slate-100">
                        <p className="text-sm font-medium text-slate-600">Change Password</p>
                        <button className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-not-allowed">Update</button>
                      </div>
                      <div className="flex justify-between items-center py-3">
                        <div>
                          <p className="text-sm font-medium text-slate-600">Two-Factor Authentication</p>
                          <p className="text-xs text-slate-400 mt-1">Currently disabled</p>
                        </div>
                        <button className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-not-allowed">Enable</button>
                      </div>
                    </div>

                    <div className="p-6 border border-rose-100 bg-rose-50/30 rounded-3xl">
                      <h4 className="font-bold text-rose-800">Danger Zone</h4>
                      <p className="text-xs text-rose-600 mt-1 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                      <button className="px-4 py-2 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 text-sm font-bold rounded-xl transition-colors cursor-not-allowed">
                        Delete Account
                      </button>
                    </div>
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

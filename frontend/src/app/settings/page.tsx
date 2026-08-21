"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  BookOpen,
  Target,
  Briefcase,
  Upload,
  CheckCircle,
  Loader2,
  FileText,
  X,
  ExternalLink,
  Save,
  Plus,
  ArrowLeft,
  Camera,
  Heart,
  TrendingUp,
  ChevronRight
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
  const { isAuthenticated } = useCompany();
  const { data: profileData, isLoading: isProfileLoading } = useGetMyProfileQuery();
  const [saveProfile, { isLoading: isSaving }] = useSaveProfileMutation();
  const [uploadAvatar, { isLoading: isUploadingAvatar }] = useUploadAvatarMutation();
  const { data: meData } = useGetMeQuery(undefined, { skip: !isAuthenticated });

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

  if (isProfileLoading) {
    return (
      <div className="min-h-screen bg-[#F5F2FA] flex font-sans">
        <HoverSidebar />
        <main className="flex-1 ml-0 md:ml-20 pt-16 md:pt-0 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
        </main>
      </div>
    );
  }

  const initials = meData?.user?.name?.[0]?.toUpperCase() || "S";

  return (
    <div className="min-h-screen bg-[#F5F2FA] flex font-sans">
      <HoverSidebar />
      <Toaster position="top-right" />

      {/* Main container with lenis override and bottom padding */}
      <main data-lenis-prevent className="flex-1 ml-0 md:ml-20 p-6 md:p-10 pt-20 md:pt-10 w-full overflow-x-hidden pb-32">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-[#D8CBEB]/30 mb-8">
          <div>
            <span className="px-2.5 py-1 bg-[#F5F2FA] text-[#7C3AED] text-[10px] font-extrabold font-mono rounded-full border border-[#D8CBEB] uppercase tracking-wider">
              System Settings
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-mono text-slate-900 mt-3">
              Profile Configuration
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-1">
              Configure your career objectives, skills profile, and upload your profile picture.
            </p>
          </div>

          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1.5 px-4 py-2 border border-[#D8CBEB] hover:bg-purple-50 text-slate-700 rounded-xl font-mono text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" /> Return to Dashboard
          </button>
        </div>

        {/* Settings grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Avatar upload, profile card and CV redirect */}
          <div className="space-y-6">
            
            {/* Avatar management card */}
            <div className="bg-white border border-[#D8CBEB]/30 rounded-3xl p-6 shadow-xs font-mono text-center flex flex-col items-center">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-4 self-start">
                Avatar Photo
              </span>

              {/* Avatar circle with image, fallback initials or loading state */}
              <div className="relative group w-28 h-28 mb-4">
                {isUploadingAvatar ? (
                  <div className="w-full h-full rounded-full border-2 border-dashed border-[#7C3AED] bg-purple-50 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-[#7C3AED] animate-spin" />
                  </div>
                ) : avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-full h-full rounded-full object-cover border-2 border-[#7C3AED] shadow-sm"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#7C3AED] to-indigo-650 text-white text-3xl font-black flex items-center justify-center shadow-sm">
                    {initials}
                  </div>
                )}

                {/* Edit overlay */}
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-[#7C3AED] hover:bg-purple-700 text-white rounded-full border-2 border-white cursor-pointer shadow-md transition-all scale-95 hover:scale-100"
                  title="Upload profile picture"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-sm font-bold text-[#1E192B]">
                {meData?.user?.name || "Username"}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {meData?.user?.email}
              </p>

              <input
                type="file"
                ref={avatarInputRef}
                onChange={handleAvatarUpload}
                accept="image/*"
                className="hidden"
              />

              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="mt-4 px-4 py-2 border border-[#D8CBEB] hover:bg-purple-50 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              >
                Change Picture
              </button>
            </div>

            {/* CV Analyzer shortcut card */}
            <div className="bg-[#1E192B] text-white border border-white/5 rounded-3xl p-6 shadow-md font-mono relative overflow-hidden">
              <div className="absolute right-0 bottom-0 opacity-[0.03] pointer-events-none translate-x-4 translate-y-4">
                <FileText className="w-48 h-48" />
              </div>
              
              <span className="text-[9px] font-bold text-[#D8CBEB] uppercase tracking-wider block mb-2">
                CV Intelligence
              </span>
              <h4 className="text-xs font-bold text-white leading-relaxed">
                Resume parsing & ATS grade sheet is now managed directly in the CV Analysis suite.
              </h4>
              <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                Upload your resume, parse skills, identify keywords, and grade structural compliance instantly.
              </p>
              
              <button
                onClick={() => router.push("/cv-report")}
                className="mt-5 w-full flex items-center justify-center gap-1.5 py-3 bg-[#7C3AED] hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Go to CV Analyzer <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Right 2 Columns: Profile form fields */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Core Info card (Education + Experience dropdowns) */}
            <div className="bg-white border border-[#D8CBEB]/30 rounded-3xl p-6 shadow-xs font-mono space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <BookOpen className="w-4 h-4 text-purple-600" />
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Education & Experience</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Education Level
                  </label>
                  <select
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    className="w-full text-xs font-mono text-slate-800 bg-white border border-[#D8CBEB]/20 rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-[#7C3AED] focus:border-transparent outline-hidden cursor-pointer"
                  >
                    <option value="">Select education...</option>
                    {EDUCATION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Experience Level
                  </label>
                  <select
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="w-full text-xs font-mono text-slate-800 bg-white border border-[#D8CBEB]/20 rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-[#7C3AED] focus:border-transparent outline-hidden cursor-pointer"
                  >
                    <option value="">Select experience...</option>
                    {EXPERIENCE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Career Goals textarea */}
            <div className="bg-white border border-[#D8CBEB]/30 rounded-3xl p-6 shadow-xs font-mono space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <Target className="w-4 h-4 text-[#7C3AED]" />
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Career Objectives</h2>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Describe your target role & professional ambitions
                </label>
                <textarea
                  value={careerGoal}
                  onChange={(e) => setCareerGoal(e.target.value)}
                  placeholder="e.g. Become a full-stack engineer, build scalable cloud architectures, or master machine learning systems..."
                  rows={4}
                  className="w-full text-xs font-mono text-slate-800 bg-white border border-[#D8CBEB]/20 rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-[#7C3AED] focus:border-transparent outline-hidden resize-none leading-relaxed placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Skills tag input */}
            <div className="bg-white border border-[#D8CBEB]/30 rounded-3xl p-6 shadow-xs font-mono space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <Briefcase className="w-4 h-4 text-emerald-600" />
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Skills Profile</h2>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Skills Registered
                </label>
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
                    placeholder="Type a skill (e.g. React, Node) and press Enter..."
                    className="flex-1 text-xs font-mono text-slate-800 bg-white border border-[#D8CBEB]/20 rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-[#7C3AED] focus:border-transparent outline-hidden"
                  />
                  <button
                    onClick={() => addTag(skillsInput, skills, setSkills, setSkillsInput)}
                    className="px-4 py-2 bg-purple-55 hover:bg-purple-100 text-[#7C3AED] rounded-xl border border-purple-100 flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span
                        key={skill}
                        className="flex items-center gap-1.5 px-3 py-1 bg-purple-50 border border-purple-200/50 text-[#7C3AED] text-xs font-mono font-bold rounded-xl"
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
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400">No skills added yet.</p>
                )}
              </div>
            </div>

            {/* Interests tag input */}
            <div className="bg-white border border-[#D8CBEB]/30 rounded-3xl p-6 shadow-xs font-mono space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                <Heart className="w-4 h-4 text-indigo-500" />
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Interests</h2>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Learning Interests
                </label>
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
                    placeholder="Type an interest (e.g. UX Design, Web3) and press Enter..."
                    className="flex-1 text-xs font-mono text-slate-800 bg-white border border-[#D8CBEB]/20 rounded-xl px-3.5 py-2.5 focus:ring-1 focus:ring-[#7C3AED] focus:border-transparent outline-hidden"
                  />
                  <button
                    onClick={() => addTag(interestsInput, interests, setInterests, setInterestsInput)}
                    className="px-4 py-2 bg-purple-55 hover:bg-purple-100 text-[#7C3AED] rounded-xl border border-purple-100 flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {interests.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {interests.map((interest) => (
                      <span
                        key={interest}
                        className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200/50 text-indigo-705 text-xs font-mono font-bold rounded-xl"
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
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400">No interests added yet.</p>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-4 pt-4">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 py-4 bg-[#7C3AED] hover:bg-purple-700 text-white rounded-2xl font-mono text-sm font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving changes...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Configuration Settings
                  </>
                )}
              </button>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}

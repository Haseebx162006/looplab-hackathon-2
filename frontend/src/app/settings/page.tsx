"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { HoverSidebar } from "@/components/layout/HoverSidebar";
import { useCompany } from "@/context/CompanyContext";
import { useGetMyProfileQuery, useSaveProfileMutation, useUploadCvMutation } from "@/store/api/learningApi";
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

// Helper to convert File object to Base64 data URL
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
  const [uploadCv] = useUploadCvMutation();
  const { data: meData } = useGetMeQuery(undefined, { skip: !isAuthenticated });

  // Form state
  const [education, setEducation] = useState("");
  const [experience, setExperience] = useState("");
  const [careerGoal, setCareerGoal] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [interestsInput, setInterestsInput] = useState("");
  const [interests, setInterests] = useState<string[]>([]);

  // CV state
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [isUploadingCv, setIsUploadingCv] = useState(false);
  const [cvFileName, setCvFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Populate form from fetched profile
  useEffect(() => {
    if (profileData?.profile) {
      const p = profileData.profile;
      setEducation(p.education || "");
      setExperience(p.experience || "");
      setCareerGoal(p.career_goal || "");
      setSkills(p.skills || []);
      setInterests(p.interests || []);
      if (p.cv_url) {
        setCvUrl(p.cv_url);
        const parts = p.cv_url.split("/");
        setCvFileName(decodeURIComponent(parts[parts.length - 1]));
      }
    }
  }, [profileData]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

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

  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("CV file must be smaller than 10MB.");
      return;
    }

    setIsUploadingCv(true);
    try {
      const base64Data = await readFileAsBase64(file);
      const res = await uploadCv({ file: base64Data, fileName: file.name }).unwrap();
      setCvUrl(res.cv_url);
      setCvFileName(file.name);
      toast.success("CV uploaded successfully!");
    } catch (err: any) {
      const msg = err?.data?.error || err?.message || "CV upload failed.";
      toast.error(msg);
    } finally {
      setIsUploadingCv(false);
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
        cv_url: cvUrl || undefined,
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
        <main className="flex-1 ml-20 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F2FA] flex font-sans">
      <HoverSidebar />
      <Toaster position="top-right" />

      <main className="flex-1 ml-20 p-6 md:p-10 max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <span className="px-2.5 py-1 bg-purple-100 text-purple-700 text-[10px] font-extrabold font-mono rounded-full border border-purple-200 uppercase">
            ACCOUNT
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-mono text-slate-900 mt-3">
            Profile Settings
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Update your learning profile and upload your CV.
          </p>
        </div>

        <div className="space-y-6">
          {/* Account Info Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-purple-100 rounded-3xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
                <User className="w-4 h-4 text-purple-600" />
              </div>
              <h2 className="text-sm font-bold font-mono text-slate-800">Account Info</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold font-mono text-slate-500 uppercase mb-1">Name</label>
                <p className="text-sm font-mono text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  {meData?.user?.name || "—"}
                </p>
              </div>
              <div>
                <label className="block text-[10px] font-bold font-mono text-slate-500 uppercase mb-1">Email</label>
                <p className="text-sm font-mono text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  {meData?.user?.email || "—"}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Education & Experience */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white border border-purple-100 rounded-3xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-purple-600" />
              </div>
              <h2 className="text-sm font-bold font-mono text-slate-800">Education & Experience</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold font-mono text-slate-500 uppercase mb-1">
                  Education Level
                </label>
                <select
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  className="w-full text-sm font-mono text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 cursor-pointer"
                >
                  <option value="">Select education...</option>
                  {EDUCATION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold font-mono text-slate-500 uppercase mb-1">
                  Experience Level
                </label>
                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full text-sm font-mono text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 cursor-pointer"
                >
                  <option value="">Select experience...</option>
                  {EXPERIENCE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>

          {/* Career Goal */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border border-purple-100 rounded-3xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
                <Target className="w-4 h-4 text-purple-600" />
              </div>
              <h2 className="text-sm font-bold font-mono text-slate-800">Career Goal</h2>
            </div>
            <textarea
              value={careerGoal}
              onChange={(e) => setCareerGoal(e.target.value)}
              placeholder="e.g. Become a full-stack developer and work at a product startup..."
              rows={3}
              className="w-full text-sm font-mono text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 resize-none"
            />
          </motion.div>

          {/* Skills */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white border border-purple-100 rounded-3xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-purple-600" />
              </div>
              <h2 className="text-sm font-bold font-mono text-slate-800">Skills</h2>
            </div>
            <div className="flex gap-2 mb-3">
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
                placeholder="Type a skill and press Enter..."
                className="flex-1 text-sm font-mono text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
              />
              <button
                onClick={() => addTag(skillsInput, skills, setSkills, setSkillsInput)}
                className="px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="flex items-center gap-1.5 px-3 py-1 bg-purple-50 border border-purple-200 text-purple-700 text-xs font-mono font-bold rounded-full"
                  >
                    {skill}
                    <button
                      onClick={() => removeTag(skill, skills, setSkills)}
                      className="hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </motion.div>

          {/* Interests */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border border-purple-100 rounded-3xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
                <Target className="w-4 h-4 text-purple-600" />
              </div>
              <h2 className="text-sm font-bold font-mono text-slate-800">Interests</h2>
            </div>
            <div className="flex gap-2 mb-3">
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
                placeholder="Type an interest and press Enter..."
                className="flex-1 text-sm font-mono text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
              />
              <button
                onClick={() => addTag(interestsInput, interests, setInterests, setInterestsInput)}
                className="px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {interests.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {interests.map((interest) => (
                  <span
                    key={interest}
                    className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-mono font-bold rounded-full"
                  >
                    {interest}
                    <button
                      onClick={() => removeTag(interest, interests, setInterests)}
                      className="hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </motion.div>

          {/* CV Upload */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white border border-purple-100 rounded-3xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-purple-100 rounded-xl flex items-center justify-center">
                <FileText className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h2 className="text-sm font-bold font-mono text-slate-800">Curriculum Vitae (CV)</h2>
                <p className="text-[10px] font-mono text-slate-400">Upload your CV in PDF, DOC, or DOCX format (max 10MB)</p>
              </div>
            </div>

            {cvUrl ? (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold font-mono text-slate-800 truncate">
                      {cvFileName || "CV Uploaded"}
                    </p>
                    <p className="text-[10px] font-mono text-emerald-600">Uploaded to Cloudinary</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-slate-500 hover:text-purple-600 transition-colors"
                    title="View CV"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => { setCvUrl(null); setCvFileName(null); }}
                    className="p-2 text-slate-500 hover:text-red-500 transition-colors cursor-pointer"
                    title="Remove CV"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingCv}
                className="w-full border-2 border-dashed border-purple-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 hover:border-purple-400 hover:bg-purple-50/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploadingCv ? (
                  <>
                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                    <p className="text-sm font-mono text-purple-600 font-bold">Uploading to Cloudinary...</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-purple-400" />
                    <div className="text-center">
                      <p className="text-sm font-bold font-mono text-slate-700">Click to upload your CV</p>
                      <p className="text-[10px] font-mono text-slate-400 mt-1">PDF, DOC, DOCX — max 10MB</p>
                    </div>
                  </>
                )}
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={handleCvUpload}
            />
          </motion.div>

          {/* Save Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3 pb-8"
          >
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-mono text-sm font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving profile...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Profile
                </>
              )}
            </button>

            {/* Analyze CV shortcut */}
            <button
              onClick={() => router.push("/cv-report")}
              className="w-full flex items-center justify-center gap-2 py-4 bg-white hover:bg-purple-50 text-purple-700 border-2 border-purple-200 hover:border-purple-400 rounded-2xl font-mono text-sm font-bold transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              Analyze My CV with AI →
            </button>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Award,
  Compass,
  Briefcase,
  Wrench,
  Loader2,
  Sparkles,
  ArrowRight,
  ArrowLeft
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useSaveProfileMutation } from "@/store/api/learningApi";
import { useCompany } from "@/context/CompanyContext";

export default function OnboardingPage() {
  const router = useRouter();
  const { setHasCompletedOnboarding, isAuthenticated } = useCompany();
  const [saveProfile, { isLoading }] = useSaveProfileMutation();

  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // Form State
  const [education, setEducation] = useState("");
  const [skills, setSkills] = useState("");
  const [interests, setInterests] = useState("");
  const [careerGoal, setCareerGoal] = useState("");
  const [experience, setExperience] = useState("Beginner");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  const handleNext = () => {
    if (step === 1 && !education) {
      toast.error("Please describe your education background first.");
      return;
    }
    if (step === 2 && !skills) {
      toast.error("Please add at least one technical skill.");
      return;
    }
    if (step === 3 && !interests) {
      toast.error("Please list a few topics that excite you.");
      return;
    }
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!careerGoal) {
      toast.error("Please enter your career aspiration.");
      return;
    }

    try {
      const skillsArray = skills.split(",").map((s) => s.trim()).filter(Boolean);
      const interestsArray = interests.split(",").map((i) => i.trim()).filter(Boolean);

      await saveProfile({
        education,
        skills: skillsArray,
        interests: interestsArray,
        career_goal: careerGoal,
        experience,
      }).unwrap();

      toast.success("Profile customized! Initializing Seekh AI Career Engine...");
      setHasCompletedOnboarding(true);

      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err: any) {
      toast.error(err.data?.message || err.message || "Failed to save profile onboarding details.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F2FA] text-slate-900 flex flex-col justify-center items-center p-4 md:p-8 font-sans">
      <Toaster position="top-right" />
      
      {/* Background visual accents */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl bg-white border border-purple-200/60 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden"
      >
        {/* Progress Bar */}
        <div className="w-full h-1 bg-purple-100 rounded-full mb-8 overflow-hidden">
          <motion.div
            className="h-full bg-purple-600"
            initial={{ width: "25%" }}
            animate={{ width: `${(step / totalSteps) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold font-mono">Academic Background</h1>
                  <p className="text-xs text-slate-500 font-mono">Step 1 of 4: Tell us about your education</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 font-mono">Education Details</label>
                <textarea
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                  placeholder="e.g. self-taught enthusiast, B.S. in Computer Science, or bootcamp graduate..."
                  className="w-full h-32 p-4 border border-purple-200/50 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-hidden font-mono text-sm resize-none bg-purple-50/10 placeholder:text-slate-400"
                />
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl">
                  <Wrench className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold font-mono">Skills Inventory</h1>
                  <p className="text-xs text-slate-500 font-mono">Step 2 of 4: Add your current skills</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 font-mono">Technical Skills (comma-separated)</label>
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="e.g. Python, Javascript, React, SQL..."
                    className="w-full p-4 border border-purple-200/50 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-hidden font-mono text-sm bg-purple-50/10 placeholder:text-slate-400"
                  />
                  <p className="text-[10px] text-slate-400 font-mono">These will be used to calibrate your diagnostic assessments.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 font-mono">Experience Level</label>
                  <div className="grid grid-cols-3 gap-3">
                    {["Beginner", "Intermediate", "Advanced"].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setExperience(level)}
                        className={`p-3.5 rounded-2xl font-mono text-xs font-semibold border transition-all cursor-pointer ${
                          experience === level
                            ? "bg-purple-600 text-white border-purple-600 shadow-md"
                            : "bg-white text-slate-600 border-purple-100 hover:border-purple-300"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl">
                  <Compass className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold font-mono">Learning Interests</h1>
                  <p className="text-xs text-slate-500 font-mono">Step 3 of 4: What fields excite you?</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 font-mono">Topics / Interests (comma-separated)</label>
                <input
                  type="text"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder="e.g. AI Engineering, Web3, Distributed Databases..."
                  className="w-full p-4 border border-purple-200/50 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-hidden font-mono text-sm bg-purple-50/10 placeholder:text-slate-400"
                />
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-2xl">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold font-mono">Career Goals</h1>
                  <p className="text-xs text-slate-500 font-mono">Step 4 of 4: Destination</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 font-mono">Aspirational Career Role</label>
                <input
                  type="text"
                  value={careerGoal}
                  onChange={(e) => setCareerGoal(e.target.value)}
                  placeholder="e.g. Junior Backend Developer, Senior AI Engineer..."
                  className="w-full p-4 border border-purple-200/50 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-hidden font-mono text-sm bg-purple-50/10 placeholder:text-slate-400"
                />
                <p className="text-[10px] text-slate-400 font-mono">The AI agents will compare your diagnostics against this goal to design your roadmap.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Buttons Nav */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-purple-100">
          {step > 1 ? (
            <button
              onClick={handleBack}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 border border-purple-200 rounded-2xl text-slate-600 hover:bg-slate-50 font-mono text-xs font-bold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < totalSteps ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-mono text-xs font-bold transition-all shadow-md cursor-pointer hover:shadow-lg"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-mono text-xs font-bold transition-all shadow-md cursor-pointer hover:shadow-lg disabled:bg-slate-350"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Customizing...
                </>
              ) : (
                <>
                  Build Profile <Sparkles className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  User,
  KeyRound,
  CheckCircle2,
  RefreshCw,
  Loader2,
  ShieldCheck,
  GraduationCap,
  Sparkles
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useDispatch } from "react-redux";
import { setCredentials } from "@/store/slices/authSlice";
import { useCompany } from "@/context/CompanyContext";
import {
  useLoginMutation,
  useSignupMutation,
  useVerifyOtpMutation,
  useResendOtpMutation
} from "@/store/api/authApi";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { setIsAuthenticated, setHasCompletedOnboarding } = useCompany();

  const [isSignUp, setIsSignUp] = useState(false);
  const [step, setStep] = useState<1 | 2>(1); // 1: Credentials Form, 2: OTP Verification

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // 6-Digit OTP State
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Mutation hooks
  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const [signup, { isLoading: isSignupLoading }] = useSignupMutation();
  const [verifyOtp, { isLoading: isVerifyOtpLoading }] = useVerifyOtpMutation();
  const [resendOtp] = useResendOtpMutation();

  const isLoading = isLoginLoading || isSignupLoading || isVerifyOtpLoading;

  // OTP Resend Countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Request OTP for Signup
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (isSignUp && (!name || !password)) {
      toast.error("Please complete all registration fields.");
      return;
    }

    try {
      await signup({ email, password, name }).unwrap();
      toast.success("Verification code sent to your email!");
      setStep(2);
      setTimer(30);
      setCanResend(false);
    } catch (err: any) {
      toast.error(err.data?.message || err.message || "Failed to send verification code.");
    }
  };

  // Verify OTP & Complete Signup
  const handleVerifyAndSignup = async () => {
    const fullCode = otpDigits.join("");
    if (fullCode.length < 6) {
      toast.error("Please enter the complete 6-digit OTP code.");
      return;
    }

    try {
      const data = await verifyOtp({ email, otp: fullCode }).unwrap();

      if (data.token) {
        const isProfileComplete = data.user?.profile_complete || false;
        dispatch(setCredentials({ token: data.token, hasCompletedOnboarding: isProfileComplete }));
        setIsAuthenticated(true);
        setHasCompletedOnboarding(isProfileComplete);
        toast.success("Identity verified! Launching workspace...");
        setTimeout(() => {
          router.push(isProfileComplete ? "/dashboard" : "/onboarding");
        }, 1200);
      } else {
        throw new Error("Token missing from response");
      }
    } catch (err: any) {
      toast.error(err.data?.message || err.message || "Verification failed. Invalid OTP.");
    }
  };

  // Direct Credentials Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter your email and password.");
      return;
    }

    try {
      const data = await login({ email, password }).unwrap();

      if (data.token) {
        const isProfileComplete = data.user?.profile_complete || false;
        dispatch(setCredentials({ token: data.token, hasCompletedOnboarding: isProfileComplete }));
        setIsAuthenticated(true);
        setHasCompletedOnboarding(isProfileComplete);
        toast.success("Welcome back! Launching Seekh dashboard...");
        setTimeout(() => {
          router.push(isProfileComplete ? "/dashboard" : "/onboarding");
        }, 1000);
      } else {
        throw new Error("Token missing from response");
      }
    } catch (err: any) {
      toast.error(err.data?.message || err.message || "Invalid email or password.");
    }
  };

  // OTP Input Auto-Advancing Cursor
  const handleOtpDigitChange = (index: number, val: string) => {
    if (val.length > 1) {
      const digits = val.slice(0, 6).split("");
      const copy = [...otpDigits];
      digits.forEach((d, i) => {
        if (i < 6) copy[i] = d;
      });
      setOtpDigits(copy);
      otpInputRefs.current[5]?.focus();
      return;
    }

    const copy = [...otpDigits];
    copy[index] = val;
    setOtpDigits(copy);

    if (val && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div data-lenis-prevent className="w-screen h-screen flex overflow-hidden bg-[#F5F2FA] font-sans relative">
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

      {/* LEFT SIDE: Robot Hero Cover */}
      <div className="hidden lg:flex w-1/2 h-full relative bg-[#F5F2FA] overflow-hidden items-center justify-center">
        {/* Full-height cover image focused on the head, shifted to the left */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="w-full h-full relative"
        >
          <img
            src="/login-robot.png"
            alt="Seekh AI Agent"
            className="w-[125%] max-w-none h-full object-cover object-top -translate-x-[15%]"
          />
          {/* Subtle overlay gradients for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#F5F2FA]/80 via-transparent to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#F5F2FA]/40 pointer-events-none" />
        </motion.div>
      </div>

      {/* RIGHT SIDE: Auth & OTP Form Section */}
      <div
        data-lenis-prevent
        className="w-full lg:w-1/2 h-full bg-[#F5F2FA] flex flex-col justify-between p-6 sm:p-10 lg:p-12 overflow-y-auto overscroll-contain relative"
      >
        {/* Top Navigation Row */}
        <div className="flex items-center justify-between w-full mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-slate-950 hover:border-slate-300 text-xs font-mono font-semibold transition-all shadow-xs group cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Home</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-purple-900 text-white flex items-center justify-center font-bold text-xs">
              <GraduationCap className="w-3.5 h-3.5" />
            </div>
            <span className="text-slate-950 font-black text-sm tracking-wider font-mono uppercase">SEEKH</span>
          </div>
        </div>

        <div className="max-w-md w-full mx-auto my-auto py-6 space-y-6">
          {/* Header Badge */}
          <motion.div
            key={isSignUp ? "signup-header" : "login-header"}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-2"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 border border-purple-200/60 text-purple-900 text-xs font-mono font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
              <span>{isSignUp ? "256-Bit OTP Protected" : "JWT Token Secured"}</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight">
              {step === 2
                ? "Enter 6-Digit OTP Code"
                : isSignUp
                  ? "Create Seekh Account"
                  : "Welcome back"}
            </h1>
            <p className="text-sm text-slate-600 font-mono">
              {step === 2
                ? `We sent a 6-digit verification code to ${email}`
                : isSignUp
                  ? "Deploy personalized AI learning roadmaps in 2 minutes."
                  : "Sign in to continue your personalized learning journey."}
            </p>
          </motion.div>

          {/* STEP 1: CREDENTIALS FORM */}
          {step === 1 && (
            <form onSubmit={isSignUp ? handleRequestOTP : handleLoginSubmit} className="space-y-4">
              {isSignUp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-mono font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="example"
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-hidden focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 transition-all font-sans"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@university.edu"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-hidden focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-hidden focus:border-purple-600 focus:ring-2 focus:ring-purple-500/20 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-[#1E192B] hover:bg-purple-950 text-white font-semibold text-sm transition-all shadow-lg hover:shadow-purple-900/20 flex items-center justify-center gap-2 cursor-pointer group mt-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <span>{isSignUp ? "Verify Email & Send 6-Digit OTP" : "Sign In to Platform"}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: 6-DIGIT OTP VERIFICATION SCREEN */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-purple-100 border border-purple-200 text-purple-700 flex items-center justify-center mx-auto shadow-sm">
                <KeyRound className="w-7 h-7" />
              </div>

              {/* 6 Auto-Advancing Input Boxes */}
              <div className="flex items-center justify-center gap-2 font-mono">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputRefs.current[idx] = el;
                    }}
                    type="text"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 h-13 text-center text-xl font-extrabold text-purple-950 bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-700 shadow-xs transition-all"
                  />
                ))}
              </div>

              {/* Resend & Edit Email Controls */}
              <div className="flex items-center justify-between text-xs font-mono text-slate-600 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 hover:text-slate-950 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change Email</span>
                </button>

                <div>
                  {canResend ? (
                    <button
                      onClick={handleRequestOTP}
                      className="text-purple-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                      <span>Resend OTP Code</span>
                    </button>
                  ) : (
                    <span>Resend code in {timer}s</span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleVerifyAndSignup}
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-semibold text-sm transition-all shadow-lg hover:shadow-purple-900/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify OTP & Launch Seekh</span>
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* Toggle Footer Mode */}
          {step === 1 && (
            <div className="text-center pt-2">
              <p className="text-xs text-slate-600 font-mono">
                {isSignUp ? (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setIsSignUp(false)}
                      className="text-purple-700 font-semibold hover:underline cursor-pointer"
                    >
                      Sign In
                    </button>
                  </>
                ) : (
                  <>
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setIsSignUp(true)}
                      className="text-purple-700 font-semibold hover:underline cursor-pointer"
                    >
                      Create Student Account
                    </button>
                  </>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Legal Footer */}
        <div className="text-center text-[10px] font-mono text-slate-400 uppercase tracking-widest pt-6">
          © {new Date().getFullYear()} SEEKH AI PLATFORM. ALL RIGHTS RESERVED • SECURED BY HS256 JWT
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Award,
  Calendar,
  User,
  ShieldCheck,
  ArrowLeft,
  Download,
  Share2,
  Loader2,
  GraduationCap
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import confetti from "canvas-confetti";
import { useGetCertificateDetailsQuery } from "@/store/api/learningApi";
import { useCompany } from "@/context/CompanyContext";

export default function CertificatePage() {
  const router = useRouter();
  const params = useParams();
  const certId = params.id as string;
  const { isAuthenticated } = useCompany();

  const { data: certDetails, isLoading, error } = useGetCertificateDetailsQuery(certId, {
    skip: !certId,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Blast confetti on loading success
  useEffect(() => {
    if (certDetails) {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.5 }
      });
    }
  }, [certDetails]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F2FA] flex flex-col justify-center items-center font-sans">
        <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
        <p className="text-sm font-mono text-slate-500">Decrypting digital credential...</p>
      </div>
    );
  }

  if (error || !certDetails) {
    return (
      <div className="min-h-screen bg-[#F5F2FA] flex flex-col justify-center items-center p-6 text-center font-sans">
        <ShieldCheck className="w-12 h-12 text-red-400 mb-4 animate-bounce" />
        <h2 className="text-lg font-bold font-mono text-slate-800">Verification Error</h2>
        <p className="text-xs text-slate-400 font-mono mt-1">
          This credential record does not exist or has been modified.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-6 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-mono text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F0F7] flex flex-col items-center justify-center p-4 md:p-8 font-sans">
      <Toaster position="top-right" />
      
      {/* Top Controls */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-6">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-1.5 px-3.5 py-2 hover:bg-purple-100/50 rounded-xl text-slate-600 font-mono text-xs font-bold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </button>

        <div className="flex gap-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success("Verification URL copied to clipboard!");
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-purple-100 rounded-xl font-mono text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Share2 className="w-4 h-4" /> Share Link
          </button>
        </div>
      </div>

      {/* Main Certificate Design */}
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-4xl bg-white border-[16px] border-double border-purple-900 rounded-[32px] p-6 md:p-16 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[500px]"
      >
        {/* Background watermark icon */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] text-purple-950 pointer-events-none select-none">
          <GraduationCap className="w-[500px] h-[500px]" />
        </div>

        {/* Decorative corner borders */}
        <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-purple-300" />
        <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-purple-300" />
        <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-purple-300" />
        <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-purple-300" />

        {/* Top Header */}
        <div className="text-center space-y-3 relative">
          <div className="flex justify-center mb-2">
            <div className="p-3.5 bg-purple-900 text-purple-100 rounded-full shadow-md">
              <Award className="w-10 h-10" />
            </div>
          </div>
          <h2 className="text-xs font-extrabold tracking-[0.2em] font-mono text-purple-950 uppercase">
            Certificate of Accomplishment
          </h2>
          <div className="h-[1px] w-24 bg-purple-300 mx-auto" />
        </div>

        {/* Body content */}
        <div className="text-center my-10 space-y-6 relative">
          <p className="text-xs italic font-serif text-slate-400">
            This is proudly presented to
          </p>
          
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight font-serif text-purple-950 underline decoration-purple-300 decoration-wavy underline-offset-8">
            {certDetails.student_name}
          </h1>

          <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed font-mono">
            for successfully completing the personalized learning curriculum and proving competency in the domain of
          </p>

          <h3 className="text-lg md:text-2xl font-black font-mono text-slate-800">
            {certDetails.module_name}
          </h3>
        </div>

        {/* Footer credentials and signature */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-purple-50 font-mono relative">
          <div className="space-y-1 text-center md:text-left">
            <span className="text-[10px] text-slate-400 uppercase">Verification Details</span>
            <div className="flex items-center gap-1 justify-center md:justify-start mt-1 text-[11px] text-slate-600 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Cryptographically Verified</span>
            </div>
            <p className="text-[9px] text-slate-400 break-all select-all font-bold">
              ID: {certDetails.id}
            </p>
          </div>

          <div className="text-center md:text-right space-y-1">
            <span className="text-[10px] text-slate-400 uppercase">Date of Issuance</span>
            <div className="flex items-center gap-1.5 justify-center md:justify-end mt-1 text-[11px] text-slate-600 font-semibold">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span>{new Date(certDetails.issued_at).toLocaleDateString(undefined, { dateStyle: "long" })}</span>
            </div>
            <p className="text-[9px] text-purple-400 font-bold">Seekh AI Learning Engine</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

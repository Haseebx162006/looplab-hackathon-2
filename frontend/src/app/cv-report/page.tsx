"use client";

import React, { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Loader2,
  Download,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Briefcase,
  Award,
  ArrowLeft,
  BarChart3,
  ScanSearch,
  Layers,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { HoverSidebar } from "@/components/layout/HoverSidebar";
import { useCompany } from "@/context/CompanyContext";
import { useAnalyzeCvMutation, CvReport } from "@/store/api/learningApi";

// Score color helper
function getScoreColor(score: number) {
  if (score >= 80) return { text: "text-emerald-600", bg: "bg-emerald-100", ring: "stroke-emerald-500" };
  if (score >= 60) return { text: "text-amber-600", bg: "bg-amber-100", ring: "stroke-amber-500" };
  return { text: "text-red-600", bg: "bg-red-100", ring: "stroke-red-500" };
}

// Circular progress SVG
function ScoreRing({ score }: { score: number }) {
  const colors = getScoreColor(score);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (score / 100) * circumference;

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={radius} fill="none"
          className={colors.ring}
          strokeWidth="10"
          strokeDasharray={`${strokeDash} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-black font-mono ${colors.text}`}>{score}</span>
        <span className="text-[10px] text-slate-400 font-mono uppercase">/ 100</span>
      </div>
    </div>
  );
}

// Tag chip
function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${color}`}>
      {label}
    </span>
  );
}

// PDF download using jspdf
async function downloadReportPdf(report: CvReport, cvUrl: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;
  const colW = pageW - margin * 2;
  let y = 22;

  const addLine = (text: string, size = 10, bold = false, color: [number, number, number] = [30, 30, 30]) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text || "—", colW);
    lines.forEach((line: string) => {
      if (y > 272) { doc.addPage(); y = 22; }
      doc.text(line, margin, y);
      y += Math.max(5, size * 0.5);
    });
    y += 1.5;
  };

  const addSection = (title: string) => {
    y += 4;
    if (y > 265) { doc.addPage(); y = 22; }
    doc.setFillColor(245, 240, 255);
    doc.roundedRect(margin - 2, y - 5, colW + 4, 10, 2, 2, "F");
    addLine(title, 11, true, [88, 28, 135]);
    y += 1;
  };

  const addBullets = (items: string[] = [], color: [number, number, number] = [50, 50, 50]) => {
    (items || []).forEach((item) => {
      addLine(`• ${item}`, 10, false, color);
    });
  };

  // Header
  doc.setFillColor(88, 28, 135);
  doc.rect(0, 0, pageW, 18, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("SEEKH AI — CV Analysis Report", margin, 12);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), pageW - margin - 30, 12);
  y = 28;

  // Candidate + Score
  addLine(report.candidate_name || "Candidate", 16, true, [30, 30, 30]);
  addLine(
    `${report.experience_level}${report.target_role ? `  ·  Target: ${report.target_role}` : ""}`,
    10,
    false,
    [100, 100, 100]
  );
  addLine(
    `CV Score: ${report.overall_score} / 100`,
    12,
    true,
    report.overall_score >= 80 ? [5, 150, 105] : report.overall_score >= 60 ? [180, 120, 20] : [220, 38, 38]
  );
  if (report.score_breakdown) {
    const b = report.score_breakdown;
    addLine(
      `Breakdown — Content ${b.content}/25 · Impact ${b.impact}/25 · Structure ${b.structure}/25 · ATS ${b.ats}/25`,
      9,
      false,
      [90, 90, 90]
    );
  }
  y += 2;

  // Summary
  addSection("Professional Summary");
  addLine(report.summary);

  // Skills
  addSection("Skills Identified");
  addLine((report.skills_found || []).join(" · ") || "—", 10, false, [88, 28, 135]);

  // Strengths
  addSection("Strengths");
  addBullets(report.strengths, [5, 120, 80]);

  // Weaknesses
  addSection("Areas for Improvement");
  addBullets(report.weaknesses, [180, 80, 20]);

  // Recommendations
  addSection("Recommendations");
  addBullets(report.recommendations, [30, 30, 30]);

  // Suitable Roles
  addSection("Suitable Roles");
  addLine((report.suitable_roles || []).join(" · ") || "—", 10, false, [30, 90, 180]);

  if (report.missing_sections && report.missing_sections.length > 0) {
    addSection("Missing Sections");
    addBullets(report.missing_sections, [180, 80, 20]);
  }

  if (report.ats_tips && report.ats_tips.length > 0) {
    addSection("ATS Tips");
    addBullets(report.ats_tips, [30, 30, 30]);
  }

  // Footer
  const pages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated by SEEKH AI · Page ${i} of ${pages}`, margin, 290);
  }

  doc.save(`CV_Report_${(report.candidate_name || "candidate").replace(/\s+/g, "_")}.pdf`);
}

export default function CvReportPage() {
  const router = useRouter();
  const { isAuthenticated } = useCompany();
  const [analyzeCv, { isLoading }] = useAnalyzeCvMutation();
  const [report, setReport] = useState<CvReport | null>(null);
  const [cvUrl, setCvUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handleAnalyze = async () => {
    setError(null);
    setReport(null);
    try {
      const result = await analyzeCv().unwrap();
      setReport(result.report);
      setCvUrl(result.cv_url);
      toast.success("CV analyzed successfully!");
    } catch (err: any) {
      const msg = err?.data?.error || err?.data?.detail || err?.message || "CV analysis failed.";
      setError(msg);
      toast.error(msg);
    }
  };

  const handleDownload = async () => {
    if (!report) return;
    setIsDownloading(true);
    try {
      await downloadReportPdf(report, cvUrl);
      toast.success("PDF downloaded!");
    } catch (e: any) {
      toast.error("PDF generation failed: " + e.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const scoreColors = report ? getScoreColor(report.overall_score) : null;

  return (
    <div className="min-h-screen bg-[#F5F2FA] flex font-sans">
      <HoverSidebar />
      <Toaster position="top-right" />

      <main className="flex-1 ml-20 p-6 md:p-10 max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/settings")}
            className="flex items-center gap-1.5 text-xs font-mono text-slate-500 hover:text-purple-600 transition-colors mb-4 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Settings
          </button>
          <span className="px-2.5 py-1 bg-purple-100 text-purple-700 text-[10px] font-extrabold font-mono rounded-full border border-purple-200 uppercase">
            AI POWERED
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-mono text-slate-900 mt-3">
            CV Analysis
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-1">
            AI will analyze your uploaded CV and generate a detailed professional report.
          </p>
        </div>

        {/* Analyze Button Card */}
        {!report && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-purple-100 rounded-3xl p-8 text-center mb-6"
          >
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-base font-bold font-mono text-slate-800 mb-2">
              Ready to analyze your CV?
            </h2>
            <p className="text-xs font-mono text-slate-400 mb-6 max-w-sm mx-auto">
              Make sure you have uploaded your CV in Account Settings. The AI will extract skills,
              identify strengths and weaknesses, and suggest improvements.
            </p>

            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 mb-5 text-left">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs font-mono text-red-700">{error}</p>
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={isLoading}
              className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-mono text-sm font-bold transition-all shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing CV...
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4" />
                  Analyze My CV
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* Report */}
        <AnimatePresence>
          {report && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              ref={reportRef}
              className="space-y-5"
            >
              {/* Top bar: Re-analyze + Download */}
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => { setReport(null); setError(null); }}
                  className="text-xs font-mono text-slate-500 hover:text-purple-600 transition-colors cursor-pointer"
                >
                  ← Re-analyze
                </button>
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-mono text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {isDownloading ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating PDF...</>
                  ) : (
                    <><Download className="w-3.5 h-3.5" /> Download PDF</>
                  )}
                </button>
              </div>

              {/* Score Card */}
              <div className="bg-white border border-purple-100 rounded-3xl p-6 text-center">
                <ScoreRing score={report.overall_score} />
                <h2 className="text-lg font-black font-mono text-slate-800 mt-3">
                  {report.candidate_name || "Candidate"}
                </h2>
                <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold font-mono border ${scoreColors?.bg} ${scoreColors?.text} border-current`}>
                    {report.experience_level}
                  </span>
                  {report.target_role && (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold font-mono border bg-indigo-50 text-indigo-700 border-indigo-200">
                      {report.target_role}
                    </span>
                  )}
                </div>
                <p className="text-xs font-mono text-slate-600 mt-4 max-w-xl mx-auto leading-relaxed">
                  {report.summary}
                </p>
                {report.score_breakdown && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 text-left">
                    {([
                      ["Content", report.score_breakdown.content],
                      ["Impact", report.score_breakdown.impact],
                      ["Structure", report.score_breakdown.structure],
                      ["ATS", report.score_breakdown.ats],
                    ] as [string, number][]).map(([label, value]) => (
                      <div key={label} className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                        <p className="text-[10px] font-mono uppercase text-slate-400">{label}</p>
                        <p className="text-sm font-black font-mono text-slate-800 mt-1">{value}<span className="text-slate-400">/25</span></p>
                        <div className="h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                          <div
                            className="h-full bg-purple-500 rounded-full"
                            style={{ width: `${Math.min(100, (value / 25) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Skills */}
              <div className="bg-white border border-purple-100 rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-4 h-4 text-purple-600" />
                  <h3 className="text-sm font-bold font-mono text-slate-800">Skills Identified</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {report.skills_found.map((s) => (
                    <Chip key={s} label={s} color="bg-purple-50 text-purple-700 border-purple-200" />
                  ))}
                  {report.skills_found.length === 0 && (
                    <p className="text-xs font-mono text-slate-400">No skills were clearly listed on the CV.</p>
                  )}
                </div>
              </div>

              {/* Strengths + Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-white border border-emerald-100 rounded-3xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold font-mono text-slate-800">Strengths</h3>
                  </div>
                  <ul className="space-y-2">
                    {report.strengths.map((s) => (
                      <li key={s} className="flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-xs font-mono text-slate-600">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white border border-amber-100 rounded-3xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingDown className="w-4 h-4 text-amber-600" />
                    <h3 className="text-sm font-bold font-mono text-slate-800">Areas to Improve</h3>
                  </div>
                  <ul className="space-y-2">
                    {report.weaknesses.map((w) => (
                      <li key={w} className="flex items-start gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span className="text-xs font-mono text-slate-600">{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-white border border-blue-100 rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold font-mono text-slate-800">Recommendations</h3>
                </div>
                <ul className="space-y-2">
                  {report.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black font-mono flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-xs font-mono text-slate-600">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Suitable Roles */}
              <div className="bg-white border border-purple-100 rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase className="w-4 h-4 text-purple-600" />
                  <h3 className="text-sm font-bold font-mono text-slate-800">Suitable Roles</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {report.suitable_roles.map((role) => (
                    <Chip key={role} label={role} color="bg-indigo-50 text-indigo-700 border-indigo-200" />
                  ))}
                </div>
              </div>

              {report.missing_sections && report.missing_sections.length > 0 && (
                <div className="bg-white border border-amber-100 rounded-3xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Layers className="w-4 h-4 text-amber-600" />
                    <h3 className="text-sm font-bold font-mono text-slate-800">Missing Sections</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {report.missing_sections.map((section) => (
                      <Chip key={section} label={section} color="bg-amber-50 text-amber-800 border-amber-200" />
                    ))}
                  </div>
                </div>
              )}

              {report.ats_tips && report.ats_tips.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <ScanSearch className="w-4 h-4 text-slate-700" />
                    <h3 className="text-sm font-bold font-mono text-slate-800">ATS Tips</h3>
                  </div>
                  <ul className="space-y-2">
                    {report.ats_tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black font-mono flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-xs font-mono text-slate-600">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Bottom Download */}
              <div className="pb-8">
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-mono text-sm font-bold transition-all shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {isDownloading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Generating PDF...</>
                  ) : (
                    <><Download className="w-4 h-4" /> Download Full Report as PDF</>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

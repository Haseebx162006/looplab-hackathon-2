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
  doc.setCharSpace(0); // Force standard character spacing to prevent letter-separation bugs

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;
  const colW = pageW - margin * 2;
  let y = 26;

  // Sanitizes text to remove high Unicode characters that break standard font metrics
  const cleanText = (str: string): string => {
    if (!str) return "";
    return str
      .replace(/[\u2018\u2019]/g, "'")   // Smart single quotes
      .replace(/[\u201C\u201D]/g, '"')   // Smart double quotes
      .replace(/[\u2013\u2014]/g, "-")   // En/Em dashes
      .replace(/\u2022/g, "-")           // Bullet points
      .replace(/\u00B7/g, "-")           // Middle dot
      .replace(/[^\x00-\xFF]/g, "");     // Strip characters outside Latin-1
  };

  const cleanArray = (arr: string[]): string[] => {
    return (arr || []).map(item => cleanText(item));
  };

  // Clean data inputs
  const candidateName = cleanText(report.candidate_name || "Candidate");
  const expLevel = cleanText(report.experience_level);
  const targetRole = cleanText(report.target_role || "");
  const summary = cleanText(report.summary);
  const skillsFound = cleanArray(report.skills_found);
  const strengths = cleanArray(report.strengths);
  const weaknesses = cleanArray(report.weaknesses);
  const recommendations = cleanArray(report.recommendations);
  const suitableRoles = cleanArray(report.suitable_roles);
  const missingSections = cleanArray(report.missing_sections || []);
  const atsTips = cleanArray(report.ats_tips || []);

  // Reusable helper to add paragraphs with auto page wrapping and indentation support
  const addParagraph = (
    text: string,
    size = 9.5,
    bold = false,
    color: [number, number, number] = [60, 60, 60],
    width = colW,
    startX = margin
  ) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text || "—", width);
    lines.forEach((line: string) => {
      if (y > 270) {
        doc.addPage();
        y = 26;
      }
      doc.text(line, startX, y);
      y += (size * 0.45); // line spacing
    });
    y += 2; // bottom margin
  };

  // Reusable section header builder
  const addSectionHeader = (title: string, barColor: [number, number, number] = [88, 28, 135]) => {
    y += 4;
    if (y > 260) {
      doc.addPage();
      y = 26;
    }

    // Draw a small vertical colored indicator bar
    doc.setFillColor(...barColor);
    doc.rect(margin, y - 4, 3, 5.5, "F");

    // Title text
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(title, margin + 5, y);

    // Separator line
    doc.setDrawColor(235, 230, 245);
    doc.setLineWidth(0.3);
    doc.line(margin, y + 2, margin + colW, y + 2);

    y += 7;
  };

  // Reusable styled bullet points builder
  const addBulletPoints = (
    items: string[] = [],
    textColor: [number, number, number] = [70, 70, 70],
    bulletColor: [number, number, number] = [88, 28, 135]
  ) => {
    (items || []).forEach((item) => {
      if (y > 270) {
        doc.addPage();
        y = 26;
      }
      // Bullet dot
      doc.setFillColor(...bulletColor);
      doc.circle(margin + 2, y - 1, 0.8, "F");

      // Indented text
      addParagraph(item, 9, false, textColor, colW - 6, margin + 5);
    });
    y += 1;
  };

  // Reusable tag list
  const addTagsList = (tags: string[], tagColor: [number, number, number] = [88, 28, 135]) => {
    if (!tags || tags.length === 0) {
      addParagraph("None identified.", 9, false, [120, 120, 120]);
      return;
    }
    const joined = tags.join("   |   "); // Use standard ASCII vertical bar "|" instead of bullet "•"
    addParagraph(joined, 9.5, false, tagColor);
  };

  // --- 1. Candidate Info Card Dashboard ---
  const cardH = 62;
  doc.setFillColor(250, 248, 254);
  doc.setDrawColor(233, 224, 248);
  doc.roundedRect(margin, y, colW, cardH, 4, 4, "FD");

  // Candidate Name
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(candidateName, margin + 6, y + 10);

  // Target role & experience
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  const roleText = `${expLevel}${targetRole ? `  |  Target: ${targetRole}` : ""}`;
  doc.text(roleText, margin + 6, y + 15);

  // Short candidate summary inside card
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  const summaryW = colW - 54;
  const summaryLines = doc.splitTextToSize(summary, summaryW);
  let summaryY = y + 21;
  summaryLines.slice(0, 5).forEach((line: string) => {
    doc.text(line, margin + 6, summaryY);
    summaryY += 4;
  });

  // Circular overall score visualization
  const scoreX = margin + colW - 22;
  const scoreY = y + 18;

  // Outer circle
  doc.setFillColor(243, 232, 255);
  doc.circle(scoreX, scoreY, 13, "F");

  // Inner circle
  doc.setFillColor(88, 28, 135);
  doc.circle(scoreX, scoreY, 11, "F");

  // Score value
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  const scoreStr = String(report.overall_score);
  const textWidth = doc.getTextWidth(scoreStr);
  doc.text(scoreStr, scoreX - (textWidth / 2), scoreY + 2);

  // Score label
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(88, 28, 135);
  const labelWidth = doc.getTextWidth("OVERALL SCORE");
  doc.text("OVERALL SCORE", scoreX - (labelWidth / 2), scoreY + 18);

  // Score breakdown progress bars
  if (report.score_breakdown) {
    const b = report.score_breakdown;
    const breakdownItems = [
      { label: "CONTENT", val: b.content },
      { label: "IMPACT", val: b.impact },
      { label: "STRUCTURE", val: b.structure },
      { label: "ATS FIT", val: b.ats }
    ];

    const blockW = colW / 4;
    breakdownItems.forEach((item, idx) => {
      const startX = margin + idx * blockW + 6;
      const startY = y + 49;

      // label
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(120, 120, 120);
      doc.text(item.label, startX, startY);

      // value
      doc.setFontSize(8.5);
      doc.setTextColor(50, 50, 50);
      doc.text(`${item.val}/25`, startX, startY + 4);

      // progress track
      const barW = blockW - 12;
      const barY = startY + 6;
      doc.setFillColor(230, 232, 240);
      doc.rect(startX, barY, barW, 2, "F");

      // progress fill
      if (item.val > 0) {
        doc.setFillColor(139, 92, 246);
        const fillW = (Math.min(25, item.val) / 25) * barW;
        doc.rect(startX, barY, fillW, 2, "F");
      }
    });
  }

  y += cardH + 8;

  // --- 2. Sections ---
  // Skills Identified
  addSectionHeader("Skills Identified", [88, 28, 135]);
  addTagsList(skillsFound, [88, 28, 135]);

  // Strengths
  addSectionHeader("Key Strengths", [16, 185, 129]);
  addBulletPoints(strengths, [70, 70, 70], [16, 185, 129]);

  // Areas to Improve
  addSectionHeader("Areas for Improvement", [245, 158, 11]);
  addBulletPoints(weaknesses, [70, 70, 70], [245, 158, 11]);

  // Recommendations
  addSectionHeader("Actionable Recommendations", [59, 130, 246]);
  addBulletPoints(recommendations, [70, 70, 70], [59, 130, 246]);

  // Suitable Roles
  addSectionHeader("Suitable Roles", [79, 70, 229]);
  addTagsList(suitableRoles, [79, 70, 229]);

  // Missing Sections
  if (missingSections && missingSections.length > 0) {
    addSectionHeader("Missing CV Sections", [239, 68, 68]);
    addTagsList(missingSections, [239, 68, 68]);
  }

  // ATS Tips
  if (atsTips && atsTips.length > 0) {
    addSectionHeader("ATS Strategy Tips", [71, 85, 105]);
    addBulletPoints(atsTips, [70, 70, 70], [71, 85, 105]);
  }

  // --- 3. Dynamic Header & Footer Pass ---
  const pages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);

    // Deep purple top banner
    doc.setFillColor(88, 28, 135);
    doc.rect(0, 0, pageW, 16, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("SEEKH AI  |  CV ANALYSIS REPORT", margin, 10.5);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const dateW = doc.getTextWidth(dateStr);
    doc.text(dateStr, pageW - margin - dateW, 10.5);

    // Light divider line above footer
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, 284, pageW - margin, 284);

    // Footer text
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated by SEEKH AI`, margin, 289);

    const pageStr = `Page ${i} of ${pages}`;
    const pageWStr = doc.getTextWidth(pageStr);
    doc.text(pageStr, pageW - margin - pageWStr, 289);
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

      <main className="flex-1 ml-0 md:ml-20 p-6 md:p-10 pt-20 md:pt-10 max-w-3xl mx-auto">
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

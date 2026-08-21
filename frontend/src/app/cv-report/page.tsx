"use client";

import React, { useState, useRef, useEffect } from "react";
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
  UploadCloud,
  Trash2,
  Calendar,
  Sparkles,
  ChevronRight,
  HelpCircle,
  FileCheck
} from "lucide-react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip
} from "recharts";
import toast, { Toaster } from "react-hot-toast";
import { HoverSidebar } from "@/components/layout/HoverSidebar";
import { useCompany } from "@/context/CompanyContext";
import { useAnalyzeCvMutation, useUploadCvMutation, CvReport } from "@/store/api/learningApi";

interface SavedCvReport {
  id: string;
  fileName: string;
  uploadedAt: string;
  report: CvReport;
  cvUrl: string;
}

// Score color helper
function getScoreColor(score: number) {
  if (score >= 80) return { text: "text-emerald-600", bg: "bg-emerald-100", ring: "stroke-emerald-500" };
  if (score >= 60) return { text: "text-amber-600", bg: "bg-amber-100", ring: "stroke-amber-500" };
  return { text: "text-red-600", bg: "bg-red-100", ring: "stroke-red-500" };
}

// Circular progress SVG
function ScoreRing({ score }: { score: number }) {
  const colors = getScoreColor(score);
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (score / 100) * circumference;

  return (
    <div className="relative w-28 h-28 mx-auto shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r={radius} fill="none" stroke="#F5F2FA" strokeWidth="8" />
        <circle
          cx="55"
          cy="55"
          r={radius}
          fill="none"
          className={colors.ring}
          strokeWidth="8"
          strokeDasharray={`${strokeDash} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-black font-mono ${colors.text}`}>{score}</span>
        <span className="text-[8px] text-slate-400 font-mono uppercase">/ 100</span>
      </div>
    </div>
  );
}

// Tag chip
function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold border ${color}`}>
      {label}
    </span>
  );
}

// PDF download using jspdf
async function downloadReportPdf(report: CvReport, cvUrl: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  doc.setCharSpace(0);

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;
  const colW = pageW - margin * 2;
  let y = 26;

  const cleanText = (str: string): string => {
    if (!str) return "";
    return str
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, "-")
      .replace(/\u2022/g, "-")
      .replace(/\u00B7/g, "-")
      .replace(/[^\x00-\xFF]/g, "");
  };

  const cleanArray = (arr: string[]): string[] => {
    return (arr || []).map(item => cleanText(item));
  };

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
      y += (size * 0.45);
    });
    y += 2;
  };

  const addSectionHeader = (title: string, barColor: [number, number, number] = [88, 28, 135]) => {
    y += 4;
    if (y > 260) {
      doc.addPage();
      y = 26;
    }

    doc.setFillColor(...barColor);
    doc.rect(margin, y - 4, 3, 5.5, "F");

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(title, margin + 5, y);

    doc.setDrawColor(235, 230, 245);
    doc.setLineWidth(0.3);
    doc.line(margin, y + 2, margin + colW, y + 2);

    y += 7;
  };

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
      doc.setFillColor(...bulletColor);
      doc.circle(margin + 2, y - 1, 0.8, "F");

      addParagraph(item, 9, false, textColor, colW - 6, margin + 5);
    });
    y += 1;
  };

  const addTagsList = (tags: string[], tagColor: [number, number, number] = [88, 28, 135]) => {
    if (!tags || tags.length === 0) {
      addParagraph("None identified.", 9, false, [120, 120, 120]);
      return;
    }
    const joined = tags.join("   |   ");
    addParagraph(joined, 9.5, false, tagColor);
  };

  const cardH = 62;
  doc.setFillColor(250, 248, 254);
  doc.setDrawColor(233, 224, 248);
  doc.roundedRect(margin, y, colW, cardH, 4, 4, "FD");

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(candidateName, margin + 6, y + 10);

  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  const roleText = `${expLevel}${targetRole ? `  |  Target: ${targetRole}` : ""}`;
  doc.text(roleText, margin + 6, y + 15);

  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  const summaryW = colW - 54;
  const summaryLines = doc.splitTextToSize(summary, summaryW);
  let summaryY = y + 21;
  summaryLines.slice(0, 5).forEach((line: string) => {
    doc.text(line, margin + 6, summaryY);
    summaryY += 4;
  });

  const scoreX = margin + colW - 22;
  const scoreY = y + 18;

  doc.setFillColor(243, 232, 255);
  doc.circle(scoreX, scoreY, 13, "F");

  doc.setFillColor(88, 28, 135);
  doc.circle(scoreX, scoreY, 11, "F");

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  const scoreStr = String(report.overall_score);
  const textWidth = doc.getTextWidth(scoreStr);
  doc.text(scoreStr, scoreX - (textWidth / 2), scoreY + 2);

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(88, 28, 135);
  const labelWidth = doc.getTextWidth("OVERALL SCORE");
  doc.text("OVERALL SCORE", scoreX - (labelWidth / 2), scoreY + 18);

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

      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(120, 120, 120);
      doc.text(item.label, startX, startY);

      doc.setFontSize(8.5);
      doc.setTextColor(50, 50, 50);
      doc.text(`${item.val}/25`, startX, startY + 4);

      const barW = blockW - 12;
      const barY = startY + 6;
      doc.setFillColor(230, 232, 240);
      doc.rect(startX, barY, barW, 2, "F");

      if (item.val > 0) {
        doc.setFillColor(139, 92, 246);
        const fillW = (Math.min(25, item.val) / 25) * barW;
        doc.rect(startX, barY, fillW, 2, "F");
      }
    });
  }

  y += cardH + 8;

  addSectionHeader("Skills Identified", [88, 28, 135]);
  addTagsList(skillsFound, [88, 28, 135]);

  addSectionHeader("Key Strengths", [16, 185, 129]);
  addBulletPoints(strengths, [70, 70, 70], [16, 185, 129]);

  addSectionHeader("Areas for Improvement", [245, 158, 11]);
  addBulletPoints(weaknesses, [70, 70, 70], [245, 158, 11]);

  addSectionHeader("Actionable Recommendations", [59, 130, 246]);
  addBulletPoints(recommendations, [70, 70, 70], [59, 130, 246]);

  addSectionHeader("Suitable Roles", [79, 70, 229]);
  addTagsList(suitableRoles, [79, 70, 229]);

  if (missingSections && missingSections.length > 0) {
    addSectionHeader("Missing CV Sections", [239, 68, 68]);
    addTagsList(missingSections, [239, 68, 68]);
  }

  if (atsTips && atsTips.length > 0) {
    addSectionHeader("ATS Strategy Tips", [71, 85, 105]);
    addBulletPoints(atsTips, [70, 70, 70], [71, 85, 105]);
  }

  const pages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);

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

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, 284, pageW - margin, 284);

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated by SEEKH AI`, margin, 289);

    const pageStr = `Page ${i} of ${pages}`;
    const pageWStr = doc.getTextWidth(pageStr);
    doc.text(pageStr, pageW - margin - pageWStr, 289);
  }

  doc.save(`CV_Report_${(report.candidate_name || "candidate").replace(/\s+/g, "_")}.pdf`);
}

// Helper to convert File object to Base64
function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

export default function CvReportPage() {
  const router = useRouter();
  const { isAuthenticated } = useCompany();
  const [analyzeCv, { isLoading: isAnalyzing }] = useAnalyzeCvMutation();
  const [uploadCv, { isLoading: isUploading }] = useUploadCvMutation();

  const [report, setReport] = useState<CvReport | null>(null);
  const [cvUrl, setCvUrl] = useState<string>("");
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  
  const [history, setHistory] = useState<SavedCvReport[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem("seekh_cv_reports");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHistory(parsed);
        // Auto select first report if available
        if (parsed.length > 0) {
          setReport(parsed[0].report);
          setCvUrl(parsed[0].cvUrl);
          setSelectedReportId(parsed[0].id);
        }
      } catch (e) {
        console.error("Error loading CV reports from history:", e);
      }
    }
  }, []);

  const saveToHistory = (newReport: CvReport, url: string, fileName: string) => {
    const item: SavedCvReport = {
      id: crypto.randomUUID(),
      fileName,
      uploadedAt: new Date().toLocaleString(),
      report: newReport,
      cvUrl: url
    };
    const updated = [item, ...history];
    setHistory(updated);
    localStorage.setItem("seekh_cv_reports", JSON.stringify(updated));
    setReport(newReport);
    setCvUrl(url);
    setSelectedReportId(item.id);
  };

  const deleteReport = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter((item) => item.id !== id);
    setHistory(updated);
    localStorage.setItem("seekh_cv_reports", JSON.stringify(updated));
    if (selectedReportId === id) {
      if (updated.length > 0) {
        setReport(updated[0].report);
        setCvUrl(updated[0].cvUrl);
        setSelectedReportId(updated[0].id);
      } else {
        setReport(null);
        setCvUrl("");
        setSelectedReportId(null);
      }
    }
    toast.success("Analysis report deleted from history.");
  };

  // Handle file upload and analysis trigger
  const handleFileUpload = async (file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are supported for CV analysis.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("CV file size must be less than 10MB.");
      return;
    }

    try {
      const base64Data = await readFileAsBase64(file);
      
      // 1. Upload CV to update profile
      toast.loading("Uploading CV...", { id: "cv-flow" });
      const uploadRes = await uploadCv({ file: base64Data, fileName: file.name }).unwrap();
      
      // 2. Trigger CV analysis route
      toast.loading("Analyzing skills & ATS score...", { id: "cv-flow" });
      const analysisRes = await analyzeCv().unwrap();
      
      // 3. Save to history local state & storage
      saveToHistory(analysisRes.report, uploadRes.cv_url, file.name);
      
      toast.success("CV uploaded & analyzed successfully!", { id: "cv-flow" });
    } catch (error: any) {
      const msg = error?.data?.error || error?.message || "CV analysis failed.";
      toast.error(msg, { id: "cv-flow" });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
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

  const selectPastReport = (item: SavedCvReport) => {
    setReport(item.report);
    setCvUrl(item.cvUrl);
    setSelectedReportId(item.id);
  };

  const scoreColors = report ? getScoreColor(report.overall_score) : null;

  // Radar data mapping for score dimensions
  const radarData = report?.score_breakdown
    ? [
        { subject: "Content Relevance", value: report.score_breakdown.content, fullMark: 25 },
        { subject: "Quantified Impact", value: report.score_breakdown.impact, fullMark: 25 },
        { subject: "Resume Structure", value: report.score_breakdown.structure, fullMark: 25 },
        { subject: "ATS Formatting", value: report.score_breakdown.ats, fullMark: 25 }
      ]
    : [];

  return (
    <div data-lenis-prevent className="min-h-screen bg-[#F5F2FA] flex font-sans">
      <HoverSidebar />
      <Toaster position="top-right" />

      {/* Full width container */}
      <main className="flex-1 ml-0 md:ml-20 p-6 md:p-10 pt-20 md:pt-10 w-full overflow-x-hidden pb-32">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-[#D8CBEB]/30 mb-8">
          <div>
            <span className="px-2.5 py-1 bg-[#F5F2FA] text-[#7C3AED] text-[10px] font-extrabold font-mono rounded-full border border-[#D8CBEB] uppercase tracking-wider">
              AI CV Intelligence & Parser
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-mono text-slate-900 mt-3">
              CV Analysis Dashboard
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-1">
              Upload your resume in PDF format to run ATS scanner diagnostics, skills extraction, and scoring maps.
            </p>
          </div>

          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1.5 px-4 py-2 border border-[#D8CBEB] hover:bg-purple-50 text-slate-700 rounded-xl font-mono text-xs font-semibold transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" /> Return to Dashboard
          </button>
        </div>

        {/* Split screen layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Upload center & Submission history logs */}
          <div className="space-y-6">
            
            {/* Interactive Drag & Drop Upload Zone */}
            <div className="bg-white border border-[#D8CBEB]/30 rounded-3xl p-6 shadow-xs font-mono">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                Upload Engine
              </span>

              <form
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 flex flex-col justify-center items-center gap-3 ${
                  dragActive
                    ? "border-[#7C3AED] bg-purple-50/30"
                    : "border-[#D8CBEB]/50 hover:border-purple-200"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="application/pdf"
                  className="hidden"
                />

                {isUploading || isAnalyzing ? (
                  <div className="space-y-2">
                    <Loader2 className="w-10 h-10 text-[#7C3AED] animate-spin mx-auto" />
                    <p className="text-xs font-bold text-slate-700">Processing Document...</p>
                    <p className="text-[10px] text-slate-405 leading-relaxed">Uploading to storage, extracting text layouts, and scoring ATS compatibility...</p>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-[#7C3AED] group-hover:scale-105 transition-transform">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">Drag & Drop Resume PDF</p>
                      <p className="text-[10px] text-slate-400 mt-1">or click to browse local files</p>
                    </div>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-505 text-[8px] font-bold rounded border uppercase tracking-wider">
                      PDF ONLY &middot; MAX 10MB
                    </span>
                  </>
                )}
              </form>
            </div>

            {/* Historical list of analyzed CVs */}
            <div className="bg-white border border-[#D8CBEB]/30 rounded-3xl p-6 shadow-xs font-mono">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                  Analysis History
                </span>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[8px] font-bold rounded-full">
                  {history.length} Reports
                </span>
              </div>

              {history.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-100 rounded-2xl">
                  <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    No analyzed CVs in your browser history. Upload a PDF file to run the AI score parser!
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                  {history.map((item) => {
                    const isSelected = selectedReportId === item.id;
                    const ringColor = getScoreColor(item.report.overall_score).text;

                    return (
                      <div
                        key={item.id}
                        onClick={() => selectPastReport(item)}
                        className={`p-4 border rounded-2xl cursor-pointer transition-all duration-300 flex items-center justify-between gap-4 ${
                          isSelected
                            ? "border-[#7C3AED] bg-purple-50/5 shadow-xs ring-1 ring-[#7C3AED]/20"
                            : "border-[#D8CBEB]/20 bg-white hover:border-purple-200"
                        }`}
                      >
                        <div className="space-y-1 overflow-hidden">
                          <h4 className="text-xs font-bold text-slate-800 truncate pr-2">
                            {item.report.candidate_name || "Candidate Profile"}
                          </h4>
                          <p className="text-[9px] text-slate-400 font-mono truncate">
                            {item.fileName}
                          </p>
                          <div className="flex items-center gap-1.5 text-[8px] text-slate-400 mt-1 pt-1 border-t border-slate-50">
                            <Calendar className="w-3 h-3 text-slate-350" />
                            <span>{item.uploadedAt}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-center font-mono">
                            <div className={`text-sm font-black ${ringColor}`}>
                              {item.report.overall_score}
                            </div>
                            <div className="text-[7px] text-slate-400 font-bold uppercase">SCORE</div>
                          </div>

                          <button
                            onClick={(e) => deleteReport(item.id, e)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-550 rounded-lg border border-red-100 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Right 2 Columns: Selected report visual details console */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {report ? (
                <motion.div
                  key={selectedReportId || "report"}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  
                  {/* Top quick actions row */}
                  <div className="flex justify-between items-center bg-white border border-[#D8CBEB]/30 rounded-3xl px-6 py-4 shadow-xs font-mono">
                    <span className="text-xs text-slate-500 font-bold">
                      Parser score sheet loaded
                    </span>

                    <button
                      onClick={handleDownload}
                      disabled={isDownloading}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#7C3AED] hover:bg-purple-700 text-white rounded-xl font-mono text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-60"
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" /> Download PDF Report
                        </>
                      )}
                    </button>
                  </div>

                  {/* Core overall score & Radar chart dashboard block */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#FFFFFF] border border-[#D8CBEB]/30 rounded-3xl p-6 shadow-xs font-mono">
                    
                    {/* Score Ring Summary Column */}
                    <div className="flex flex-col justify-between items-center text-center py-2 border-r border-[#D8CBEB]/15 pr-6">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                          ATS Scanner Grade
                        </span>
                        <h3 className="text-sm font-bold text-[#1E192B] mt-1.5">
                          {report.candidate_name || "Candidate"}
                        </h3>
                        <p className="text-[9px] text-[#7C3AED] font-bold mt-0.5">
                          {report.target_role || "Target Role Unspecified"}
                        </p>
                      </div>

                      {/* circular SVG score dial */}
                      <ScoreRing score={report.overall_score} />

                      <div className="flex flex-wrap items-center justify-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border ${scoreColors?.bg} ${scoreColors?.text} border-current`}>
                          {report.experience_level}
                        </span>
                      </div>
                    </div>

                    {/* Radar Chart mapping score criteria */}
                    <div className="md:col-span-2 flex flex-col justify-between h-[230px]">
                      <div className="flex justify-between items-center mb-1">
                        <div>
                          <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider">Scoring Breakdown</span>
                          <p className="text-[10px] text-slate-400">Score performance metrics (max 25 per section)</p>
                        </div>
                      </div>
                      <div className="flex-1 w-full min-h-[170px] min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                            <PolarGrid stroke="#F1F5F9" />
                            <PolarAngleAxis dataKey="subject" stroke="#64748B" fontSize={8} fontStyle="monospace" />
                            <PolarRadiusAxis angle={30} domain={[0, 25]} tickCount={4} stroke="#94A3B8" fontSize={8} fontStyle="monospace" />
                            <Radar
                              name="ATS Points"
                              dataKey="value"
                              stroke="#7C3AED"
                              fill="#7C3AED"
                              fillOpacity={0.15}
                              strokeWidth={2}
                            />
                            <Tooltip
                              contentStyle={{
                                background: "#1E192B",
                                borderColor: "rgba(216,203,235,0.2)",
                                borderRadius: "12px",
                                fontSize: "10px",
                                color: "#FFF",
                                fontFamily: "monospace",
                              }}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Summary paragraph box */}
                  <div className="bg-white border border-[#D8CBEB]/30 rounded-3xl p-6 shadow-xs font-mono">
                    <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block mb-2">
                      Professional Fit Summary
                    </span>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {report.summary}
                    </p>
                  </div>

                  {/* Strengths + Weaknesses Split */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Strengths card */}
                    <div className="bg-white border border-emerald-100 rounded-3xl p-6 shadow-xs font-mono">
                      <div className="flex items-center gap-2 mb-4 border-b border-emerald-50 pb-3">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Identified Strengths</h3>
                      </div>
                      <ul className="space-y-3">
                        {report.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
                            <span className="text-[11px] text-slate-600 leading-relaxed">{s}</span>
                          </li>
                        ))}
                        {report.strengths.length === 0 && (
                          <p className="text-[10px] text-slate-405">No major strengths found.</p>
                        )}
                      </ul>
                    </div>

                    {/* Weaknesses card */}
                    <div className="bg-white border border-amber-100 rounded-3xl p-6 shadow-xs font-mono">
                      <div className="flex items-center gap-2 mb-4 border-b border-amber-50 pb-3">
                        <AlertCircle className="w-4 h-4 text-amber-555 shrink-0" />
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Areas for Improvement</h3>
                      </div>
                      <ul className="space-y-3">
                        {report.weaknesses.map((w, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-2" />
                            <span className="text-[11px] text-slate-600 leading-relaxed">{w}</span>
                          </li>
                        ))}
                        {report.weaknesses.length === 0 && (
                          <p className="text-[10px] text-slate-405">No major gaps identified.</p>
                        )}
                      </ul>
                    </div>

                  </div>

                  {/* Recommendations Actionable Timeline list */}
                  <div className="bg-white border border-[#D8CBEB]/30 rounded-3xl p-6 shadow-xs font-mono">
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                      <Lightbulb className="w-4 h-4 text-blue-500 shrink-0" />
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Actionable Recommendations</h3>
                    </div>
                    <div className="relative pl-6 border-l border-[#D8CBEB]/30 space-y-5">
                      {report.recommendations.map((rec, i) => (
                        <div key={i} className="relative group">
                          {/* Timeline node */}
                          <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border border-blue-500 bg-blue-50 flex items-center justify-center text-[9px] font-black text-blue-600">
                            {i + 1}
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed pl-2">
                            {rec}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Skills extracted */}
                  <div className="bg-white border border-[#D8CBEB]/30 rounded-3xl p-6 shadow-xs font-mono">
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                      <Award className="w-4 h-4 text-purple-600" />
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Skills Identified</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {report.skills_found.map((s) => (
                        <Chip key={s} label={s} color="bg-purple-50 text-[#7C3AED] border-purple-200/50" />
                      ))}
                      {report.skills_found.length === 0 && (
                        <p className="text-[10px] text-slate-405">No skills identified.</p>
                      )}
                    </div>
                  </div>

                  {/* Suitable Career Roles */}
                  <div className="bg-white border border-[#D8CBEB]/30 rounded-3xl p-6 shadow-xs font-mono">
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                      <Briefcase className="w-4 h-4 text-indigo-500" />
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Suitable Job Titles</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {report.suitable_roles.map((role) => (
                        <Chip key={role} label={role} color="bg-indigo-50 text-indigo-700 border-indigo-200/50" />
                      ))}
                      {report.suitable_roles.length === 0 && (
                        <p className="text-[10px] text-slate-455">No recommendations found.</p>
                      )}
                    </div>
                  </div>

                  {/* Missing Sections & ATS Strategy Tips */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Missing sections */}
                    <div className="bg-white border border-red-100 rounded-3xl p-6 shadow-xs font-mono">
                      <div className="flex items-center gap-2 mb-4 border-b border-red-50 pb-3">
                        <Layers className="w-4 h-4 text-red-500 shrink-0" />
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Missing CV Content</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {report.missing_sections && report.missing_sections.length > 0 ? (
                          report.missing_sections.map((sec) => (
                            <Chip key={sec} label={sec} color="bg-red-50 text-red-700 border-red-200" />
                          ))
                        ) : (
                          <p className="text-[10px] text-slate-405">No missing standard sections found.</p>
                        )}
                      </div>
                    </div>

                    {/* ATS tips */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs font-mono">
                      <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
                        <ScanSearch className="w-4 h-4 text-slate-600" />
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">ATS Optimization Tips</h3>
                      </div>
                      <ul className="space-y-3">
                        {report.ats_tips && report.ats_tips.length > 0 ? (
                          report.ats_tips.map((tip, i) => (
                            <li key={i} className="flex items-start gap-2.5">
                              <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 text-[9px] font-black flex items-center justify-center shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              <span className="text-[10px] text-slate-600 leading-relaxed">{tip}</span>
                            </li>
                          ))
                        ) : (
                          <p className="text-[10px] text-slate-405">No additional tips.</p>
                        )}
                      </ul>
                    </div>

                  </div>

                </motion.div>
              ) : (
                <div className="flex flex-col justify-center items-center p-12 text-center h-[60vh] border border-[#D8CBEB]/20 bg-purple-50/5 rounded-3xl font-mono">
                  <FileCheck className="w-12 h-12 text-[#7C3AED] mb-4 animate-bounce" />
                  <h3 className="text-base font-bold text-slate-700">No CV Report Loaded</h3>
                  <p className="text-xs text-slate-450 mt-1 max-w-sm">
                    Drag and drop your CV PDF to the upload engine on the left sidebar to generate your analysis report.
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </main>
    </div>
  );
}

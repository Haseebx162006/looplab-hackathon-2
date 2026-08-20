"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  Plus,
  Search,
  ArrowLeft,
  X,
  Sparkles,
  Bot,
  Users,
  Mail,
  Calendar,
  CheckCircle2,
  Play,
  Pause,
  Eye,
  TrendingUp,
  Clock,
  Layers,
  ChevronRight,
  Send,
  Loader2,
  Check,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { exportToPDF, exportToExcel } from "@/utils/exportUtils";
import { HoverSidebar } from "@/components/layout/HoverSidebar";

export interface Campaign {
  id: string;
  title: string;
  segment: string;
  agent: string;
  status: "Active" | "Paused" | "Completed";
  leadsContacted: number;
  openRate: number;
  responseRate: number;
  demosBooked: number;
  dailyLimit: number;
  startDate: string;
  sequenceSteps: string[];
}

const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: "c-1",
    title: "B2B SaaS Founders Outreach Q3",
    segment: "B2B SaaS • 20-200 Employees • ARR $1M-$10M",
    agent: "Outbound Hunter",
    status: "Active",
    leadsContacted: 4800,
    openRate: 72.4,
    responseRate: 26.8,
    demosBooked: 98,
    dailyLimit: 500,
    startDate: "Aug 1, 2026",
    sequenceSteps: [
      "Step 1: Personalized LinkedIn intro on company growth signal",
      "Step 2: Value proposition email highlighting autonomous SDR ROI",
      "Step 3: Technical RFP case study & 15-min calendar demo invitation",
    ],
  },
  {
    id: "c-2",
    title: "Enterprise RFP & Security Compliance",
    segment: "Enterprise SaaS • VP Engineering & Security Officers",
    agent: "Solution Architect",
    status: "Active",
    leadsContacted: 1200,
    openRate: 88.2,
    responseRate: 34.5,
    demosBooked: 42,
    dailyLimit: 200,
    startDate: "Aug 5, 2026",
    sequenceSteps: [
      "Step 1: SOC2 Type II compliance & AES-256 vector encryption breakdown",
      "Step 2: Technical architecture overview & zero cross-tenant leakage audit",
    ],
  },
  {
    id: "c-3",
    title: "Inbound Web Leads 24/7 Nurturing",
    segment: "Inbound Website Signup Leads",
    agent: "Inbound Qualifier",
    status: "Active",
    leadsContacted: 3400,
    openRate: 64.1,
    responseRate: 22.0,
    demosBooked: 64,
    startDate: "Jul 20, 2026",
    dailyLimit: 400,
    sequenceSteps: [
      "Step 1: Instant 60-second follow-up email on sign-up event",
      "Step 2: Interactive pricing calculator & demo booking link",
    ],
  },
  {
    id: "c-4",
    title: "Stalled Deals Re-engagement Campaign",
    segment: "Pipeline Deals Inactive > 30 Days",
    agent: "Deal Nurturer",
    status: "Paused",
    leadsContacted: 1500,
    openRate: 48.0,
    responseRate: 14.2,
    demosBooked: 22,
    startDate: "Jul 10, 2026",
    dailyLimit: 150,
    sequenceSteps: [
      "Step 1: Executive summary touchpoint on updated product SLA",
      "Step 2: Exclusive Q3 pilot pricing incentive nudge",
    ],
  },
];

export const CampaignsPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>(INITIAL_CAMPAIGNS);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "Active" | "Paused" | "Completed">("all");

  // Modals & Drawers
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
  const [inspectCampaign, setInspectCampaign] = useState<Campaign | null>(null);

  // New Campaign Form State
  const [newTitle, setNewTitle] = useState("");
  const [newSegment, setNewSegment] = useState("");
  const [newAgent, setNewAgent] = useState("Outbound Hunter");
  const [newDailyLimit, setNewDailyLimit] = useState(300);

  const toggleCampaignStatus = (id: string) => {
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextStatus = c.status === "Active" ? "Paused" : "Active";
          toast.success(`Campaign "${c.title}" is now ${nextStatus}.`);
          return { ...c, status: nextStatus };
        }
        return c;
      })
    );
  };

  const handleLaunchSubmit = () => {
    if (!newTitle.trim() || !newSegment.trim()) {
      toast.error("Please fill in campaign title and target segment.");
      return;
    }

    const newCamp: Campaign = {
      id: `c-${Date.now()}`,
      title: newTitle,
      segment: newSegment,
      agent: newAgent,
      status: "Active",
      leadsContacted: 0,
      openRate: 100.0,
      responseRate: 0.0,
      demosBooked: 0,
      dailyLimit: newDailyLimit,
      startDate: "Just now",
      sequenceSteps: [
        "Step 1: Initial AI personalized outreach sequence",
        "Step 2: Value proposition & demo reservation nudge",
      ],
    };

    setCampaigns((prev) => [newCamp, ...prev]);
    setIsLaunchModalOpen(false);
    setNewTitle("");
    setNewSegment("");
    toast.success(`Campaign "${newCamp.title}" launched! 🚀`);
  };

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.segment.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterTab === "all") return matchesSearch;
    return matchesSearch && c.status === filterTab;
  });

  const activeCount = campaigns.filter((c) => c.status === "Active").length;
  const totalLeads = campaigns.reduce((acc, curr) => acc + curr.leadsContacted, 0);
  const totalDemos = campaigns.reduce((acc, curr) => acc + curr.demosBooked, 0);

  return (
    <div className="w-full min-h-screen bg-[#F5F2FA] text-[#1C1921] font-sans pl-20 relative overflow-x-hidden selection:bg-purple-200">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

      {/* Collapsible Sidebar */}
      <HoverSidebar />

      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-700 hover:text-slate-950 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>

          <div className="h-4 w-[1px] bg-slate-300 hidden sm:block" />

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-700">
              <Target className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-950 text-sm tracking-wider font-mono">
              Outreach Campaigns Hub
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs font-mono font-medium text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{activeCount} Active Campaigns</span>
          </div>

          <button
            onClick={() =>
              exportToPDF(
                "Outreach Campaigns Portfolio Report",
                "HUNTR Autonomous SDR Campaign Performance & Sequence Conversions",
                ["Campaign Title", "Target Segment", "Assigned Agent", "Leads Contacted", "Open Rate", "Demos Booked"],
                campaigns.map((c) => [c.title, c.segment, c.agent, c.leadsContacted, `${c.openRate}%`, c.demosBooked])
              )
            }
            className="px-3.5 py-1.5 rounded-full bg-white border border-purple-300 text-purple-900 hover:bg-purple-50 text-xs font-mono font-semibold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-purple-700" />
            <span className="hidden sm:inline">Download PDF</span>
          </button>

          <button
            onClick={() =>
              exportToExcel(
                "HUNTR_Campaigns_Portfolio",
                ["Campaign Title", "Target Segment", "Assigned Agent", "Status", "Leads Contacted", "Open Rate", "Response Rate", "Demos Booked"],
                campaigns.map((c) => [c.title, c.segment, c.agent, c.status, c.leadsContacted, `${c.openRate}%`, `${c.responseRate}%`, c.demosBooked])
              )
            }
            className="px-3.5 py-1.5 rounded-full bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-50 text-xs font-mono font-semibold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden sm:inline">Download Excel</span>
          </button>

          <button
            onClick={() => setIsLaunchModalOpen(true)}
            className="px-4 py-1.5 rounded-full bg-slate-950 hover:bg-slate-800 text-white font-mono font-semibold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Launch Campaign</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Title Bar & Hero Metrics */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 border border-purple-200 text-purple-900 text-xs font-mono font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-purple-700" />
              <span>Multi-Channel Outreach Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950">
              Outreach Campaigns Portfolio
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-mono max-w-xl">
              Track active email campaigns, monitor open/demo conversion rates, and launch targeted AI SDR outreach sequences.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
            <div className="space-y-0.5">
              <span className="text-xs font-mono text-slate-500 font-medium">Total Contacted</span>
              <div className="text-xl font-extrabold text-slate-950">{totalLeads.toLocaleString()}</div>
            </div>
            <div className="h-8 w-[1px] bg-slate-200" />
            <div className="space-y-0.5">
              <span className="text-xs font-mono text-slate-500 font-medium">Demos Booked</span>
              <div className="text-xl font-extrabold text-purple-700">{totalDemos} Demos</div>
            </div>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search campaigns or target ICP..."
              className="w-full rounded-full bg-white border border-slate-200 pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-700 font-sans shadow-2xs transition-all"
            />
          </div>

          {/* Filter Tabs */}
          <div className="bg-slate-200/70 p-1 rounded-xl flex items-center gap-1 border border-slate-300/60 self-start sm:self-auto">
            {(["all", "Active", "Paused", "Completed"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                  filterTab === tab ? "bg-white text-slate-950 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab === "all" ? "All Campaigns" : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Campaign Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence>
            {filteredCampaigns.map((camp) => (
              <motion.div
                key={camp.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25 }}
                className={`bg-white rounded-3xl p-6 sm:p-7 border transition-all space-y-5 flex flex-col justify-between ${
                  camp.status === "Active"
                    ? "border-purple-200 shadow-sm ring-1 ring-purple-100"
                    : "border-slate-200 opacity-80 bg-slate-50/50"
                }`}
              >
                <div className="space-y-4">
                  {/* Top Row: Title, Agent Badge, Toggle */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            camp.status === "Active" ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                          }`}
                        />
                        <span className="text-[11px] font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                          {camp.agent}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-950">{camp.title}</h3>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      onClick={() => toggleCampaignStatus(camp.id)}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                        camp.status === "Active" ? "bg-purple-700" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                          camp.status === "Active" ? "left-6" : "left-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Target Segment */}
                  <p className="text-xs text-slate-600 font-mono bg-slate-50 p-3 rounded-xl border border-slate-100">
                    Segment: {camp.segment}
                  </p>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 text-xs font-mono text-center">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-500">Leads Contacted</span>
                      <div className="font-bold text-slate-950 mt-0.5">{camp.leadsContacted.toLocaleString()}</div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-500">Open Rate</span>
                      <div className="font-bold text-indigo-700 mt-0.5">{camp.openRate}%</div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-500">Demos Booked</span>
                      <div className="font-bold text-emerald-600 mt-0.5">{camp.demosBooked}</div>
                    </div>
                  </div>
                </div>

                {/* Card Action */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400">
                    Daily Limit: {camp.dailyLimit} sends
                  </span>

                  <button
                    onClick={() => setInspectCampaign(camp)}
                    className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-purple-700 hover:text-white font-mono text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect Sequence</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

      </main>

      {/* LAUNCH CAMPAIGN MODAL */}
      <AnimatePresence>
        {isLaunchModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="space-y-0.5">
                  <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-purple-700" />
                    Launch AI Outreach Campaign
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Configure target ICP segment and assign autonomous SDR squad.
                  </p>
                </div>

                <button
                  onClick={() => setIsLaunchModalOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Fields */}
              <div className="space-y-4 font-sans text-xs">
                <div className="space-y-1.5">
                  <label className="font-mono font-bold text-slate-950">Campaign Title:</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Q4 FinTech Founders Campaign"
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-mono font-bold text-slate-950">Target ICP Segment:</label>
                  <input
                    type="text"
                    value={newSegment}
                    onChange={(e) => setNewSegment(e.target.value)}
                    placeholder="e.g. B2B SaaS • 50-200 Employees • Series A"
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-mono font-bold text-slate-950">Assigned AI Agent Squad:</label>
                  <select
                    value={newAgent}
                    onChange={(e) => setNewAgent(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 border border-slate-300 px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-700 font-mono"
                  >
                    <option value="Outbound Hunter">Outbound Hunter SDR</option>
                    <option value="Solution Architect">Technical Solution Architect</option>
                    <option value="Inbound Qualifier">Inbound Qualifier Concierge</option>
                    <option value="Deal Nurturer">Deal Nurturer Specialist</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between font-mono font-bold">
                    <span>Daily Send Limit:</span>
                    <span className="text-purple-700">{newDailyLimit} sends/day</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="1000"
                    step="50"
                    value={newDailyLimit}
                    onChange={(e) => setNewDailyLimit(Number(e.target.value))}
                    className="w-full accent-purple-700 cursor-pointer"
                  />
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  onClick={() => setIsLaunchModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLaunchSubmit}
                  className="px-6 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-mono text-xs font-bold shadow-md transition-colors cursor-pointer"
                >
                  Launch Campaign
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* INSPECT CAMPAIGN SEQUENCE DRAWER */}
      <AnimatePresence>
        {inspectCampaign && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInspectCampaign(null)}
              className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs"
            />

            <motion.div
              data-lenis-prevent
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-white border-l border-slate-200 shadow-2xl p-6 overflow-y-auto space-y-6 flex flex-col justify-between"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">
                      Sequence Analytics
                    </span>
                    <h3 className="text-lg font-bold text-slate-950">{inspectCampaign.title}</h3>
                  </div>

                  <button
                    onClick={() => setInspectCampaign(null)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Agent Persona:</span>
                    <span className="font-bold text-purple-700">{inspectCampaign.agent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Open Rate:</span>
                    <span className="font-bold text-slate-900">{inspectCampaign.openRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Demos Scheduled:</span>
                    <span className="font-bold text-emerald-600">{inspectCampaign.demosBooked} Demos</span>
                  </div>
                </div>

                {/* Sequence Steps */}
                <div className="space-y-3">
                  <label className="text-xs font-mono font-bold text-slate-950 flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-purple-700" />
                    AI Sequence Steps & Workflow:
                  </label>

                  <div className="space-y-2 font-mono text-xs">
                    {inspectCampaign.sequenceSteps.map((step, idx) => (
                      <div key={idx} className="bg-purple-50/70 border border-purple-200 p-3.5 rounded-xl space-y-1">
                        <div className="text-[10px] font-bold text-purple-900">Sequence Stage #{idx + 1}</div>
                        <p className="text-slate-800 text-xs font-sans leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
                <button
                  onClick={() => setInspectCampaign(null)}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono font-semibold text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    toggleCampaignStatus(inspectCampaign.id);
                    setInspectCampaign(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-mono font-semibold text-xs shadow-md transition-colors cursor-pointer"
                >
                  {inspectCampaign.status === "Active" ? "Pause Campaign" : "Resume Campaign"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

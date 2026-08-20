"use client";

import React from "react";
import { ArrowUpRight, Database, Target, Radar, Search, ShieldAlert, Zap, Sparkles } from "lucide-react";
import { HowItWorksStep } from "../types/howItWorks";

interface HowItWorksCardProps {
  step: HowItWorksStep;
  index: number;
}

// Per-agent accent config
const agentConfig: Record<string, {
  icon: React.ReactNode;
  dotColor: string;
  labelColor: string;
  scoreBg: string;
  hudBg: string;
}> = {
  upload: {
    icon: <Database className="w-3.5 h-3.5" />,
    dotColor: "bg-purple-400",
    labelColor: "text-purple-700",
    scoreBg: "bg-purple-100 text-purple-900",
    hudBg: "from-violet-950 to-slate-950",
  },
  icp: {
    icon: <Target className="w-3.5 h-3.5" />,
    dotColor: "bg-blue-400",
    labelColor: "text-blue-700",
    scoreBg: "bg-blue-100 text-blue-900",
    hudBg: "from-blue-950 to-slate-950",
  },
  discover: {
    icon: <Radar className="w-3.5 h-3.5" />,
    dotColor: "bg-emerald-400",
    labelColor: "text-emerald-700",
    scoreBg: "bg-emerald-100 text-emerald-900",
    hudBg: "from-emerald-950 to-slate-950",
  },
  research: {
    icon: <Search className="w-3.5 h-3.5" />,
    dotColor: "bg-amber-400",
    labelColor: "text-amber-700",
    scoreBg: "bg-amber-100 text-amber-900",
    hudBg: "from-amber-950 to-slate-950",
  },
  qualify: {
    icon: <ShieldAlert className="w-3.5 h-3.5" />,
    dotColor: "bg-violet-400",
    labelColor: "text-violet-700",
    scoreBg: "bg-violet-100 text-violet-900",
    hudBg: "from-violet-950 to-slate-950",
  },
  outreach: {
    icon: <Zap className="w-3.5 h-3.5" />,
    dotColor: "bg-pink-400",
    labelColor: "text-pink-700",
    scoreBg: "bg-pink-100 text-pink-900",
    hudBg: "from-pink-950 to-slate-950",
  },
  meeting: {
    icon: <Sparkles className="w-3.5 h-3.5" />,
    dotColor: "bg-green-400",
    labelColor: "text-green-700",
    scoreBg: "bg-green-100 text-green-900",
    hudBg: "from-green-950 to-slate-950",
  },
};

export const HowItWorksCard: React.FC<HowItWorksCardProps> = ({ step, index }) => {
  const isFirstCard = step.isHeroAttachmentTarget;
  const cfg = agentConfig[step.id] || agentConfig.upload;

  return (
    <div
      className="w-[320px] shrink-0 rounded-[28px] border border-white/80 bg-white/80 backdrop-blur-xl shadow-xl flex flex-col overflow-visible relative group hover:border-purple-200 hover:shadow-purple-100/40 hover:shadow-2xl transition-all duration-500"
      style={{ paddingTop: "80px" }}
    >
      {/* ── Robot Agent: sits half outside, half inside ── */}
      {!isFirstCard && (
        <div className="absolute left-0 right-0 flex justify-center" style={{ top: "-72px", zIndex: 20 }}>
          <div className="relative">
            <div className={`absolute inset-0 rounded-full blur-2xl opacity-40 bg-gradient-to-b ${step.accentColor} scale-75 translate-y-4`} />
            <img
              src="/robot.png"
              alt={`${step.badge} agent`}
              className="h-44 w-auto object-contain drop-shadow-[0_12px_32px_rgba(80,40,120,0.30)] group-hover:-translate-y-2 group-hover:scale-105 transition-all duration-500 relative z-10"
            />
          </div>
        </div>
      )}

      {/* Card 1: flying robot lands here */}
      {isFirstCard && (
        <div
          id="card1-image-slot"
          className="absolute left-0 right-0 flex justify-center"
          style={{ top: "-72px", zIndex: 20, height: "176px" }}
        >
          <div className="absolute flex items-center justify-center w-40 h-40">
            <div className="absolute w-32 h-32 rounded-full border-2 border-dashed border-purple-400/40 animate-spin-slow" />
            <div className="absolute w-20 h-20 rounded-full bg-purple-300/20 blur-xl animate-pulse" />
          </div>
          <div className="relative">
            <div className={`absolute inset-0 rounded-full blur-2xl opacity-40 bg-gradient-to-b ${step.accentColor} scale-75 translate-y-4`} />
            <img
              id="card1-robot-img"
              src="/robot.png"
              alt="Agent Ingest"
              style={{ opacity: 0 }}
              className="h-44 w-auto object-contain drop-shadow-[0_12px_32px_rgba(80,40,120,0.30)] group-hover:-translate-y-2 group-hover:scale-105 transition-all duration-500 relative z-10"
            />
          </div>
        </div>
      )}

      {/* ── Card Body ── */}
      <div className="flex flex-col gap-4 p-5 pb-6 justify-between flex-1">
        {/* Agent badge row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-slate-950 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 font-mono">
              {step.stepNumber}
            </span>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-semibold ${cfg.labelColor}`}>
              {cfg.icon}
              <span>{step.badge}</span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-950 hover:text-white transition-all cursor-pointer group-hover:border-slate-400">
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Step title + description */}
        <div className="flex flex-col gap-1.5 my-2">
          <span className={`text-[9px] font-black uppercase tracking-[0.18em] font-mono ${cfg.labelColor} opacity-70`}>
            Learning System · Step {step.stepNumber}
          </span>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight leading-snug">
            {step.title}
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            {step.description}
          </p>
        </div>

        {/* Status dot */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor} animate-pulse`} />
          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider font-mono">Module Active</span>
        </div>
      </div>
    </div>
  );
};

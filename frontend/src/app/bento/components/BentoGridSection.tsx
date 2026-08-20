"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Cpu } from "lucide-react";
import { PipelineFeedCard } from "./PipelineFeedCard";
import { MultiChannelCard } from "./MultiChannelCard";
import { EnrichmentCard } from "./EnrichmentCard";
import { MeetingSchedulerCard } from "./MeetingSchedulerCard";
import { AnalyticsCard } from "./AnalyticsCard";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export const BentoGridSection: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!gridRef.current) return;

      const cards = gridRef.current.children;

      gsap.fromTo(
        cards,
        {
          opacity: 0,
          y: 40,
          scale: 0.96,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: gridRef.current,
            start: "top 80%",
            end: "bottom 20%",
            toggleActions: "play none none reverse",
          },
        }
      );
    },
    { scope: sectionRef }
  );

  return (
    <section
      id="capabilities"
      ref={sectionRef}
      className="relative w-full bg-[#F5F2FA] py-24 border-t border-slate-200/60 overflow-hidden"
    >
      <div className="relative w-full max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200 text-xs font-bold font-mono tracking-wider uppercase mb-4 shadow-sm">
            <Cpu className="w-3.5 h-3.5 text-purple-600" />
            <span>AI LEARNING PLATFORM CAPABILITIES</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-slate-900 tracking-tight leading-[1.15]">
            Engineered for <span className="font-bold text-purple-900">Adaptive Skill Mastery</span>
          </h2>

          <p className="text-sm sm:text-base text-slate-600 mt-4 leading-relaxed max-w-xl">
            Explore how CrewAI, Gemini, Qdrant RAG, and Human Mentors power personalized assessments, roadmaps, and task reviews.
          </p>
        </div>

        {/* Bento Grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-12 gap-6 items-stretch"
        >
          <div className="col-span-12 lg:col-span-7 min-h-[380px]">
            <PipelineFeedCard />
          </div>

          <div className="col-span-12 lg:col-span-5 min-h-[380px]">
            <MultiChannelCard />
          </div>

          <div className="col-span-12 lg:col-span-4 min-h-[360px]">
            <EnrichmentCard />
          </div>

          <div className="col-span-12 lg:col-span-4 min-h-[360px]">
            <MeetingSchedulerCard />
          </div>

          <div className="col-span-12 lg:col-span-4 min-h-[360px]">
            <AnalyticsCard />
          </div>
        </div>
      </div>
    </section>
  );
};

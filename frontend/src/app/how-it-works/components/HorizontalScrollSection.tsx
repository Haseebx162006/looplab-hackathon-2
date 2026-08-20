"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { HOW_IT_WORKS_STEPS } from "../types/howItWorks";
import { HowItWorksCard } from "./HowItWorksCard";
import { Sparkles } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export const HorizontalScrollSection: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!sectionRef.current || !trackRef.current) return;

      const track = trackRef.current;
      const totalWidth = track.scrollWidth - window.innerWidth + 120;

      gsap.to(track, {
        x: -totalWidth,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          pin: true,
          scrub: 1,
          start: "top top",
          end: () => `+=${totalWidth}`,
          invalidateOnRefresh: true,
        },
      });
    },
    { scope: sectionRef }
  );

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="relative w-full min-h-screen bg-[#F5F2FA] py-16 flex flex-col justify-between overflow-hidden"
    >
      {/* Section Header */}
      <div className="w-full max-w-7xl mx-auto px-6 mb-8 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-200/80 text-purple-900 text-xs font-bold font-mono mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>LEARNING SYSTEM FLOW</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-slate-900 tracking-tight">
            Adaptive <span className="font-bold text-purple-900">7-Step Student Journey</span>
          </h2>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 max-w-sm leading-relaxed">
          Scroll down to explore how our 2-microservice system automates skill diagnostics, RAG roadmaps, and human mentor progress loops.
        </p>
      </div>

      {/* Horizontal Scroll Track */}
      <div className="w-full overflow-x-hidden overflow-y-visible flex-1 flex items-end">
        <div
          ref={trackRef}
          className="flex items-end gap-6 px-6 sm:px-16 w-max pb-8 pt-28"
        >
          {HOW_IT_WORKS_STEPS.map((step, index) => (
            <HowItWorksCard key={step.id} step={step} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

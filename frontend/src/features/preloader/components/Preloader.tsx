'use client';

import React, { useEffect, useState, useRef } from 'react';
import gsap from 'gsap';

interface PreloaderProps {
  onComplete?: () => void;
}

export const Preloader: React.FC<PreloaderProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<HTMLDivElement>(null);
  const progressTextRef = useRef<HTMLSpanElement>(null);
  const svgCircleRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const counterObj = { value: 0 };

      // Circle SVG stroke setup
      const circle = svgCircleRef.current;
      const radius = 24;
      const circumference = 2 * Math.PI * radius;
      if (circle) {
        circle.style.strokeDasharray = `${circumference}`;
        circle.style.strokeDashoffset = `${circumference}`;
      }

      const tl = gsap.timeline({
        onComplete: () => {
          triggerExitAnimation();
        },
      });

      // Animate percentage counter & progress circle
      tl.to(counterObj, {
        value: 100,
        duration: 3.2,
        ease: 'power3.inOut',
        onUpdate: () => {
          const currentVal = Math.round(counterObj.value);
          setProgress(currentVal);

          if (circle) {
            const offset = circumference - (currentVal / 100) * circumference;
            circle.style.strokeDashoffset = `${offset}`;
          }
        },
      });

      // Stagger Word Upward Reveal (ASSESSMENT -> SKILL PROFILE -> AI ROADMAP -> HUMAN MENTOR)
      const wordElements = wordsRef.current?.querySelectorAll('.loader-word');
      if (wordElements && wordElements.length > 0) {
        tl.fromTo(
          wordElements,
          {
            yPercent: 120,
            opacity: 0,
            rotateX: -40,
            transformOrigin: '50% 100%',
          },
          {
            yPercent: 0,
            opacity: 1,
            rotateX: 0,
            duration: 1.1,
            stagger: 0.14,
            ease: 'expo.out',
          },
          '<0.1'
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const triggerExitAnimation = () => {
    const ctx = gsap.context(() => {
      const exitTl = gsap.timeline({
        onComplete: () => {
          setIsFinished(true);
          if (onComplete) onComplete();
        },
      });

      const wordElements = wordsRef.current?.querySelectorAll('.loader-word');
      if (wordElements) {
        exitTl.to(wordElements, {
          yPercent: -120,
          opacity: 0,
          stagger: 0.05,
          duration: 0.6,
          ease: 'power4.in',
        });
      }

      exitTl.to(
        [progressTextRef.current, svgCircleRef.current],
        {
          opacity: 0,
          scale: 0.8,
          duration: 0.3,
          ease: 'power2.in',
        },
        '<0.1'
      );

      // Screen Wipe / Curtain Slide Up
      exitTl.to(containerRef.current, {
        yPercent: -100,
        duration: 1.0,
        ease: 'expo.inOut',
      });
    }, containerRef);
  };

  if (isFinished) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-[#D8CBEB] text-[#1E192B] flex flex-col justify-between p-5 md:p-10 select-none overflow-hidden font-['Outfit'] h-screen w-screen"
    >
      {/* Top Header: SVG Progress Ring + Percentage */}
      <div className="w-full flex items-center justify-start gap-4 pt-1 pl-2">
        <div className="relative w-11 h-11 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 60 60">
            <circle
              cx="30"
              cy="30"
              r="24"
              className="stroke-purple-300/60"
              strokeWidth="3"
              fill="transparent"
            />
            <circle
              ref={svgCircleRef}
              cx="30"
              cy="30"
              r="24"
              className="stroke-[#7C3AED]"
              strokeWidth="3"
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-[#7C3AED] animate-ping" />
          </div>
        </div>

        <div className="flex flex-col leading-none font-mono">
          <span
            ref={progressTextRef}
            className="text-base tracking-widest text-[#7C3AED] font-black"
          >
            {progress < 10 ? `00${progress}` : progress < 100 ? `0${progress}` : progress}%
          </span>
          <span className="text-[10px] tracking-widest uppercase text-purple-950/70 font-bold pt-1">
            SEEKH AI Learning Engine
          </span>
        </div>
      </div>

      {/* Main Stacked Giant Editorial Display (4 Clean Rows, Perfectly Proportioned) */}
      <div
        ref={wordsRef}
        className="w-full flex-1 flex flex-col justify-center gap-1 sm:gap-2 my-auto pl-1 md:pl-4 select-none overflow-hidden"
        style={{
          fontFamily: "'Outfit', 'Syne', sans-serif",
        }}
      >
        {/* Row 1: ASSESSMENT */}
        <div className="overflow-hidden leading-none py-0.5">
          <div className="loader-word block will-change-transform text-[clamp(2.5rem,8.2vw,7.5rem)] font-[900] tracking-[-0.04em] leading-none text-[#7C3AED]">
            ASSESSMENT
          </div>
        </div>

        {/* Row 2: SKILL PROFILE */}
        <div className="overflow-hidden leading-none py-0.5">
          <div className="loader-word block will-change-transform text-[clamp(2.5rem,8.2vw,7.5rem)] font-[900] tracking-[-0.04em] leading-none text-[#1E192B]">
            SKILL PROFILE
          </div>
        </div>

        {/* Row 3: AI ROADMAP */}
        <div className="overflow-hidden leading-none py-0.5">
          <div className="loader-word block will-change-transform text-[clamp(2.5rem,8.2vw,7.5rem)] font-[900] tracking-[-0.04em] leading-none text-[#7C3AED]">
            AI ROADMAP
          </div>
        </div>

        {/* Row 4: HUMAN MENTOR */}
        <div className="overflow-hidden leading-none py-0.5">
          <div className="loader-word block will-change-transform text-[clamp(2.5rem,8.2vw,7.5rem)] font-[900] tracking-[-0.04em] leading-none text-[#1E192B]">
            HUMAN MENTOR
          </div>
        </div>
      </div>

      {/* Bottom Footer Accent */}
      <div className="w-full flex justify-between items-end text-[11px] font-mono tracking-widest uppercase text-purple-950/90 pt-2 px-2 font-extrabold border-t border-purple-300/40">
        <span>© SEEKH AI PLATFORM</span>
        <span className="text-[#7C3AED]">CREWAI + GEMINI + QDRANT</span>
      </div>
    </div>
  );
};

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
    // 1. Progress Counter Animation (0% to 100%)
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
          // Trigger Curtain Exit Animation after progress reaches 100%
          triggerExitAnimation();
        },
      });

      // Animate percentage counter & progress circle over 3.2 seconds for dramatic effect
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

      // 2. Stagger Word Upward Reveal (EDUCATOR -> COACH -> MENTOR -> CONSULTANT)
      const wordElements = wordsRef.current?.querySelectorAll('.loader-word');
      if (wordElements && wordElements.length > 0) {
        tl.fromTo(
          wordElements,
          {
            yPercent: 140,
            opacity: 0,
            rotateX: -55,
            transformOrigin: '50% 100%',
          },
          {
            yPercent: 0,
            opacity: 1,
            rotateX: 0,
            duration: 1.2,
            stagger: 0.16,
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

      // Words collapse upward with stagger
      const wordElements = wordsRef.current?.querySelectorAll('.loader-word');
      if (wordElements) {
        exitTl.to(wordElements, {
          yPercent: -140,
          opacity: 0,
          stagger: 0.05,
          duration: 0.65,
          ease: 'power4.in',
        });
      }

      // Loader spinner collapse
      exitTl.to(
        [progressTextRef.current, svgCircleRef.current],
        {
          opacity: 0,
          scale: 0.8,
          duration: 0.35,
          ease: 'power2.in',
        },
        '<0.1'
      );

      // Screen Wipe / Curtain Slide Up with Expo curve (Awwwards style)
      exitTl.to(containerRef.current, {
        yPercent: -100,
        duration: 1.1,
        ease: 'expo.inOut',
      });
    }, containerRef);
  };

  if (isFinished) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-[#0A0A0A] text-[#FEE9CE] flex flex-col justify-between p-2 md:p-5 select-none overflow-hidden font-['Outfit'] h-screen w-screen"
    >
      {/* Top Header: Spinner + Percentage Progress */}
      <div className="w-full flex items-center justify-start gap-3 pt-1 pl-2">
        <div className="relative w-10 h-10 flex items-center justify-center">
          {/* Background Track */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 60 60">
            <circle
              cx="30"
              cy="30"
              r="24"
              className="stroke-[#4E4E4E]/30"
              strokeWidth="2.5"
              fill="transparent"
            />
            {/* Animated Progress Ring */}
            <circle
              ref={svgCircleRef}
              cx="30"
              cy="30"
              r="24"
              className="stroke-[#EF5143]"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          {/* Center Spinner Icon / Dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-[#EF5143] animate-ping" />
          </div>
        </div>

        {/* Counter Percentage Display */}
        <div className="flex flex-col leading-none">
          <span
            ref={progressTextRef}
            className="font-mono text-xs tracking-widest text-[#EF5143] font-semibold"
          >
            {progress < 10 ? `00${progress}` : progress < 100 ? `0${progress}` : progress}%
          </span>
          <span className="text-[9px] tracking-wider uppercase text-[#4E4E4E] pt-0.5">
            Loading Experience
          </span>
        </div>
      </div>

      {/* Main Massive Editorial Display (All 4 Giant Words Fill Screen) */}
      <div
        ref={wordsRef}
        className="w-full flex-1 flex flex-col justify-center items-start text-left font-[900] uppercase text-[#EF5143] tracking-[-0.04em] leading-[0.75] my-auto pl-1 md:pl-4 select-none overflow-hidden"
        style={{
          fontFamily: "'Outfit', 'Syne', sans-serif",
        }}
      >
        {/* Row 1: EDUCATOR */}
        <div className="overflow-hidden py-0 w-full">
          <div className="loader-word block will-change-transform text-[clamp(4.2rem,13.8vw,14.5rem)] font-[900] leading-[0.75]">
            EDUCATOR
          </div>
        </div>

        {/* Row 2: COACH */}
        <div className="overflow-hidden py-0 w-full">
          <div className="loader-word block will-change-transform text-[clamp(4.2rem,13.8vw,14.5rem)] font-[900] leading-[0.75]">
            COACH
          </div>
        </div>

        {/* Row 3: MENTOR */}
        <div className="overflow-hidden py-0 w-full">
          <div className="loader-word block will-change-transform text-[clamp(4.2rem,13.8vw,14.5rem)] font-[900] leading-[0.75]">
            MENTOR
          </div>
        </div>

        {/* Row 4: CONSULTANT */}
        <div className="overflow-hidden py-0 w-full">
          <div className="loader-word block will-change-transform text-[clamp(4.2rem,13.8vw,14.5rem)] font-[900] leading-[0.75]">
            CONSULTANT
          </div>
        </div>
      </div>

      {/* Bottom Footer Accent */}
      <div className="w-full flex justify-between items-end text-[10px] tracking-wider uppercase text-[#4E4E4E] pb-1 px-2">
        <span>© Won J You Studios</span>
        <span>Awwwards Edition</span>
      </div>
    </div>
  );
};



"use client";

import React from "react";

export const RobotHeroVisual: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-10">
      {/* Ambient background glow behind robot */}
      <div className="absolute w-[450px] h-[450px] rounded-full bg-purple-300/40 blur-3xl -z-10 animate-pulse -translate-x-24 md:-translate-x-32 lg:-translate-x-40" />

      {/* Main Robot Starting Slot & Visual */}
      <div
        id="hero-robot-start-slot"
        className="relative w-full h-full flex items-center justify-center pt-8"
      >
        <img
          id="hero-robot-img"
          src="/robot.png"
          alt="AI Insights Robot Visual"
          className="w-auto h-[125%] max-h-[720px] sm:max-h-[820px] object-contain drop-shadow-[0_20px_50px_rgba(70,40,110,0.25)] transition-transform duration-700 hover:scale-[1.04] -translate-y-4 -translate-x-24 md:-translate-x-32 lg:-translate-x-40"
        />

        {/* Floating subtle glass ring overlay details matching the reference art */}
        <div className="absolute top-1/6 left-[52%] w-44 h-44 rounded-full border border-white/60 bg-white/10 backdrop-blur-xs animate-spin-slow pointer-events-none hidden md:block" />
        <div className="absolute bottom-1/3 right-1/4 w-36 h-36 rounded-full border border-purple-200/70 bg-purple-100/15 backdrop-blur-xs pointer-events-none hidden md:block" />
      </div>
    </div>
  );
};

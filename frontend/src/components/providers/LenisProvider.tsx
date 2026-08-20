"use client";

import React, { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface LenisProviderProps {
  children: React.ReactNode;
}

export const LenisProvider: React.FC<LenisProviderProps> = ({ children }) => {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 0.85,
      touchMultiplier: 1.8,
    });

    // ── Critical: Connect Lenis scroll events to ScrollTrigger ──
    // This fires ScrollTrigger.update() every time Lenis emits a scroll,
    // eliminating the disconnect that causes the lag.
    lenis.on("scroll", ScrollTrigger.update);

    // ── Drive Lenis via GSAP ticker instead of rAF ──
    // This keeps both in perfect sync on the same animation frame.
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    // ── Remove GSAP's built-in lag smoothing so there is zero delay ──
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.off("scroll", ScrollTrigger.update);
      gsap.ticker.remove((time) => lenis.raf(time * 1000));
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
};

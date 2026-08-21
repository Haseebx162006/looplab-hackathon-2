"use client";

import React, { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export const VideoScrollReveal: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isReady, setIsReady] = useState(false);
  const scrollProgress = useRef({ value: 0 });

  // 1. Fetch video as Blob to ensure seek speed & zero network lag
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      if (video.duration) {
        setIsReady(true);
      }
    };

    if (video.readyState >= 1 && video.duration) {
      setIsReady(true);
    } else {
      video.addEventListener("loadedmetadata", handleLoadedMetadata);
    }

    fetch("/video.mp4")
      .then((r) => (r.ok ? r.blob() : Promise.reject()))
      .then((blob) => {
        video.src = URL.createObjectURL(blob);
      })
      .catch(() => {
        video.src = "/video.mp4";
      });

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, []);

  // 2. Prime video for iOS touch browsers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const prime = () => {
      try {
        const p = video.play();
        if (p && p.then) {
          p.then(() => {
            try {
              video.pause();
            } catch (e) {}
          }).catch(() => {});
        }
      } catch (e) {}
    };

    window.addEventListener("touchstart", prime, { once: true, passive: true });
    window.addEventListener("pointerdown", prime, { once: true, passive: true });

    return () => {
      window.removeEventListener("touchstart", prime);
      window.removeEventListener("pointerdown", prime);
    };
  }, []);

  // 3. GSAP Timeline triggers mask expansion and updates scrollProgress value
  useGSAP(
    () => {
      if (!isReady || !containerRef.current || !videoRef.current) return;

      const video = videoRef.current;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=350%", // Scroll depth for pinning
          pin: true,
          scrub: 1, // Smooth scrub latency
          invalidateOnRefresh: true,
        },
      });

      // Expand the clip-path circle (reveal video)
      tl.fromTo(
        video,
        {
          clipPath: "circle(5% at 50% 50%)",
        },
        {
          clipPath: "circle(150% at 50% 50%)",
          duration: 1.5,
          ease: "power2.inOut",
        }
      );

      // Animate scrollProgress value, which is then mapped to video currentTime inside requestAnimationFrame
      tl.to(
        scrollProgress.current,
        {
          value: 1,
          duration: 2.5,
          ease: "none",
        },
        "-=0.5"
      );
    },
    { dependencies: [isReady], scope: containerRef }
  );

  // 4. Custom requestAnimationFrame loop for coalesced seek requests (avoids seeking collision)
  useEffect(() => {
    if (!isReady || !videoRef.current) return;

    const video = videoRef.current;
    let frameId: number;
    let cur = 0;
    
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.matchMedia("(hover: none) and (pointer: coarse)").matches || window.innerWidth <= 860;
    const eps = isMobile ? 0.02 : 0.008;

    const tick = () => {
      if (video.seeking) {
        frameId = requestAnimationFrame(tick);
        return;
      }

      const target = scrollProgress.current.value;
      cur += (target - cur) * (reduce ? 1 : 0.18); // Lerping
      const dur = video.duration || 1;
      const t = Math.min(0.999, Math.max(0, cur)) * dur;

      if (Math.abs(video.currentTime - t) > eps) {
        try {
          video.currentTime = t;
        } catch (e) {}
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [isReady]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden flex items-center justify-center bg-black"
    >
      <video
        ref={videoRef}
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none"
        style={{
          clipPath: "circle(0% at 50% 50%)",
        }}
      />
    </div>
  );
};

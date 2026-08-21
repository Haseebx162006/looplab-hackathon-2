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

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, []);

  useGSAP(
    () => {
      if (!isReady || !containerRef.current || !videoRef.current) return;

      const video = videoRef.current;

      // GSAP Timeline for the reveal & video scrub
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

      // 1. Expand the clip-path circle (reveal video)
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

      // 2. Scrub the video timeline directly using GSAP property animation
      tl.to(
        video,
        {
          currentTime: video.duration,
          duration: 2.5,
          ease: "none",
        },
        "-=0.5" // Start scrubbing slightly before the zoom completes
      );
    },
    { dependencies: [isReady], scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden flex items-center justify-center"
    >
      {/* Video with initial tiny clip-path mask */}
      <video
        ref={videoRef}
        src="/video.mp4"
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none"
        style={{
          clipPath: "circle(0% at 50% 50%)", // Matches start unit
        }}
      />
    </div>
  );
};

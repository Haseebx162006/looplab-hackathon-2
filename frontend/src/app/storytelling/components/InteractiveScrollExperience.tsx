"use client";

import React, { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { HeroSection } from "@/app/hero/components/HeroSection";
import { HorizontalScrollSection } from "@/app/how-it-works/components/HorizontalScrollSection";
import { BentoGridSection } from "@/app/bento/components/BentoGridSection";
import { StatsSection } from "@/app/stats/components/StatsSection";
import { Footer } from "@/app/components/Footer";
import StaggeredMenu from "@/app/hero/components/StaggeredMenu";
import { VideoScrollReveal } from "@/app/video-reveal/components/VideoScrollReveal";

import { useCompany } from "@/context/CompanyContext";
import { useRouter } from "next/navigation";

const baseMenuItems = [
  { label: "Home", ariaLabel: "Go to home page", link: "#hero-section-root" },
  { label: "Working", ariaLabel: "Go to how it works section", link: "#how-it-works" },
  { label: "Capabilities", ariaLabel: "Go to capabilities section", link: "#capabilities" },
];

const socialItems = [
  { label: "Twitter", link: "https://twitter.com" },
  { label: "GitHub", link: "https://github.com" },
  { label: "LinkedIn", link: "https://linkedin.com" },
];

const ScrollMenuWrapper: React.FC = () => {
  const [showMenu, setShowMenu] = useState(false);
  const { isAuthenticated, logout } = useCompany();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setShowMenu(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const items = [
    ...baseMenuItems,
    isAuthenticated
      ? {
          label: "Dashboard",
          ariaLabel: "Go to dashboard",
          link: "/dashboard",
          onClick: (e: React.MouseEvent) => {
            e.preventDefault();
            router.push("/dashboard");
          }
        }
      : {
          label: "Login",
          ariaLabel: "Go to login page",
          link: "/login",
          onClick: (e: React.MouseEvent) => {
            e.preventDefault();
            router.push("/login");
          }
        },
    ...(isAuthenticated
      ? [
          {
            label: "Logout",
            ariaLabel: "Log out of account",
            link: "#logout",
            onClick: (e: React.MouseEvent) => {
              e.preventDefault();
              logout();
              router.push("/login");
            }
          }
        ]
      : [])
  ];

  return (
    <div
      style={{
        opacity: showMenu ? 1 : 0,
        pointerEvents: showMenu ? "auto" : "none",
        transition: "opacity 0.3s ease",
      }}
    >
      <StaggeredMenu
        position="right"
        items={items}
        socialItems={socialItems}
        displaySocials={true}
        displayItemNumbering={true}
        menuButtonColor="#000000"
        openMenuButtonColor="#000000"
        changeMenuColorOnOpen={true}
        colors={["#B497CF", "#B497CF"]}
        logoUrl="/logo.png"
        accentColor="#B497CF"
        isFixed={true}
      />
    </div>
  );
};

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export const InteractiveScrollExperience: React.FC = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const flyingRobotRef = useRef<HTMLImageElement>(null);

  useGSAP(
    () => {
      const flyBot = flyingRobotRef.current;
      if (!flyBot) return;

      const heroImg = document.getElementById("hero-robot-img") as HTMLImageElement | null;
      const card1Img = document.getElementById("card1-robot-img") as HTMLImageElement | null;
      const card1Slot = document.getElementById("card1-image-slot") as HTMLElement | null;

      if (!heroImg || !card1Img || !card1Slot) return;

      // Place flying clone exactly over the hero robot on mount & resize
      const placeAtHero = () => {
        const r = heroImg.getBoundingClientRect();
        gsap.set(flyBot, {
          position: "fixed",
          top: r.top,
          left: r.left,
          width: r.width,
          height: r.height,
          opacity: 0,
          zIndex: 9999,
          pointerEvents: "none",
        });
      };
      placeAtHero();
      window.addEventListener("resize", placeAtHero);

      ScrollTrigger.create({
        trigger: "#hero-section-root",
        start: "top top",
        end: "bottom 50%",
        scrub: true,
        invalidateOnRefresh: true,

        onUpdate: (self) => {
          const p = self.progress;

          const startR = heroImg.getBoundingClientRect();
          const endR = card1Slot.getBoundingClientRect();

          // Travel: hero → card 1 slot (pop-out position above card)
          const top = gsap.utils.interpolate(startR.top, endR.top - 72, p);
          const left = gsap.utils.interpolate(startR.left, endR.left + endR.width * 0.1, p);
          const width = gsap.utils.interpolate(startR.width, endR.width * 0.75, p);
          const height = gsap.utils.interpolate(startR.height, 176, p);

          // Phase 1 (0→30%): hero fades out, flying clone fades in
          const heroOpacity = gsap.utils.clamp(0, 1, 1 - p * 3.5);

          // Phase 2 (0→80%): flying clone fully visible
          // Phase 3 (80→100%): clone fades out, card1-robot-img fades in
          const flyOpacity =
            p < 0.8 ? gsap.utils.clamp(0, 1, p * 3.5) : gsap.utils.clamp(0, 1, 1 - (p - 0.8) * 5);
          const cardOpacity = gsap.utils.clamp(0, 1, (p - 0.8) * 5);

          gsap.set(flyBot, { top, left, width, height, opacity: flyOpacity });
          gsap.set(heroImg, { opacity: heroOpacity });
          gsap.set(card1Img, { opacity: cardOpacity });
        },

        onLeave: () => {
          gsap.set(flyBot, { opacity: 0 });
          gsap.set(heroImg, { opacity: 0 });
          gsap.set(card1Img, { opacity: 1 });
        },

        onEnterBack: () => {
          gsap.set(heroImg, { opacity: 1 });
          gsap.set(flyBot, { opacity: 0 });
          gsap.set(card1Img, { opacity: 0 });
        },

        onLeaveBack: () => {
          gsap.set(heroImg, { opacity: 1 });
          gsap.set(flyBot, { opacity: 0 });
          gsap.set(card1Img, { opacity: 0 });
        },
      });

      return () => {
        window.removeEventListener("resize", placeAtHero);
        gsap.set(heroImg, { clearProps: "opacity" });
        gsap.set(card1Img, { clearProps: "opacity" });
        gsap.set(flyBot, { clearProps: "all" });
      };
    },
    { scope: wrapperRef }
  );

  return (
    <div ref={wrapperRef} className="relative w-full bg-[#F5F2FA]">
      {/* Floating ReactBits StaggeredMenu Wrapper */}
      <ScrollMenuWrapper />

      {/* Fixed flying robot clone — position:fixed so it travels across sections */}
      <img
        ref={flyingRobotRef}
        src="/robot.png"
        alt=""
        aria-hidden="true"
        style={{ position: "fixed", opacity: 0, pointerEvents: "none", zIndex: 9999 }}
        className="object-contain drop-shadow-[0_24px_60px_rgba(70,40,110,0.35)]"
      />

      {/* Hero Section */}
      <div id="hero-section-root">
        <HeroSection />
      </div>

      {/* How It Works: Pinned Horizontal Scroll */}
      <HorizontalScrollSection />

      {/* Cinematic Video Reveal on Scroll */}
      <VideoScrollReveal />

      {/* Bento Grid Section */}
      <BentoGridSection />

      {/* Animated Stats & Interactive Recharts Analytics Section */}
      <StatsSection />

      {/* Footer Section */}
      <Footer />
    </div>
  );
};

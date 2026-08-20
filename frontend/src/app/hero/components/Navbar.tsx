"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, LayoutDashboard, Sparkles, GraduationCap } from "lucide-react";
import { NavItem } from "../types/hero";
import { useCompany } from "@/context/CompanyContext";

const navItems: NavItem[] = [
  { id: "home", label: "Home", href: "#hero-section-root", isActive: true },
  { id: "how-it-works", label: "How It Works", href: "#how-it-works" },
  { id: "capabilities", label: "Capabilities", href: "#capabilities" },
];

export const Navbar: React.FC = () => {
  const [activeTab, setActiveTab] = useState("home");
  const { isAuthenticated, hasCompletedOnboarding } = useCompany();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isOnboardingDone, setIsOnboardingDone] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("seekh_auth_token") : null;
    const done = hasCompletedOnboarding || (typeof window !== "undefined" && localStorage.getItem("seekh_onboarding_completed") === "true");
    setIsLoggedIn(isAuthenticated || Boolean(token));
    setIsOnboardingDone(Boolean(done));
  }, [isAuthenticated, hasCompletedOnboarding]);

  return (
    <div className="w-full relative z-30">
      <div className="w-full flex items-start justify-between">
        
        {/* Left White Notch Container */}
        <div className="relative bg-white pl-6 pr-6 py-3.5 rounded-br-[32px] flex items-center gap-6 z-20">
          
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-purple-900 text-white flex items-center justify-center font-extrabold text-xs shadow-xs">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-slate-900 tracking-tight text-base font-mono uppercase">
              SEEKH
            </span>
          </div>

          {/* Nav Items Pill (Lavender) */}
          <div className="bg-[#D4C5E9] px-1.5 py-1 rounded-full flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab(item.id);
                    document.querySelector(item.href)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`relative px-4 py-1 rounded-full text-xs transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? "bg-white text-slate-950 font-semibold shadow-xs"
                      : "text-slate-800 hover:text-slate-950 font-normal hover:bg-white/20"
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="w-3.5 h-3.5 rounded-full border border-slate-400 flex items-center justify-center bg-white">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-700" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Concave Inverted Curve */}
          <div className="absolute top-0 left-full w-8 h-8 pointer-events-none">
            <svg viewBox="0 0 32 32" className="w-8 h-8 fill-white">
              <path d="M 0 0 L 0 32 A 32 32 0 0 0 32 0 Z" />
            </svg>
          </div>
        </div>

        {/* Right Header Controls */}
        <div className="pr-6 pt-3.5 flex items-center gap-3 relative z-20">
          {!isLoggedIn ? (
            <>
              <Link
                href="/onboarding"
                className="px-4 py-1.5 rounded-full bg-white/90 border border-purple-300 text-xs font-semibold font-mono text-purple-950 flex items-center gap-1.5 hover:bg-white hover:border-purple-500 transition-all shadow-xs cursor-pointer group"
              >
                <span>GET STARTED</span>
                <div className="w-4 h-4 rounded-full bg-purple-100 group-hover:bg-purple-600 text-purple-700 group-hover:text-white flex items-center justify-center transition-colors">
                  <ArrowUpRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </Link>

              <Link
                href="/login"
                className="px-5 py-1.5 rounded-full bg-slate-950 border border-slate-900/80 text-xs font-semibold text-white flex items-center gap-1.5 hover:bg-purple-900 transition-all shadow-xs cursor-pointer group"
              >
                <span>LOGIN</span>
                <div className="w-4 h-4 rounded-full border border-slate-700 group-hover:border-white flex items-center justify-center transition-colors">
                  <ArrowUpRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </Link>
            </>
          ) : (
            <Link
              href="/dashboard"
              className="px-5 py-1.5 rounded-full bg-purple-900 border border-purple-800 text-xs font-bold text-white flex items-center gap-2 hover:bg-purple-800 transition-all shadow-md cursor-pointer group"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-purple-300" />
              <span>DASHBOARD</span>
              <div className="w-4 h-4 rounded-full bg-purple-800 group-hover:bg-purple-700 flex items-center justify-center transition-colors">
                <ArrowUpRight className="w-2.5 h-2.5 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </Link>
          )}
        </div>

      </div>
    </div>
  );
};

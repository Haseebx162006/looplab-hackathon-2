"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Layers,
  Bot,
  BarChart3,
  Target,
  Settings,
  Sparkles,
  ChevronRight,
  LogOut,
  ShieldCheck,
  User,
  Workflow,
  Users,
  Calendar,
  Mail,
  GraduationCap,
  FileText,
  Brain,
  Video,
  CheckSquare
} from "lucide-react";
import { useCompany } from "@/context/CompanyContext";
import { useGetMeQuery } from "@/store/api/authApi";
import { useGetMyProfileQuery, useGetProgressQuery } from "@/store/api/learningApi";

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Student Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "roadmaps",
    label: "AI Roadmaps",
    href: "/roadmaps",
    icon: Sparkles,
    badge: "RAG",
  },
  {
    id: "assessments",
    label: "Skill Diagnostics",
    href: "/assessments",
    icon: Target,
    badge: "LIVE",
  },
  {
    id: "cv-report",
    label: "CV Analysis",
    href: "/cv-report",
    icon: FileText,
  },
  {
    id: "settings",
    label: "Account Settings",
    href: "/settings",
    icon: Settings,
  },
];

export const HoverSidebar: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const { isAuthenticated, logout } = useCompany();
  const { data: userProfile } = useGetMeQuery(undefined, {
    skip: !isAuthenticated,
  });
  
  const { data: myProfile } = useGetMyProfileQuery(undefined, {
    skip: !isAuthenticated,
  });

  const { data: progressData } = useGetProgressQuery(undefined, {
    skip: !isAuthenticated,
  });

  const activeRoadmap = progressData?.roadmaps?.[0];
  const progressPercentage = activeRoadmap ? activeRoadmap.progress_percentage : 0;
  const avatarUrl = myProfile?.profile?.avatar_url;
  const userName = userProfile?.user?.name || "Student";
  const userRole = userProfile?.user?.role || "user";

  const pathname = usePathname();
  const router = useRouter();

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const activeNavItems = userProfile?.user?.role === "admin"
    ? [
      {
        id: "admin",
        label: "Mentor Dashboard",
        href: "/admin",
        icon: ShieldCheck,
        badge: "ADMIN",
      },
      {
        id: "admin-users",
        label: "User Roster",
        href: "/admin/users",
        icon: Users,
      },
      {
        id: "admin-reviews",
        label: "Task Reviews",
        href: "/admin/reviews",
        icon: CheckSquare,
      },
      {
        id: "admin-meetings",
        label: "Call Requests",
        href: "/admin/meetings",
        icon: Video,
      },
      {
        id: "knowledge-base",
        label: "Knowledge Base",
        href: "/admin/knowledge-base",
        icon: Brain,
        badge: "RAG",
      },
      {
        id: "settings",
        label: "Account Settings",
        href: "/settings",
        icon: Settings,
      }
    ]
    : [...NAV_ITEMS];

  return (
    <>
      {/* Mobile Top Navbar Header */}
      <div className="flex md:hidden fixed top-0 left-0 right-0 h-16 z-40 bg-[#1c1921] border-b border-slate-800 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-900 border border-purple-700/50 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-xs tracking-wider font-mono text-white">SEEKH AI</span>
        </Link>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 text-slate-400 hover:text-white rounded-lg focus:outline-none cursor-pointer"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
      </div>

      {/* Mobile Drawer Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/60 z-45 md:hidden"
        />
      )}

      {/* Mobile Slide-out Drawer */}
      <div
        className={`fixed top-0 left-0 bottom-0 z-50 bg-[#1c1921] w-64 p-3 shadow-2xl flex flex-col justify-between transition-transform duration-300 md:hidden ${isMobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2 py-1.5">
            <Link href="/" className="flex items-center gap-3" onClick={() => setIsMobileOpen(false)}>
              <div className="w-10 h-10 rounded-xl bg-purple-900 border border-purple-700/50 flex items-center justify-center shadow-xs">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-extrabold text-sm tracking-wider font-mono text-white">SEEKH AI</div>
                <div className="text-[10px] font-mono text-purple-300">Adaptive Learning</div>
              </div>
            </Link>
          </div>

          <div className="h-[1px] w-full bg-slate-800" />

          <nav className="space-y-1.5">
            {activeNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link key={item.id} href={item.href} onClick={() => setIsMobileOpen(false)}>
                  <div
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${isActive
                      ? "bg-purple-700 text-white font-bold shadow-md"
                      : "text-slate-400 hover:text-white hover:bg-white/10"
                      }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="text-xs font-mono">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto px-1.5 py-0.5 bg-purple-900/40 border border-purple-500/30 text-[9px] font-bold rounded-md text-purple-200">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between px-2 py-1.5 rounded-xl bg-white/5 font-mono">
            <Link href="/settings" className="flex items-center gap-3 overflow-hidden" onClick={() => setIsMobileOpen(false)}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-9 h-9 rounded-full object-cover shrink-0 border border-purple-700/50 shadow-sm" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-purple-900 border border-purple-700 text-purple-200 flex items-center justify-center shrink-0 font-bold text-xs">
                  {userName[0]?.toUpperCase() || "U"}
                </div>
              )}
              <div className="truncate flex flex-col justify-center">
                <div className="text-xs font-bold text-white truncate">{userName}</div>
                <div className="text-[10px] text-slate-400 truncate capitalize">{userRole} Profile</div>
              </div>
            </Link>
            <button
              onClick={() => logout()}
              className="p-2 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar (Hover-animating) */}
      <motion.aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        initial={false}
        animate={{
          width: isHovered ? 256 : 72,
        }}
        transition={{
          type: "spring",
          stiffness: 350,
          damping: 32,
        }}
        className="hidden md:flex fixed top-0 left-0 bottom-0 z-50 bg-[#1c1921] border-r border-slate-800 text-white flex-col justify-between p-3 shadow-2xl overflow-hidden select-none"
      >
        <div className="space-y-6">
          <Link href="/" className="flex items-center gap-3 px-2 py-1.5 overflow-hidden group">
            <div className="w-10 h-10 rounded-xl bg-purple-900 border border-purple-700/50 flex items-center justify-center shrink-0 shadow-xs group-hover:bg-purple-600 transition-colors">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>

            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="whitespace-nowrap overflow-hidden"
                >
                  <div className="font-extrabold text-sm tracking-wider font-mono text-white">
                    SEEKH AI
                  </div>
                  <div className="text-[10px] font-mono text-purple-300">
                    Adaptive Learning
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>

          <div className="h-[1px] w-full bg-slate-800" />

          <nav className="space-y-1.5">
            {activeNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link key={item.id} href={item.href}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${isActive
                      ? "bg-purple-700 text-white font-bold shadow-md"
                      : "text-slate-400 hover:text-white hover:bg-white/10"
                      }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />

                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.18 }}
                          className="flex items-center justify-between w-full whitespace-nowrap overflow-hidden pr-1"
                        >
                          <span className="text-xs font-mono">{item.label}</span>
                          {item.badge && (
                            <span className="px-1.5 py-0.5 bg-purple-900/40 border border-purple-500/30 text-[9px] font-bold rounded-md text-purple-200">
                              {item.badge}
                            </span>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3 pt-3 border-t border-slate-800">
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl space-y-1.5 text-xs font-mono"
              >
                <div className="flex items-center justify-between px-1">
                  <span className="text-slate-400">Roadmap</span>
                  <span className="text-purple-300 font-bold">{progressPercentage}%</span>
                </div>
                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" 
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Link
            href="/settings"
            className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer overflow-hidden"
          >
            <div className="relative shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-9 h-9 rounded-full object-cover border border-purple-700/50 shadow-sm" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-purple-900 border border-purple-700 text-purple-200 flex items-center justify-center font-mono font-bold text-xs">
                  {userName[0]?.toUpperCase() || "U"}
                </div>
              )}
            </div>

            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="whitespace-nowrap overflow-hidden pr-2 flex items-center justify-between w-full"
                >
                  <div className="flex flex-col justify-center">
                    <div className="text-xs font-bold text-white truncate max-w-[120px]">{userName}</div>
                    <div className="text-[10px] font-mono text-slate-400 truncate capitalize">{userRole} Profile</div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      logout();
                    }}
                    className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
        </div>
      </motion.aside>
    </>
  );
};

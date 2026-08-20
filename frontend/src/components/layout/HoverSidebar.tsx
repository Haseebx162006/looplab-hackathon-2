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
  GraduationCap
} from "lucide-react";
import { useCompany } from "@/context/CompanyContext";

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
    id: "settings",
    label: "Account Settings",
    href: "/settings",
    icon: Settings,
  },
];

export const HoverSidebar: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useCompany();

  return (
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
      className="fixed top-0 left-0 bottom-0 z-50 bg-[#1c1921] border-r border-slate-800 text-white flex flex-col justify-between p-3 shadow-2xl overflow-hidden select-none"
    >
      {/* Top Section: Logo & Brand */}
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

        {/* Divider */}
        <div className="h-[1px] w-full bg-slate-800" />

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {NAV_ITEMS.map((item) => {
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
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: User & Squad Status */}
      <div className="space-y-3 pt-3 border-t border-slate-800">
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl space-y-1.5 text-xs font-mono"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Roadmap Progress</span>
                <span className="text-emerald-400 font-bold">65%</span>
              </div>
              <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-[65%]" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User Card */}
        <Link
          href="/settings"
          className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer overflow-hidden"
        >
          <div className="w-9 h-9 rounded-full bg-purple-900 border border-purple-700 text-purple-200 flex items-center justify-center shrink-0 font-mono font-bold text-xs">
            H
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
                <div>
                  <div className="text-xs font-bold text-white truncate">Hassan Ali</div>
                  <div className="text-[10px] font-mono text-slate-400 truncate">Student Profile</div>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    logout();
                    router.replace("/login");
                  }}
                  className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>
    </motion.aside>
  );
};

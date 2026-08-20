"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle, Sparkles, UserCheck } from "lucide-react";

const SLOTS = [
  { id: "1", time: "10:00 AM", status: "booked" },
  { id: "2", time: "11:30 AM", status: "available" },
  { id: "3", time: "02:00 PM", status: "available" },
  { id: "4", time: "04:15 PM", status: "booked" },
];

export const MeetingSchedulerCard: React.FC = () => {
  const [selectedSlot, setSelectedSlot] = useState<string>("2");
  const [bookedSuccess, setBookedSuccess] = useState(true);

  // Auto-cycle through booking slots every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setSelectedSlot((prev) => (prev === "2" ? "3" : "2"));
      setBookedSuccess(true);
      setTimeout(() => setBookedSuccess(false), 2400);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-full bg-[#1E192B] text-white rounded-[32px] p-6 sm:p-8 border border-white/20 shadow-lg flex flex-col justify-between overflow-hidden group">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-400/10 border border-purple-400/20 text-purple-300 text-[11px] font-mono tracking-wider uppercase mb-3">
          <UserCheck className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
          <span>HUMAN MENTOR LOOP</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          Human Mentor Reviews
        </h3>
        <p className="text-xs text-white/60 mt-1">
          Real human experts review task code & provide 1:1 guidance.
        </p>
      </div>

      {/* Time Slots Grid */}
      <div className="my-4">
        <div className="text-[10px] font-mono font-bold text-white/50 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Mentor Review Slots</span>
          <span className="text-emerald-400">2 Available</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {SLOTS.map((slot) => {
            const isSelected = selectedSlot === slot.id && bookedSuccess;
            const isBooked = slot.status === "booked" && !isSelected;

            return (
              <div
                key={slot.id}
                className={`p-2.5 rounded-xl border text-xs font-mono font-semibold flex items-center justify-between transition-all ${
                  isSelected
                    ? "bg-[#D8CBEB] text-slate-950 border-white shadow-md scale-102"
                    : isBooked
                    ? "bg-white/5 text-white/30 border-white/5"
                    : "bg-white/10 text-white border-white/10"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-white/50" />
                  <span>{slot.time}</span>
                </div>
                {isSelected ? (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                ) : isBooked ? (
                  <span className="text-[9px] uppercase text-white/30">Filled</span>
                ) : (
                  <span className="text-[9px] uppercase text-purple-300 font-bold">Select</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Booking Toast */}
      <div className="min-h-[40px]">
        <AnimatePresence mode="wait">
          {bookedSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-mono flex items-center justify-between border border-emerald-500/30 shadow-xs"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin-slow" />
                <span>Mentor review session assigned!</span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="active"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between text-xs text-white/50 font-mono"
            >
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Human-in-the-Loop Active</span>
              </span>
              <span className="text-purple-300 font-bold">Auto-Syncing</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

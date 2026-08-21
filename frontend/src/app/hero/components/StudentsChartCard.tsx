"use client";

import React, { useState } from "react";
import { StudentDataPoint } from "../types/hero";

const chartData: StudentDataPoint[] = [
  { month: "May", value: 30 },
  { month: "Jun", value: 45 },
  { month: "Jul", value: 25 },
  { month: "Aug", value: 65 },
  { month: "Sep", value: 95 },
];

export const StudentsChartCard: React.FC = () => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(4);

  const width = 240;
  const height = 65;

  const points = chartData.map((d, index) => {
    const x = (index / (chartData.length - 1)) * (width - 20) + 10;
    const y = height - (d.value / 100) * (height - 15) - 5;
    return { x, y, ...d };
  });

  const dPath = points.reduce((acc, point, i, a) => {
    if (i === 0) return `M ${point.x},${point.y}`;
    const prev = a[i - 1];
    const cx1 = prev.x + (point.x - prev.x) / 2;
    const cy1 = prev.y;
    const cx2 = prev.x + (point.x - prev.x) / 2;
    const cy2 = point.y;
    return `${acc} C ${cx1},${cy1} ${cx2},${cy2} ${point.x},${point.y}`;
  }, "");

  const fillPath = `${dPath} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`;

  return (
    <div className="glass-card w-64 sm:w-72 p-4 rounded-3xl flex flex-col gap-2 transition-transform duration-300 hover:scale-[1.02] shadow-xl border border-white/80">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-white uppercase tracking-wider leading-tight font-mono">
            COMPLETED TASKS <br /> & SKILL MASTERY
          </span>
        </div>
        <span className="text-[11px] text-white/60 font-normal italic font-mono">
          metrics
        </span>
      </div>

      {/* Main Metric Value */}
      <div className="flex items-baseline justify-between mt-1">
        <span className="text-xl font-extrabold text-white tracking-tight">
          +2.4 K Tasks
        </span>
        <span className="text-[10px] text-emerald-100 font-bold bg-emerald-500/30 border border-emerald-400/30 px-2 py-0.5 rounded-full">
          ↑ 94.8% Approval
        </span>
      </div>

      {/* SVG Interactive Line Chart */}
      <div className="relative w-full mt-1">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-16 overflow-visible"
        >
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="fillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(124, 58, 237, 0.25)" />
              <stop offset="100%" stopColor="rgba(124, 58, 237, 0.0)" />
            </linearGradient>
          </defs>

          <path d={fillPath} fill="url(#fillGrad)" />
          <path
            d={dPath}
            fill="none"
            stroke="url(#lineGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {points.map((pt, idx) => {
            const isHovered = hoveredIdx === idx;
            return (
              <g key={pt.month} className="cursor-pointer">
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 5 : 3}
                  fill={isHovered ? "#059669" : "#6D28D9"}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  className="transition-all duration-200"
                  onMouseEnter={() => setHoveredIdx(idx)}
                />
                {isHovered && (
                  <g transform={`translate(${pt.x - 20}, ${pt.y - 20})`}>
                    <rect
                      width="40"
                      height="16"
                      rx="8"
                      fill="#059669"
                      className="shadow-sm"
                    />
                    <text
                      x="20"
                      y="11"
                      fill="#FFFFFF"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      +{pt.value * 25}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 mt-1 font-medium font-mono">
          {chartData.map((d, i) => (
            <span
              key={d.month}
              className={hoveredIdx === i ? "text-slate-900 font-bold" : ""}
            >
              {d.month}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

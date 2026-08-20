"use client";

import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

const BASE_DATA = [
  { month: "Jan", tasks: 1200, mastery: 440 },
  { month: "Feb", tasks: 1900, mastery: 810 },
  { month: "Mar", tasks: 2800, mastery: 1420 },
  { month: "Apr", tasks: 3400, mastery: 2100 },
  { month: "May", tasks: 4200, mastery: 3100 },
  { month: "Jun", tasks: 4920, mastery: 4490 },
];

export const ConversionChart: React.FC = () => {
  const [chartData, setChartData] = useState(BASE_DATA);

  // Live micro-pulse animation loop that shifts values continuously
  useEffect(() => {
    const timer = setInterval(() => {
      setChartData((prev) =>
        prev.map((item, i) => {
          if (i === prev.length - 1) {
            const delta = Math.floor(Math.random() * 8) - 3;
            return {
              ...item,
              tasks: item.tasks + Math.max(1, delta),
              mastery: item.mastery + Math.max(1, Math.floor(delta * 0.8)),
            };
          }
          return item;
        })
      );
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full h-[260px] relative">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.7} />
              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorMastery" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.9} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />

          <XAxis
            dataKey="month"
            stroke="rgba(255, 255, 255, 0.5)"
            fontSize={11}
            tickLine={false}
          />
          <YAxis
            stroke="rgba(255, 255, 255, 0.5)"
            fontSize={11}
            tickLine={false}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: "#1C1921",
              borderColor: "rgba(139, 92, 246, 0.4)",
              borderRadius: "16px",
              color: "#FFFFFF",
              fontSize: "12px",
              fontFamily: "monospace",
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
            }}
          />

          <Area
            type="monotone"
            dataKey="tasks"
            stroke="#C4B5FD"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorTasks)"
            name="Tasks Completed"
            isAnimationActive={true}
            animationDuration={800}
          />

          <Area
            type="monotone"
            dataKey="mastery"
            stroke="#10B981"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorMastery)"
            name="Skill Mastery Verified"
            isAnimationActive={true}
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

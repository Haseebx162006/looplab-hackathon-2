"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell
} from "recharts";

const BASE_DATA = [
  { metric: "Manual Study", hours: 1800 },
  { metric: "Self-Paced", hours: 1200 },
  { metric: "Video Courses", hours: 850 },
  { metric: "Seekh AI Engine", hours: 140 },
];

export const RevenueChart: React.FC = () => {
  const [data, setData] = useState(BASE_DATA);

  // Live bar micro-pulse animation
  useEffect(() => {
    const timer = setInterval(() => {
      setData((prev) =>
        prev.map((item, idx) => {
          if (idx === 3) {
            const delta = Math.floor(Math.random() * 5) - 2;
            return { ...item, hours: Math.max(130, item.hours + delta) };
          }
          return item;
        })
      );
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full h-[260px] relative">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.06)" />

          <XAxis
            dataKey="metric"
            stroke="rgba(0, 0, 0, 0.6)"
            fontSize={11}
            tickLine={false}
          />
          <YAxis
            stroke="rgba(0, 0, 0, 0.6)"
            fontSize={11}
            tickLine={false}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: "#FFFFFF",
              borderColor: "#7C3AED",
              borderRadius: "16px",
              color: "#0F172A",
              fontSize: "12px",
              fontFamily: "monospace",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15)",
            }}
          />

          <Bar
            dataKey="hours"
            name="Learning Time to Mastery (Hours)"
            radius={[10, 10, 0, 0]}
            isAnimationActive={true}
            animationDuration={800}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={index === 3 ? "#7C3AED" : "#CBD5E1"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

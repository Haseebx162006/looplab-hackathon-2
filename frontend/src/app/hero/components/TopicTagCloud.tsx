"use client";

import React, { useState } from "react";
import { TopicTag } from "../types/hero";

const tags: TopicTag[] = [
  { id: "programming", label: "Programming Core" },
  { id: "aiml", label: "AI & Machine Learning" },
  { id: "dsa", label: "DSA & Problem Solving" },
  { id: "backend", label: "Web & Backend Dev" },
  { id: "databases", label: "Databases & Vector DB" },
  { id: "rag", label: "RAG & CrewAI Roadmaps" },
  { id: "mentorship", label: "Human Mentor Review" },
];

export const TopicTagCloud: React.FC = () => {
  const [activeId, setActiveId] = useState<string>("aiml");

  return (
    <div className="relative w-full max-w-sm flex flex-wrap gap-2.5 items-center justify-end p-2">
      {tags.map((tag) => {
        const isActive = activeId === tag.id;
        return (
          <button
            key={tag.id}
            onClick={() => setActiveId(tag.id)}
            className={`tag-pill px-4 py-2 rounded-full text-xs font-medium cursor-pointer transition-all duration-300 ${
              isActive
                ? "bg-white text-slate-950 font-bold shadow-md border-purple-400 scale-105"
                : "text-slate-700 hover:text-slate-950 bg-white/40"
            }`}
          >
            {tag.label}
          </button>
        );
      })}
    </div>
  );
};

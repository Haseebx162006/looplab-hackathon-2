'use client';

import React from 'react';
import { Preloader } from '@/features/preloader/components/Preloader';
import { InteractiveScrollExperience } from '@/app/storytelling/components/InteractiveScrollExperience';

export default function Home() {
  return (
    <>
      {/* 1. GSAP Editorial Word Stagger Preloader */}
      <Preloader />

      {/* 2. Interactive Robot Storytelling & Landing Experience (Rendered 100% visible behind Preloader) */}
      <div className="min-h-screen bg-[#F5F2FA] text-slate-900 selection:bg-purple-600 selection:text-white">
        <InteractiveScrollExperience />
      </div>
    </>
  );
}

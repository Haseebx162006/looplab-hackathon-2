'use client';

import { useState } from 'react';
import { Preloader } from '@/features/preloader/components/Preloader';
import { HealthCard } from '@/features/health-check/components/HealthCard';
import { VectorSearchDemo } from '@/features/vector-demo/components/VectorSearchDemo';
import { RagDemo } from '@/features/rag/components/RagDemo';

export default function Home() {
  const [loadingComplete, setLoadingComplete] = useState(false);

  return (
    <>
      {/* Awwwards-Level GSAP Word Stagger Preloader */}
      <Preloader onComplete={() => setLoadingComplete(true)} />

      {/* Main Studio Landing Experience */}
      <main
        className={`min-h-screen bg-[#0A0A0A] text-[#FEE9CE] flex flex-col justify-between selection:bg-[#EF5143] selection:text-white transition-opacity duration-700 ${
          loadingComplete ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Background Ambient Glow */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#EF5143]/15 blur-3xl" />
          <div className="absolute top-1/3 -right-40 w-96 h-96 rounded-full bg-[#FEE9CE]/10 blur-3xl" />
        </div>

        {/* Studio Navbar */}
        <header className="border-b border-[#4E4E4E]/30 bg-[#0A0A0A]/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-md bg-[#EF5143] flex items-center justify-center font-bold text-white shadow-lg shadow-[#EF5143]/30 font-['avantt']">
                W
              </div>
              <span className="font-semibold text-lg tracking-tight text-[#FEE9CE] font-['avantt']">
                Won J You Studios
              </span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs px-3 py-1 rounded-full bg-[#EF5143]/10 text-[#EF5143] border border-[#EF5143]/30 font-['avantt'] font-medium">
                Design Mentorship & Coaching
              </span>
              <button className="hidden sm:block font-['avantt'] text-xs font-semibold uppercase tracking-wider bg-[#FEE9CE] text-[#0A0A0A] px-4 py-2 rounded-md hover:bg-[#EF5143] hover:text-white transition-colors duration-200">
                Book 1:1 Session
              </button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <div className="max-w-6xl mx-auto px-6 py-16 flex-1 w-full space-y-16">
          <section className="text-center space-y-6 max-w-4xl mx-auto pt-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#EF5143]/30 bg-[#EF5143]/10 text-[#EF5143] text-xs font-semibold tracking-wider uppercase font-['avantt']">
              ✨ 20+ Years Fortune 500 Leadership
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-8xl font-[900] uppercase tracking-[-0.04em] text-[#EF5143] font-['Outfit'] leading-[0.85]">
              EDUCATOR COACH MENTOR CONSULTANT
            </h1>

            <p className="text-[#4E4E4E] text-lg max-w-2xl mx-auto leading-relaxed font-['avantt']">
              Mastering UX/UI portfolio design, senior product leadership, and high-impact design systems through 1:1 executive coaching.
            </p>
          </section>

          {/* Modular Feature Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <HealthCard />
            <VectorSearchDemo />
            <RagDemo />
          </section>
        </div>

        {/* Footer */}
        <footer className="border-t border-[#4E4E4E]/30 py-8 text-center text-[#4E4E4E] text-xs font-['avantt']">
          <p>© 2026 Won J You Studios — Built with Next.js, GSAP & Framer Motion</p>
        </footer>
      </main>
    </>
  );
}

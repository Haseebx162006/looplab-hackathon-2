import { HealthCard } from '@/features/health-check/components/HealthCard';
import { VectorSearchDemo } from '@/features/vector-demo/components/VectorSearchDemo';
import { RagDemo } from '@/features/rag/components/RagDemo';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Background Gradient Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 rounded-full bg-violet-600/20 blur-3xl" />
      </div>

      {/* Header / Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              LH
            </div>
            <span className="font-semibold text-lg tracking-tight text-white">Fullstack Suite</span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-mono">
              Next.js + Express + pgvector
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Hero */}
      <div className="max-w-6xl mx-auto px-6 py-12 flex-1 w-full space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-4 max-w-3xl mx-auto pt-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-medium">
            🚀 Ready for High-Performance Vector Intelligence
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
            Fullstack Workspace Architecture
          </h1>
          <p className="text-slate-400 text-base leading-relaxed">
            Frontend powered by Next.js 15 (TypeScript & Tailwind CSS). Backend powered by Node.js, Express, PostgreSQL, and native pgvector integration.
          </p>
        </section>

        {/* Modular Feature Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <HealthCard />
          <VectorSearchDemo />
          <RagDemo />
        </section>

        {/* Feature Highlights */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
          <div className="p-5 rounded-xl border border-slate-800/80 bg-slate-900/40">
            <h4 className="font-semibold text-white mb-1">⚡ Next.js App Router</h4>
            <p className="text-slate-400 text-xs">TypeScript and Tailwind CSS setup with feature-driven architecture.</p>
          </div>
          <div className="p-5 rounded-xl border border-slate-800/80 bg-slate-900/40">
            <h4 className="font-semibold text-white mb-1">🛠 Node & Express API</h4>
            <p className="text-slate-400 text-xs">TypeScript build pipeline with tsx hot-reloading and middleware structure.</p>
          </div>
          <div className="p-5 rounded-xl border border-slate-800/80 bg-slate-900/40">
            <h4 className="font-semibold text-white mb-1">🗄 PostgreSQL + pgvector</h4>
            <p className="text-slate-400 text-xs">Vector similarity search enabled for AI embeddings and similarity matching.</p>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-6 text-center text-slate-500 text-xs">
        <p>Loop Hack Architecture — Frontend & Backend Ready</p>
      </footer>
    </main>
  );
}

"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "react-hot-toast";
import {
  Upload,
  Database,
  Trash2,
  Search,
  Plus,
  RefreshCw,
  FileText,
  CheckCircle,
  Loader2,
  TrendingUp,
  Info,
  X
} from "lucide-react";
import { HoverSidebar } from "@/components/layout/HoverSidebar";
import { useCompany } from "@/context/CompanyContext";
import { useGetMeQuery } from "@/store/api/authApi";
import {
  useIngestRagDocumentMutation,
  useGetRagChunksQuery,
  useDeleteRagChunkMutation,
  useGetModulesQuery,
  useGetRagDocumentsQuery,
  useDeleteRagDocumentMutation
} from "@/store/api/learningApi";

export default function KnowledgeBasePage() {
  const router = useRouter();
  const { isAuthenticated } = useCompany();
  const { data: userProfile, isLoading: isUserLoading } = useGetMeQuery(undefined, {
    skip: !isAuthenticated,
  });

  // Redirect if not admin/mentor
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else if (userProfile && userProfile.user?.role !== "admin") {
      toast.error("Access Denied: Mentors/Admins only.");
      router.push("/dashboard");
    }
  }, [isAuthenticated, userProfile, router]);

  const mentorId = userProfile?.user?.id || "default_mentor";

  // Tab State
  const [activeTab, setActiveTab] = useState<"ingest" | "manager">("ingest");

  // Ingestion Tab States
  const [fileBase64, setFileBase64] = useState<string>("");
  const [inputFileName, setInputFileName] = useState("");
  const [pdfFileSize, setPdfFileSize] = useState<number>(0);
  const [sourceType, setSourceType] = useState("mentor_document");
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [dragActive, setDragActive] = useState(false);



  // Manage Tab States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSourceType, setFilterSourceType] = useState("all");
  const [viewingChunkDetail, setViewingChunkDetail] = useState<any | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<{ id: string; name: string } | null>(null);
  const [chunkToDelete, setChunkToDelete] = useState<string | null>(null);

  // RTK Query hooks
  const { data: chunksData, refetch: refetchChunks, isLoading: isChunksLoading } = useGetRagChunksQuery(
    { mentorId },
    { skip: !userProfile || userProfile.user?.role !== "admin" }
  );

  const { data: documentsData, refetch: refetchDocuments, isLoading: isDocumentsLoading } = useGetRagDocumentsQuery(
    { mentorId },
    { skip: !userProfile || userProfile.user?.role !== "admin" }
  );

  const { data: modules } = useGetModulesQuery(undefined, {
    skip: !userProfile || userProfile.user?.role !== "admin"
  });

  const [ingestDocument, { isLoading: isIngesting }] = useIngestRagDocumentMutation();
  const [deleteChunk, { isLoading: isDeleting }] = useDeleteRagChunkMutation();
  const [deleteDocument, { isLoading: isDeletingDocument }] = useDeleteRagDocumentMutation();

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      readAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      readAndSetFile(e.target.files[0]);
    }
  };

  const readAndSetFile = (file: File) => {
    if (file.type !== "application/pdf") {
      toast.error("Please upload a valid PDF file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        setFileBase64(content);
        setInputFileName(file.name);
        setPdfFileSize(file.size);
        toast.success(`Selected PDF: ${file.name}`);
      }
    };
    reader.onerror = () => {
      toast.error("Failed to read PDF file.");
    };
    reader.readAsDataURL(file);
  };

  // Ingest Document Handler
  const handleIngestDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileBase64) {
      toast.error("Please select a PDF document to upload.");
      return;
    }

    try {
      const payload = {
        text: "", // Text will be extracted backend side from the base64 file
        file: fileBase64,
        fileName: inputFileName || "document.pdf",
        sourceType,
        mentorId,
        sourceId: sourceType === "roadmap_info" && selectedModuleId ? selectedModuleId : undefined
      };

      const res = await ingestDocument(payload).unwrap();
      toast.success(res.message || `Ingested successfully into vector store! Created ${res.ingestedCount} chunks.`);
      
      // Reset form
      setFileBase64("");
      setInputFileName("");
      setPdfFileSize(0);
      setSelectedModuleId("");
      refetchChunks();
      refetchDocuments();
    } catch (err: any) {
      toast.error(err.data?.error || err.data?.message || err.message || "Failed to ingest document.");
    }
  };



  // Delete Chunks / Documents Trigger Handlers
  const triggerDeleteChunk = async (id: string) => {
    try {
      await deleteChunk({ id, mentorId }).unwrap();
      toast.success("Chunk deleted successfully.");
      setChunkToDelete(null);
      refetchChunks();
      if (viewingChunkDetail?.id === id) {
        setViewingChunkDetail(null);
      }
    } catch (err: any) {
      toast.error(err.data?.error || err.data?.message || err.message || "Failed to delete chunk.");
    }
  };

  const triggerDeleteDocument = async (id: string) => {
    try {
      await deleteDocument({ id, mentorId }).unwrap();
      toast.success("Document and its chunks deleted successfully.");
      setDocumentToDelete(null);
      refetchDocuments();
      refetchChunks();
    } catch (err: any) {
      toast.error(err.data?.error || err.data?.message || err.message || "Failed to delete document.");
    }
  };

  // Memoized lists filtering
  const filteredChunks = useMemo(() => {
    if (!chunksData?.chunks) return [];
    return chunksData.chunks.filter((chunk) => {
      const matchesSearch = chunk.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (chunk.sourceId || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (chunk.sourceType || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = filterSourceType === "all" || chunk.sourceType === filterSourceType;

      return matchesSearch && matchesType;
    });
  }, [chunksData, searchQuery, filterSourceType]);

  // Statistics calculation
  const stats = useMemo(() => {
    const chunks = chunksData?.chunks || [];
    const docCount = documentsData?.documents?.length || 0;
    return {
      total: chunks.length,
      documents: docCount,
      roadmaps: chunks.filter(c => c.sourceType === "roadmap_info").length,
      others: chunks.filter(c => !["mentor_document", "roadmap_info"].includes(c.sourceType)).length
    };
  }, [chunksData, documentsData]);

  // Utility to format file size
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  if (isUserLoading || (userProfile && userProfile.user?.role !== "admin")) {
    return (
      <div className="min-h-screen bg-[#F5F2FA] flex flex-col justify-center items-center font-sans">
        <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
        <p className="text-sm font-mono text-slate-500">Authorizing & loading RAG Knowledge Base...</p>
      </div>
    );
  }

  return (
    <div data-lenis-prevent className="min-h-screen bg-[#F5F2FA] flex font-sans">
      <HoverSidebar />
      <Toaster position="top-right" />

      {/* Main Container */}
      <main className="flex-1 ml-0 md:ml-20 p-6 md:p-10 pt-20 md:pt-10 max-w-7xl overflow-x-hidden">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-mono text-slate-900">
                Knowledge Base (RAG)
              </h1>
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/10 text-emerald-700 text-[10px] font-extrabold font-mono rounded-full border border-emerald-200 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-1">
              Upload PDF documents and roadmap details to teach your RAG service how to support students.
            </p>
          </div>

          <button
            onClick={() => {
              refetchChunks();
              toast.success("Database cache refreshed.");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold font-mono bg-white border border-purple-200 rounded-xl hover:bg-slate-50 text-slate-700 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {/* Tab Controls Bar */}
        <div className="grid grid-cols-2 gap-2 mb-8 bg-slate-200/50 p-1.5 rounded-2xl border border-purple-100 font-mono text-xs font-bold text-center max-w-md">
          <button
            id="tab-ingest"
            onClick={() => setActiveTab("ingest")}
            className={`px-3 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "ingest"
                ? "bg-[#1E192B] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload PDF
          </button>

          <button
            id="tab-manager"
            onClick={() => setActiveTab("manager")}
            className={`px-3 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "manager"
                ? "bg-[#1E192B] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Manage chunks
            {stats.total > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-purple-500 text-white rounded-md">
                {stats.total}
              </span>
            )}
          </button>
        </div>

        {/* Dynamic Tab Layout */}
        <AnimatePresence mode="wait">
          {/* UPLOAD PDF TAB */}
          {activeTab === "ingest" && (
            <motion.div
              key="ingest-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Form Input Column */}
              <div className="lg:col-span-7 bg-white p-6 md:p-8 rounded-3xl border border-purple-100 shadow-sm">
                <h3 className="text-lg font-bold font-mono text-slate-800 flex items-center gap-2 mb-1">
                  <Upload className="w-4 h-4 text-purple-600" />
                  PDF Ingestion
                </h3>
                <p className="text-xs text-slate-500 font-mono mb-6">
                  Select or drag a text-based PDF file. The file is parsed safely on the backend and mapped to the RAG space.
                </p>

                <form onSubmit={handleIngestDocument} className="space-y-6">
                  {/* File Upload Drop Zone */}
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-8 transition flex flex-col items-center justify-center text-center cursor-pointer ${
                      dragActive ? "border-purple-600 bg-purple-50/50" : "border-slate-300 bg-slate-50/30 hover:border-purple-400 hover:bg-slate-50/40"
                    }`}
                  >
                    <input
                      type="file"
                      id="file-upload"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="file-upload" className="w-full h-full cursor-pointer flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center mb-3">
                        <Upload className="w-6 h-6 text-purple-600" />
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-700 mb-1">
                        Drag & drop your PDF here, or <span className="text-purple-600 underline cursor-pointer">browse</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Supports text-based PDF documents (max 10MB)
                      </span>
                    </label>
                  </div>

                  {/* Render Selected File Card */}
                  {fileBase64 && (
                    <div className="flex items-center gap-3 p-4 bg-purple-50/50 rounded-2xl border border-purple-100 animate-fadeIn">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold font-mono text-slate-800 truncate">{inputFileName}</h4>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">Size: {formatBytes(pdfFileSize)} • Ready for ingestion</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFileBase64("");
                          setInputFileName("");
                          setPdfFileSize(0);
                          toast.success("Cleared file choice.");
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Metadata Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono font-bold text-slate-600 mb-1.5 uppercase">
                        Document Title
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Next.js 16 Syllabus"
                        value={inputFileName}
                        onChange={(e) => setInputFileName(e.target.value)}
                        className="w-full px-4 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono font-bold text-slate-600 mb-1.5 uppercase">
                        Category / Source Type
                      </label>
                      <select
                        value={sourceType}
                        onChange={(e) => setSourceType(e.target.value)}
                        className="w-full px-4 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 cursor-pointer"
                      >
                        <option value="mentor_document">General Documentation</option>
                        <option value="roadmap_info">Roadmap Information</option>
                      </select>
                    </div>

                    {sourceType === "roadmap_info" && (
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-mono font-bold text-slate-600 mb-1.5 uppercase">
                          Map to Active Learning Module
                        </label>
                        <select
                          value={selectedModuleId}
                          onChange={(e) => setSelectedModuleId(e.target.value)}
                          className="w-full px-4 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 cursor-pointer"
                        >
                          <option value="">-- Select a Module (Optional) --</option>
                          {modules?.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <button
                    id="btn-ingest"
                    type="submit"
                    disabled={isIngesting || !fileBase64}
                    className="w-full py-3.5 bg-[#1E192B] hover:bg-[#2b243d] text-white rounded-2xl font-mono text-sm font-bold shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isIngesting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Extracting Text & Ingesting PDF...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Ingest PDF to Vector Index
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Guidelines Column */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-4">
                  <h4 className="text-sm font-bold font-mono text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <Info className="w-4 h-4 text-purple-600" />
                    How PDF Ingest Works
                  </h4>
                  <ul className="text-xs text-slate-600 space-y-3 font-mono">
                    <li className="flex gap-2">
                      <span className="text-purple-600 font-bold">1.</span>
                      <span>The PDF is converted to a base64 buffer and sent securely to the backend.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-purple-600 font-bold">2.</span>
                      <span>The backend processes the PDF using <strong>pdf-parse</strong> to extract text.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-purple-600 font-bold">3.</span>
                      <span>The extracted text is segmented into semantic overlapping chunks.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-purple-600 font-bold">4.</span>
                      <span>Embeddings are registered in the Supabase PostgreSQL vector space matching your <strong>mentor ID</strong>.</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-purple-900/5 p-6 rounded-3xl border border-purple-100 shadow-sm space-y-3">
                  <h4 className="text-sm font-bold font-mono text-purple-800 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-purple-700" />
                    Important Notice
                  </h4>
                  <p className="text-xs text-slate-600 font-mono leading-relaxed">
                    Make sure to upload text-based PDFs (e.g. PDFs created from Google Docs, Word, or Markdown files) rather than scanned image-only PDFs. The text extractor cannot read pixels/scanned images.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
          {activeTab === "manager" && (
            <motion.div
              key="manager-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Stats Overview */}
              <div className="grid grid-cols-3 gap-4 max-w-xl">
                <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">Total Chunks</h5>
                    <p className="text-lg font-bold font-mono text-slate-800">{stats.total}</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">Docs</h5>
                    <p className="text-lg font-bold font-mono text-slate-800">{stats.documents}</p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">Roadmaps</h5>
                    <p className="text-lg font-bold font-mono text-slate-800">{stats.roadmaps}</p>
                  </div>
                </div>
              </div>

              {/* Uploaded PDF Documents Section */}
              <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-600" />
                      Uploaded PDF Documents
                    </h3>
                    <p className="text-slate-400 text-[10px] font-mono mt-0.5">
                      Documents currently indexed and active in your RAG Knowledge Base.
                    </p>
                  </div>
                  <button
                    onClick={() => refetchDocuments()}
                    className="p-1.5 rounded-lg border border-purple-100 hover:bg-purple-50 text-purple-600 transition"
                    title="Refresh list"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {isDocumentsLoading ? (
                  <div className="py-10 text-center flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin mb-2" />
                    <p className="text-[10px] font-mono text-slate-400">Loading indexed PDFs...</p>
                  </div>
                ) : documentsData?.documents && documentsData.documents.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-purple-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                          <th className="py-3 px-4">PDF Document Name</th>
                          <th className="py-3 px-4">Date Indexed</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-50 text-slate-700">
                        {documentsData.documents.map((doc: any) => (
                          <tr key={doc.id} className="hover:bg-slate-50/50 transition">
                            <td className="py-3 px-4 flex items-center gap-2 font-bold text-slate-800">
                              <FileText className="w-3.5 h-3.5 text-blue-500" />
                              <span className="truncate max-w-md">{doc.fileName}</span>
                            </td>
                            <td className="py-3 px-4 text-slate-500 text-[10px]">
                              {new Date(doc.createdAt).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => setDocumentToDelete({ id: doc.id, name: doc.fileName })}
                                disabled={isDeletingDocument}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition disabled:opacity-50"
                                title="Remove PDF & chunks"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                    <Info className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                    <p className="text-[10px] font-mono text-slate-500">No PDF documents uploaded yet.</p>
                  </div>
                )}
              </div>

              {/* Filters Panel */}
              <div className="bg-white p-4 rounded-3xl border border-purple-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="chunk-search"
                    type="text"
                    placeholder="Search chunk content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600"
                  />
                </div>

                <div className="flex w-full md:w-auto gap-4">
                  <select
                    value={filterSourceType}
                    onChange={(e) => setFilterSourceType(e.target.value)}
                    className="px-3 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 cursor-pointer"
                  >
                    <option value="all">All Types</option>
                    <option value="mentor_document">Documents</option>
                    <option value="roadmap_info">Roadmaps</option>
                  </select>
                </div>
              </div>

              {/* Index Chunks List Table */}
              <div className="bg-white rounded-3xl border border-purple-100 shadow-sm overflow-hidden">
                {isChunksLoading ? (
                  <div className="p-20 text-center flex flex-col items-center justify-center">
                    <Loader2 className="w-10 h-10 text-purple-600 animate-spin mb-4" />
                    <p className="text-xs font-mono text-slate-500">Querying vector database...</p>
                  </div>
                ) : filteredChunks.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-purple-100 text-slate-400 font-bold tracking-wider uppercase text-[10px]">
                          <th className="py-4 px-6">Source Type</th>
                          <th className="py-4 px-6">Content Preview</th>
                          <th className="py-4 px-6">Created At</th>
                          <th className="py-4 px-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-50 text-slate-700">
                        {filteredChunks.map((chunk) => (
                          <tr key={chunk.id} className="hover:bg-slate-50/50 transition">
                            <td className="py-4 px-6">
                              <span
                                className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                                  chunk.sourceType === "mentor_document"
                                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                                    : chunk.sourceType === "roadmap_info"
                                    ? "bg-amber-100 text-amber-700 border border-amber-200"
                                    : "bg-slate-100 text-slate-700 border border-slate-200"
                                }`}
                              >
                                {chunk.sourceType?.replace("_", " ") || "document"}
                              </span>
                            </td>
                            <td className="py-4 px-6 max-w-xl">
                              <p className="truncate font-sans font-medium text-slate-800">
                                {chunk.content}
                              </p>
                              <button
                                type="button"
                                onClick={() => setViewingChunkDetail(chunk)}
                                className="text-[10px] text-purple-600 underline font-mono cursor-pointer mt-0.5"
                              >
                                Read full chunk
                              </button>
                            </td>
                            <td className="py-4 px-6 text-slate-400">
                              {new Date(chunk.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button
                                type="button"
                                onClick={() => setChunkToDelete(chunk.id)}
                                disabled={isDeleting}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 rounded-lg hover:text-rose-700 cursor-pointer disabled:opacity-50 transition"
                                title="Delete knowledge chunk"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-20 text-center text-slate-400 font-mono text-xs">
                    No knowledge chunks found matching your filters.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Detail Modals */}
      <AnimatePresence>
        {viewingChunkDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#1c1921]/60 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white w-full max-w-2xl rounded-3xl border border-purple-100 overflow-hidden shadow-xl"
            >
              <div className="px-6 py-4 bg-slate-50 border-b border-purple-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-purple-600" />
                  <h4 className="text-sm font-bold font-mono text-slate-800">Knowledge Chunk Detail</h4>
                </div>
                <button
                  onClick={() => setViewingChunkDetail(null)}
                  className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-2">
                  <h5 className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">Content</h5>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-mono text-slate-700 leading-relaxed whitespace-pre-line">
                    {viewingChunkDetail.content}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <h5 className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">Chunk Index</h5>
                    <p className="text-xs font-mono font-bold text-slate-700">{viewingChunkDetail.chunkIndex ?? 0}</p>
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">Source Type</h5>
                    <p className="text-xs font-mono font-bold text-slate-700 capitalize">{viewingChunkDetail.sourceType?.replace("_", " ")}</p>
                  </div>
                  <div className="space-y-1">
                    <h5 className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">Created At</h5>
                    <p className="text-xs font-mono font-bold text-slate-700">{new Date(viewingChunkDetail.createdAt).toLocaleString()}</p>
                  </div>
                  {viewingChunkDetail.sourceId && (
                    <div className="col-span-2 space-y-1">
                      <h5 className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">Mapped Source ID</h5>
                      <p className="text-xs font-mono font-bold text-slate-700">{viewingChunkDetail.sourceId}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-purple-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setChunkToDelete(viewingChunkDetail.id)}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-mono font-bold hover:bg-rose-100 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Chunk
                </button>
                <button
                  type="button"
                  onClick={() => setViewingChunkDetail(null)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-mono font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete PDF Document Confirmation Modal */}
      <AnimatePresence>
        {documentToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDocumentToDelete(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl border border-purple-100 shadow-2xl p-6 max-w-md w-full relative z-10 space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-800">Delete PDF Document?</h3>
                <p className="text-xs font-mono text-slate-500 leading-relaxed">
                  Are you sure you want to delete the document <span className="font-bold text-slate-700">"{documentToDelete.name}"</span>?
                  This action will permanently delete the document record and purge all of its associated vector chunks from the RAG store.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setDocumentToDelete(null)}
                  disabled={isDeletingDocument}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold hover:bg-slate-50 transition text-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => triggerDeleteDocument(documentToDelete.id)}
                  disabled={isDeletingDocument}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-mono font-bold hover:bg-red-700 transition flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 disabled:opacity-50"
                >
                  {isDeletingDocument ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Delete Document"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Chunk Confirmation Modal */}
      <AnimatePresence>
        {chunkToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setChunkToDelete(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl border border-purple-100 shadow-2xl p-6 max-w-md w-full relative z-10 space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-800">Delete Knowledge Chunk?</h3>
                <p className="text-xs font-mono text-slate-500 leading-relaxed">
                  Are you sure you want to delete this specific chunk? This action will permanently remove its embeddings from the vector index.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setChunkToDelete(null)}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold hover:bg-slate-50 transition text-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={() => triggerDeleteChunk(chunkToDelete)}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-mono font-bold hover:bg-red-700 transition flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Delete Chunk"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

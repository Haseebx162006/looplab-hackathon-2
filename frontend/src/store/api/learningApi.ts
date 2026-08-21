import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface Module {
  id: string;
  name: string;
  description: string;
}

export interface Profile {
  id: string;
  user_id: string;
  education: string;
  skills: string[];
  interests: string[];
  career_goal: string;
  experience: string;
  profile_complete: boolean;
}

export interface TestSession {
  test_id: string;
  module_id: string;
  difficulty: string;
  status: string;
  questions: {
    id: string;
    question: string;
    options: string[];
  }[];
}

export interface TestSubmitResponse {
  test_id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  status: string;
}

export interface SkillSummary {
  id: string;
  user_id: string;
  module_id: string;
  test_id: string;
  strengths: string[];
  weaknesses: string[];
  skill_levels: Record<string, string>;
  missing_skills: string[];
  created_at: string;
}

export interface Task {
  id: string;
  section_id: string;
  title: string;
  description: string;
  order: number;
  status: 'not_started' | 'in_progress' | 'completed';
}

export interface Section {
  id: string;
  roadmap_id: string;
  title: string;
  order: number;
  status: 'in_progress' | 'completed';
  tasks: Task[];
}

export interface Roadmap {
  id: string;
  user_id: string;
  module_id: string;
  skill_summary_id: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  created_at: string;
  sections?: Section[];
}

export interface Submission {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  links?: string[];
  status: 'pending_review' | 'approved' | 'rejected';
  created_at: string;
}

export interface Certificate {
  id: string;
  user_id: string;
  roadmap_id: string;
  module_id: string;
  issued_at: string;
  student_name: string;
  student_email: string;
  module_name: string;
}

export interface ProgressSummary {
  roadmaps: {
    roadmap_id: string;
    module_name: string;
    status: string;
    created_at: string;
    tasks_total: number;
    tasks_completed: number;
    progress_percentage: number;
  }[];
  certificates: {
    certificate_id: string;
    issued_at: string;
    module_name: string;
  }[];
}

export interface TestHistoryItem {
  id: string;
  module_name: string;
  difficulty: string;
  status: string;
  score: number | null;
  total_questions: number;
  created_at: string;
}

export interface CvScoreBreakdown {
  content: number;
  impact: number;
  structure: number;
  ats: number;
}

export interface CvReport {
  candidate_name: string;
  target_role?: string;
  overall_score: number;
  score_breakdown?: CvScoreBreakdown;
  summary: string;
  skills_found: string[];
  missing_sections?: string[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  ats_tips?: string[];
  experience_level: string;
  suitable_roles: string[];
}

export const learningApi = createApi({
  reducerPath: "learningApi",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth.token;
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Profile", "Modules", "Tests", "Roadmaps", "Submissions", "Progress", "Certificates", "Bookings", "RagChunks", "RagDrafts", "RagDocuments"],
  endpoints: (builder) => ({
    getModules: builder.query<Module[], void>({
      query: () => "/modules",
      providesTags: ["Modules"],
    }),
    getMyProfile: builder.query<{ profile: Profile & { cv_url?: string } }, void>({
      query: () => "/onboarding/profile",
      providesTags: ["Profile"],
    }),
    saveProfile: builder.mutation<{ message: string; profile: Profile }, any>({
      query: (profileData) => ({
        url: "/onboarding/profile",
        method: "POST",
        body: profileData,
      }),
      invalidatesTags: ["Profile"],
    }),
    generateTest: builder.mutation<TestSession, { module_id: string; difficulty: string }>({
      query: (body) => ({
        url: "/tests/generate",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Tests", "Progress"],
    }),
    getTestHistory: builder.query<{ history: TestHistoryItem[] }, void>({
      query: () => "/tests/history",
      providesTags: ["Tests"],
    }),
    getTestDetails: builder.query<any, string>({
      query: (id) => `/tests/${id}`,
      providesTags: ["Tests"],
    }),
    submitTest: builder.mutation<TestSubmitResponse, { testId: string; answers: any[] }>({
      query: ({ testId, answers }) => ({
        url: `/tests/${testId}/submit`,
        method: "POST",
        body: { answers },
      }),
      invalidatesTags: ["Tests", "Progress"],
    }),
    generateSkillSummary: builder.mutation<{ message: string; summary: SkillSummary }, { test_id: string }>({
      query: (body) => ({
        url: "/skill-summary/generate",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Progress"],
    }),
    getSkillSummaryDetails: builder.query<SkillSummary, string>({
      query: (id) => `/skill-summary/${id}`,
    }),
    generateRoadmap: builder.mutation<{ message: string; roadmap: Roadmap }, { skill_summary_id: string }>({
      query: (body) => ({
        url: "/roadmaps/generate",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Roadmaps", "Progress"],
    }),
    getRoadmapDetails: builder.query<Roadmap, string>({
      query: (id) => `/roadmaps/${id}`,
      providesTags: ["Roadmaps"],
    }),
    abandonRoadmap: builder.mutation<any, string>({
      query: (id) => ({
        url: `/roadmaps/${id}/abandon`,
        method: "POST",
      }),
      invalidatesTags: ["Roadmaps", "Progress"],
    }),
    submitTask: builder.mutation<{ message: string; submission: Submission }, { taskId: string; content: string; links?: string[] }>({
      query: ({ taskId, content, links }) => ({
        url: `/tasks/${taskId}/submit`,
        method: "POST",
        body: { content, links },
      }),
      invalidatesTags: ["Submissions", "Roadmaps", "Progress"],
    }),
    getTaskSubmissions: builder.query<Submission[], string>({
      query: (taskId) => `/tasks/${taskId}/submissions`,
      providesTags: ["Submissions"],
    }),
    reviewSubmission: builder.mutation<any, { submissionId: string; decision: 'approve' | 'reject'; comment?: string }>({
      query: ({ submissionId, decision, comment }) => ({
        url: `/admin/submissions/${submissionId}/review`,
        method: "POST",
        body: { decision, comment },
      }),
      invalidatesTags: ["Submissions", "Roadmaps", "Progress", "Certificates"],
    }),
    getPendingSubmissions: builder.query<any[], void>({
      query: () => "/admin/submissions",
      providesTags: ["Submissions"],
    }),
    getCertificateDetails: builder.query<Certificate, string>({
      query: (id) => `/certificates/${id}`,
      providesTags: ["Certificates"],
    }),
    getProgress: builder.query<ProgressSummary, void>({
      query: () => "/users/me/progress",
      providesTags: ["Progress", "Roadmaps", "Certificates"],
    }),
    getAllUsers: builder.query<any[], void>({
      query: () => "/admin/users",
      providesTags: ["Progress"],
    }),
    blockUser: builder.mutation<any, string>({
      query: (userId) => ({
        url: `/admin/users/${userId}/block`,
        method: "POST",
      }),
      invalidatesTags: ["Progress"],
    }),
    unblockUser: builder.mutation<any, string>({
      query: (userId) => ({
        url: `/admin/users/${userId}/unblock`,
        method: "POST",
      }),
      invalidatesTags: ["Progress"],
    }),
    bookMentorCall: builder.mutation<any, { title: string; description?: string; startDateTime: string; endDateTime: string; attendeeEmail: string }>({
      query: (body) => ({
        url: "/admin/booking/meet",
        method: "POST",
        body,
      }),
    }),
    analyzeCv: builder.mutation<{ report: CvReport; cv_url: string }, void>({
      query: () => ({
        url: "/cv/analyze",
        method: "POST",
      }),
    }),
    uploadCv: builder.mutation<{ message: string; cv_url: string }, { file: string; fileName: string }>({
      query: (body) => ({
        url: "/cv/upload",
        method: "POST",
        body,
      }),
    }),
    resumeRoadmap: builder.mutation<any, string>({
      query: (id) => ({
        url: `/roadmaps/${id}/resume`,
        method: "POST",
      }),
      invalidatesTags: ["Roadmaps", "Progress"],
    }),
    createBookingRequest: builder.mutation<any, { title: string; description?: string }>({
      query: (body) => ({
        url: "/booking/requests",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Bookings"],
    }),
    getUserBookingRequests: builder.query<any[], void>({
      query: () => "/booking/requests",
      providesTags: ["Bookings"],
    }),
    getAdminBookingRequests: builder.query<any[], void>({
      query: () => "/booking/admin/requests",
      providesTags: ["Bookings"],
    }),
    respondToBookingRequest: builder.mutation<any, { requestId: string; decision: 'approve' | 'reject'; scheduledAt?: string; durationMinutes?: number; comment?: string }>({
      query: ({ requestId, ...body }) => ({
        url: `/booking/admin/requests/${requestId}/respond`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Bookings"],
    }),
    ingestRagDocument: builder.mutation<any, { text: string; fileName?: string; sourceType?: string; visibility?: string; mentorId?: string; sourceId?: string }>({
      query: (body) => ({
        url: "/api/rag/ingest",
        method: "POST",
        body,
      }),
      invalidatesTags: ["RagChunks" as any, "RagDocuments" as any],
    }),
    queryRag: builder.mutation<any, { query: string; mentorId?: string; generateAnswer?: boolean }>({
      query: (body) => ({
        url: "/api/rag/query",
        method: "POST",
        body,
      }),
    }),
    getRagChunks: builder.query<{ chunks: any[]; count: number }, { mentorId?: string }>({
      query: ({ mentorId }) => ({
        url: "/api/rag/chunks",
        params: mentorId ? { mentorId } : undefined,
      }),
      providesTags: ["RagChunks" as any],
    }),
    deleteRagChunk: builder.mutation<any, { id: string; mentorId?: string }>({
      query: ({ id, mentorId }) => ({
        url: `/api/rag/chunks/${id}`,
        method: "DELETE",
        params: mentorId ? { mentorId } : undefined,
      }),
      invalidatesTags: ["RagChunks" as any],
    }),
    getRagDrafts: builder.query<{ drafts: any[] }, { mentorId?: string }>({
      query: ({ mentorId }) => ({
        url: "/api/rag/drafts",
        params: mentorId ? { mentorId } : undefined,
      }),
      providesTags: ["RagDrafts" as any],
    }),
    getRagDocuments: builder.query<{ documents: any[] }, { mentorId?: string }>({
      query: ({ mentorId }) => ({
        url: "/api/rag/documents",
        params: mentorId ? { mentorId } : undefined,
      }),
      providesTags: ["RagDocuments" as any],
    }),
    deleteRagDocument: builder.mutation<any, { id: string; mentorId?: string }>({
      query: ({ id, mentorId }) => ({
        url: `/api/rag/documents/${id}`,
        method: "DELETE",
        params: mentorId ? { mentorId } : undefined,
      }),
      invalidatesTags: ["RagDocuments" as any, "RagChunks" as any],
    }),
  }),
});

export const {
  useGetModulesQuery,
  useGetMyProfileQuery,
  useSaveProfileMutation,
  useGenerateTestMutation,
  useGetTestHistoryQuery,
  useGetTestDetailsQuery,
  useSubmitTestMutation,
  useGenerateSkillSummaryMutation,
  useGetSkillSummaryDetailsQuery,
  useGenerateRoadmapMutation,
  useGetRoadmapDetailsQuery,
  useAbandonRoadmapMutation,
  useSubmitTaskMutation,
  useGetTaskSubmissionsQuery,
  useReviewSubmissionMutation,
  useGetPendingSubmissionsQuery,
  useGetCertificateDetailsQuery,
  useGetProgressQuery,
  useGetAllUsersQuery,
  useBlockUserMutation,
  useUnblockUserMutation,
  useBookMentorCallMutation,
  useAnalyzeCvMutation,
  useUploadCvMutation,
  useResumeRoadmapMutation,
  useCreateBookingRequestMutation,
  useGetUserBookingRequestsQuery,
  useGetAdminBookingRequestsQuery,
  useRespondToBookingRequestMutation,
  useIngestRagDocumentMutation,
  useQueryRagMutation,
  useGetRagChunksQuery,
  useDeleteRagChunkMutation,
  useGetRagDraftsQuery,
  useGetRagDocumentsQuery,
  useDeleteRagDocumentMutation,
} = learningApi;

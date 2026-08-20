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
  tagTypes: ["Profile", "Modules", "Tests", "Roadmaps", "Submissions", "Progress", "Certificates"],
  endpoints: (builder) => ({
    getModules: builder.query<Module[], void>({
      query: () => "/modules",
      providesTags: ["Modules"],
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
    submitTask: builder.mutation<{ message: string; submission: Submission }, { taskId: string; content: string }>({
      query: ({ taskId, content }) => ({
        url: `/tasks/${taskId}/submit`,
        method: "POST",
        body: { content },
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
  }),
});

export const {
  useGetModulesQuery,
  useSaveProfileMutation,
  useGenerateTestMutation,
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
} = learningApi;

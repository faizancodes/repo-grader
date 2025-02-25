import type { CodeAnalysisResponse } from "@/utils/analyzeCode";
import type { QuestionsResult } from "@/utils/generateQuestions";

export type JobStatus = "pending" | "processing" | "completed" | "failed";

export interface Job {
  id: string;
  userId: string;
  status: JobStatus;
  url: string;
  createdAt: string;
  updatedAt: string;
  result?: CodeAnalysisResponse | QuestionsResult;
  error?: string;
}

export interface JobCreationResponse {
  jobId: string;
  status: JobStatus;
}

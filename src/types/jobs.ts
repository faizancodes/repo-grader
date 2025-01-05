import type { CodeAnalysisResponse } from "@/utils/analyzeCode";

export type JobStatus = "pending" | "processing" | "completed" | "failed";

export interface Job {
  id: string;
  userId: string;
  status: JobStatus;
  url: string;
  createdAt: string;
  updatedAt: string;
  result?: CodeAnalysisResponse;
  error?: string;
}

export interface JobCreationResponse {
  jobId: string;
  status: JobStatus;
}

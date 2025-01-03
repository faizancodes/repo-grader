"use server";

import { isValidGitHubUrl } from "@/utils/github";
import { Logger } from "@/utils/logger";
import { KVStorage } from "@/utils/kv-storage";
import type { Job } from "@/types/jobs";

const logger = new Logger("Server Action: AnalyzeRepo");

export async function analyzeRepository(url: string): Promise<{
  error?: string;
  jobId?: string;
}> {
  try {
    if (!url || !isValidGitHubUrl(url)) {
      logger.error("Invalid GitHub repository URL", { url });
      return { error: "Invalid GitHub repository URL" };
    }

    // Create a new job
    const job = await KVStorage.createJob(url);

    // Trigger the analysis process
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId: job.id }),
    }).catch(error => {
      logger.error("Failed to trigger analysis job:", error);
    });

    return { jobId: job.id };
  } catch (error) {
    logger.error("Error creating analysis job:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to start analysis";
    return { error: errorMessage };
  }
}

export async function getAnalysisStatus(jobId: string): Promise<{
  error?: string;
  job?: Job;
}> {
  try {
    const job = await KVStorage.getJob(jobId);
    if (!job) {
      return { error: "Analysis job not found" };
    }
    return { job };
  } catch (error) {
    logger.error("Error fetching analysis status:", error);
    return { error: "Failed to fetch analysis status" };
  }
}

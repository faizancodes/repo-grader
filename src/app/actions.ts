"use server";

import { isValidGitHubUrl } from "@/utils/github";
import { Logger } from "@/utils/logger";
import { KVStorage } from "@/utils/kv-storage";
import type { Job } from "@/types/jobs";
import { fetchRepositoryContents } from "@/utils/github";
import { analyzeCode } from "@/utils/analyzeCode";
import { getUserId } from "@/utils/session";

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

    const userId = await getUserId();

    // Create a new job
    const job = await KVStorage.createJob(url, userId);

    // Start analysis in the background
    (async () => {
      try {
        // Update job status to processing
        await KVStorage.updateJob(job.id, { status: "processing" });

        // Fetch repository contents
        const files = await fetchRepositoryContents(url);

        // Analyze code
        const analysis = await analyzeCode(files);

        // Update job with results
        await KVStorage.updateJob(job.id, {
          status: "completed",
          result: analysis,
        });
      } catch (error) {
        logger.error("Analysis failed:", error);
        // Update job with error
        await KVStorage.updateJob(job.id, {
          status: "failed",
          error: error instanceof Error ? error.message : "Analysis failed",
        });
      }
    })().catch(error => {
      logger.error("Background analysis failed:", error);
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
    const userId = await getUserId();
    const job = await KVStorage.getJob(jobId);

    if (!job) {
      return { error: "Analysis job not found" };
    }

    // Only return the job if it belongs to the current user
    if (job.userId !== userId) {
      return { error: "Analysis job not found" };
    }

    return { job };
  } catch (error) {
    logger.error("Error fetching analysis status:", error);
    return { error: "Failed to fetch analysis status" };
  }
}

export async function listJobs(): Promise<{
  error?: string;
  jobs?: Job[];
}> {
  try {
    logger.info("Starting to list jobs");
    const userId = await getUserId();
    const jobs = await KVStorage.listJobsForUser(userId);
    logger.info("Successfully listed jobs for user", {
      userId,
      count: jobs.length,
    });
    return { jobs };
  } catch (error) {
    logger.error("Error listing jobs:", error);
    return { error: "Failed to fetch analysis history" };
  }
}

export async function testKVConnection(): Promise<{
  error?: string;
  success?: boolean;
}> {
  try {
    logger.info("Testing KV storage connection");
    const isConnected = await KVStorage.testConnection();
    if (!isConnected) {
      return { error: "Failed to connect to KV storage" };
    }
    return { success: true };
  } catch (error) {
    logger.error("Error testing KV connection:", error);
    return { error: "Failed to test KV connection" };
  }
}

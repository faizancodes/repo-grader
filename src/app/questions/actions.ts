"use server";

import { isValidGitHubUrl } from "@/utils/github";
import { Logger } from "@/utils/logger";
import { KVStorage } from "@/utils/kv-storage";
import type { Job } from "@/types/jobs";
import { fetchRepositoryContents } from "@/utils/github";
import { generateQuestionsForRepo } from "../../utils/generateQuestions";
import { getUserId } from "@/utils/session";

const logger = new Logger("Server Action: GenerateQuestions");

export async function generateQuestions(url: string): Promise<{
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

    // Start question generation in the background
    (async () => {
      try {
        // Update job status to processing
        await KVStorage.updateJob(job.id, { status: "processing" });

        // Fetch repository contents
        const files = await fetchRepositoryContents(url);

        // Generate questions
        const questionsResult = await generateQuestionsForRepo(files, url);

        // Update job with results
        await KVStorage.updateJob(job.id, {
          status: "completed",
          result: questionsResult,
        });
      } catch (error) {
        logger.error("Question generation failed:", error);
        // Update job with error
        await KVStorage.updateJob(job.id, {
          status: "failed",
          error:
            error instanceof Error
              ? error.message
              : "Question generation failed",
        });
      }
    })().catch(error => {
      logger.error("Background question generation failed:", error);
    });

    return { jobId: job.id };
  } catch (error) {
    logger.error("Error creating question generation job:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to start question generation";
    return { error: errorMessage };
  }
}

export async function getQuestionsStatus(jobId: string): Promise<{
  error?: string;
  job?: Job;
}> {
  try {
    const userId = await getUserId();
    const job = await KVStorage.getJob(jobId);

    if (!job) {
      return { error: "Question generation job not found" };
    }

    // Only return the job if it belongs to the current user
    if (job.userId !== userId) {
      return { error: "Question generation job not found" };
    }

    return { job };
  } catch (error) {
    logger.error("Error fetching question generation status:", error);
    return { error: "Failed to fetch question generation status" };
  }
}

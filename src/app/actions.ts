"use server";

import { isValidGitHubUrl, fetchRepositoryContents } from "@/utils/github";
import { analyzeCode } from "@/utils/analyzeCode";
import type { CodeAnalysisResponse } from "@/utils/analyzeCode";
import { Logger } from "@/utils/logger";

const logger = new Logger("Server Action: AnalyzeRepo");

export async function analyzeRepository(url: string): Promise<{
  error?: string;
  analysis?: CodeAnalysisResponse;
}> {
  try {
    if (!url || !isValidGitHubUrl(url)) {
      logger.error("Invalid GitHub repository URL", { url });
      return { error: "Invalid GitHub repository URL" };
    }

    const files = await fetchRepositoryContents(url);

    logger.info("Read files from repository", {
      files: files.length,
      fileNames: files.map(f => f.path),
    });

    const analysis = await analyzeCode(files);
    return { analysis };
  } catch (error) {
    logger.error("Error processing repository:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to process repository";
    return { error: errorMessage };
  }
}

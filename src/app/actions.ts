"use server";

import { isValidGitHubUrl, cleanGitHubUrl } from "@/utils/github";
import {
  createTempDir,
  removeTempDir,
  readFilesRecursively,
} from "@/utils/file-system";
import { analyzeCode } from "@/utils/analyzeCode";
import type { CodeAnalysisResponse } from "@/utils/analyzeCode";
import { Logger } from "@/utils/logger";
import simpleGit from "simple-git";

const logger = new Logger("Server Action: AnalyzeRepo");

export async function analyzeRepository(url: string): Promise<{
  error?: string;
  analysis?: CodeAnalysisResponse;
}> {
  let tempDir: string | null = null;

  try {
    if (!url || !isValidGitHubUrl(url)) {
      logger.error("Invalid GitHub repository URL", { url });
      return { error: "Invalid GitHub repository URL" };
    }

    tempDir = await createTempDir();
    const cleanedUrl = cleanGitHubUrl(url);
    const git = simpleGit();

    try {
      await git.clone(cleanedUrl, tempDir);
    } catch (gitError) {
      logger.error("Failed to clone repository", { error: gitError });
      return {
        error:
          "Failed to clone repository. Please check the URL and try again.",
      };
    }

    const files = await readFilesRecursively(tempDir);

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
  } finally {
    if (tempDir) {
      await removeTempDir(tempDir);
    }
  }
}

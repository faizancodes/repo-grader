import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { isValidGitHubUrl, cleanGitHubUrl } from "@/utils/github";
import {
  createTempDir,
  removeTempDir,
  readFilesRecursively,
} from "@/utils/file-system";
import type { FileContent } from "@/utils/file-system";
import { analyzeCode } from "@/utils/analyzeCode";
import type { CodeAnalysisResponse } from "@/utils/analyzeCode";
import { Logger } from "@/utils/logger";

const logger = new Logger("API: AnalyzeRepo");

const execAsync = promisify(exec);

interface AnalyzeRepoResponse {
  files?: FileContent[];
  error?: string;
  analysis?: CodeAnalysisResponse;
}

/**
 * Analyzes a GitHub repository by cloning it and reading its contents
 */
export async function POST(
  request: Request
): Promise<NextResponse<AnalyzeRepoResponse>> {
  let tempDir: string | null = null;

  try {
    const { url } = await request.json();

    if (!url || !isValidGitHubUrl(url)) {
      logger.error("Invalid GitHub repository URL", { url });
      return NextResponse.json(
        { error: "Invalid GitHub repository URL" },
        { status: 400 }
      );
    }

    tempDir = await createTempDir();
    const cleanedUrl = cleanGitHubUrl(url);

    await execAsync(`git clone ${cleanedUrl} ${tempDir}`);
    const files = await readFilesRecursively(tempDir);

    logger.info("Read files from repository", {
      files: files.length,
      fileNames: files.map(f => f.path),
    });

    const analysis = await analyzeCode(files);
    return NextResponse.json({ analysis });
  } catch (error) {
    logger.error("Error processing repository:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Failed to process repository";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  } finally {
    if (tempDir) {
      await removeTempDir(tempDir);
    }
  }
}

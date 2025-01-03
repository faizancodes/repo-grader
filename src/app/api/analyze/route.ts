import { NextResponse } from "next/server";
import { fetchRepositoryContents } from "@/utils/github";
import { analyzeCode } from "@/utils/analyzeCode";
import { KVStorage } from "@/utils/kv-storage";
import { Logger } from "@/utils/logger";

const logger = new Logger("AnalyzeAPI");

export async function POST(request: Request) {
  try {
    const { jobId } = await request.json();

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    const job = await KVStorage.getJob(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Update job status to processing
    await KVStorage.updateJob(jobId, { status: "processing" });

    try {
      // Fetch repository contents
      const files = await fetchRepositoryContents(job.url);

      // Analyze code
      const analysis = await analyzeCode(files);

      // Update job with results
      await KVStorage.updateJob(jobId, {
        status: "completed",
        result: analysis,
      });

      return NextResponse.json({ status: "success", jobId });
    } catch (error) {
      // Update job with error
      await KVStorage.updateJob(jobId, {
        status: "failed",
        error: error instanceof Error ? error.message : "Analysis failed",
      });

      throw error;
    }
  } catch (error) {
    logger.error("Failed to process analysis job:", error);
    return NextResponse.json(
      { error: "Failed to process analysis" },
      { status: 500 }
    );
  }
}

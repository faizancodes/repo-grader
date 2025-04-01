import { listJobs, testKVConnection } from "@/app/actions";
import { Job } from "@/types/jobs";
import { CodeAnalysisResponse } from "@/utils/analyzeCode";
import { QuestionsResult } from "@/utils/generateQuestions";
import { AnalysisSidebarClient } from "./analysis-sidebar-client";

// Server Component
export async function AnalysisSidebar() {
  // Fetch data on the server
  const connectionTest = await testKVConnection();
  let jobsData: Job[] = [];
  let error: string | null = null;

  if (connectionTest.error) {
    error = connectionTest.error;
    console.error("KV connection test failed:", connectionTest.error);
  } else {
    try {
      const result = await listJobs();
      if (result.error) {
        error = result.error;
        console.error("Error fetching jobs:", result.error);
      } else if (result.jobs) {
        // Validate job data before setting
        jobsData = result.jobs.filter(job => {
          const isValid = job && job.id && job.url && job.createdAt && job.status;
          if (!isValid) {
            console.warn("Invalid job data:", job);
          }
          return isValid;
        });
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "Failed to fetch jobs";
      console.error("Error in listJobs:", err);
    }
  }

  return <AnalysisSidebarClient initialJobs={jobsData} initialError={error} />;
}

// Function to determine job type based on result structure
export const getJobType = (job: Job): "questions" | "analysis" | null => {
  if (!job.result) return null;

  // Type guard for QuestionsResult
  const isQuestionsResult = (
    result: CodeAnalysisResponse | QuestionsResult
  ): result is QuestionsResult => {
    return (
      "questions" in result &&
      Array.isArray((result as QuestionsResult).questions)
    );
  };

  // Type guard for CodeAnalysisResponse
  const isCodeAnalysisResponse = (
    result: CodeAnalysisResponse | QuestionsResult
  ): result is CodeAnalysisResponse => {
    return "overallFeedback" in result && "issues" in result;
  };

  if (isQuestionsResult(job.result)) {
    return "questions";
  } else if (isCodeAnalysisResponse(job.result)) {
    return "analysis";
  }

  return null;
};
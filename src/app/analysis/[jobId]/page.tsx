import { KVStorage } from "@/utils/kv-storage";
import { AnalysisResults } from "@/components/analysis-results";
import { QuestionsResults } from "@/components/questions-results";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ShareButton } from "@/components/share-button";
import { Button } from "@/components/ui/button";
import { Metadata } from "next";
import type { QuestionsResult } from "@/utils/generateQuestions";
import type { CodeAnalysisIssue } from "@/utils/analyzeCode";

export const maxDuration = 60;

interface PageProps {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const job = await KVStorage.getJob(resolvedParams.jobId);

  if (!job || job.status !== "completed" || !job.result) {
    return {
      title: "Results Not Found",
      description:
        "The results you're looking for don't exist or haven't completed yet.",
    };
  }

  // Extract org and repo name from GitHub URL, handling tree/branch paths
  const pathParts = new URL(job.url).pathname.split("/").filter(Boolean);
  const orgName = pathParts[0];
  const repoName = pathParts[1];

  // If either part is missing, use a fallback
  if (!orgName || !repoName) {
    return {
      title: "Repository Results",
      description: `Results for ${job.url}`,
    };
  }

  const fullRepoName = `${orgName}/${repoName}`;

  // Check if this is a questions result
  if ("questions" in job.result && "repositoryUrl" in job.result) {
    return {
      title: `Questions for ${fullRepoName}`,
      description: `Generated questions for ${job.url}`,
      openGraph: {
        title: `Questions for ${fullRepoName}`,
        description: `Generated questions for ${job.url}`,
        url: `/analysis/${resolvedParams.jobId}`,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `Questions for ${fullRepoName}`,
        description: `Generated questions for ${job.url}`,
      },
    };
  }

  // Default to analysis metadata
  return {
    title: `Code Analysis for ${fullRepoName}`,
    description: `Code quality analysis and improvement suggestions for ${job.url}`,
    openGraph: {
      title: `Code Analysis for ${fullRepoName}`,
      description: `Code quality analysis and improvement suggestions for ${job.url}`,
      url: `/analysis/${resolvedParams.jobId}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `Code Analysis for ${fullRepoName}`,
      description: `Code quality analysis and improvement suggestions for ${job.url}`,
    },
  };
}

export default async function AnalysisPage({ params }: PageProps) {
  const resolvedParams = await params;
  const job = await KVStorage.getJob(resolvedParams.jobId);

  if (!job || job.status !== "completed" || !job.result) {
    notFound();
  }

  // Determine the type of result
  const isQuestionsResult =
    "questions" in job.result && "repositoryUrl" in job.result;
  const isAnalysisResult =
    "issues" in job.result && "overallFeedback" in job.result;

  // If neither type matches, return 404
  if (!isQuestionsResult && !isAnalysisResult) {
    notFound();
  }

  // Type assertions for TypeScript
  const questionsResult = isQuestionsResult
    ? (job.result as QuestionsResult)
    : null;
  const analysisResult = isAnalysisResult
    ? (job.result as { issues: CodeAnalysisIssue[]; overallFeedback: string })
    : null;

  return (
    <div className="flex-1 min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black text-white overflow-auto relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,0.8),rgba(0,0,0,1))] opacity-70" />

      <div className="absolute top-20 -left-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute top-40 -right-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="container relative mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <main className="w-full max-w-4xl mx-auto space-y-8">
          <div className="space-y-4 text-center">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 text-transparent bg-clip-text sm:text-6xl pb-2 tracking-tight">
              {isQuestionsResult ? "Repository Questions" : "Repo Analysis"}
            </h1>
            <p className="text-lg text-gray-400 max-w-[650px] mx-auto flex flex-col items-center gap-2">
              Repository:{" "}
              <a
                href={job.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white bg-gray-800/50 px-4 py-2 rounded-lg hover:bg-gray-700/50 transition-colors break-all text-center border border-gray-700/50 hover:border-gray-600/50"
              >
                {job.url}
              </a>
            </p>
            <div className="pt-4 flex items-center justify-center gap-4">
              <Button
                asChild
                className="gap-2 bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 hover:from-blue-600 hover:via-cyan-600 hover:to-emerald-600 text-black border-0"
              >
                <Link href={isQuestionsResult ? "/questions" : "/"}>
                  {isQuestionsResult
                    ? "Generate More Questions"
                    : "Analyze Another Repository"}
                </Link>
              </Button>
              <ShareButton jobId={resolvedParams.jobId} />
            </div>
          </div>

          {analysisResult && (
            <AnalysisResults
              issues={analysisResult.issues}
              overallFeedback={analysisResult.overallFeedback}
              repoUrl={job.url}
            />
          )}

          {questionsResult && (
            <QuestionsResults
              questions={questionsResult.questions}
              repositoryUrl={questionsResult.repositoryUrl}
              generatedAt={questionsResult.generatedAt}
            />
          )}
        </main>
      </div>
    </div>
  );
}

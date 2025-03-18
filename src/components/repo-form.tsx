"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { GitHubLogoIcon, UpdateIcon } from "@radix-ui/react-icons";
import { AnalysisResults } from "./analysis-results";
import type { CodeAnalysisResponse } from "@/utils/analyzeCode";
import { analyzeRepository, getAnalysisStatus } from "@/app/actions";
import { useJobsStore } from "@/stores/jobs";

function LoadingSkeleton() {
  return (
    <div className="backdrop-blur-xl bg-gradient-to-b from-white/[0.07] to-transparent rounded-2xl border border-white/[0.1] shadow-[0_0_1px_1px_rgba(0,0,0,0.3)]">
      <div className="space-y-8 p-8">
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-gradient-to-r from-white/10 to-white/5 rounded-lg animate-pulse" />
              <div className="h-4 w-32 bg-gradient-to-r from-white/5 to-transparent rounded-lg animate-pulse" />
            </div>
            <div className="flex gap-2">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="h-8 w-24 bg-gradient-to-r from-white/5 to-transparent rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
          </div>

          <div className="relative p-6 bg-black/40 rounded-xl border border-white/[0.08]">
            <div className="space-y-3">
              <div className="h-4 w-32 bg-gradient-to-r from-white/10 to-transparent rounded-lg animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-gradient-to-r from-white/5 to-transparent rounded-lg animate-pulse" />
                <div className="h-4 w-3/4 bg-gradient-to-r from-white/5 to-transparent rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="p-6 border border-white/[0.08] rounded-xl bg-black/40"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="h-5 w-48 bg-gradient-to-r from-white/10 to-transparent rounded-lg animate-pulse" />
                  <div className="h-4 w-32 bg-gradient-to-r from-white/5 to-transparent rounded-lg animate-pulse" />
                </div>
                <div className="h-5 w-5 bg-gradient-to-r from-white/10 to-transparent rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const POLL_INTERVAL = 2000; // 2 seconds
const MAX_POLL_TIME = 5 * 60 * 1000; // 5 minutes

export function RepoForm() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<CodeAnalysisResponse | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { addJob, updateJob } = useJobsStore();

  // Cleanup polling on component unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, []);

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnalysis(null);
    setJobId(null);

    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Please enter a GitHub repository URL",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      stopPolling();

      const result = await analyzeRepository(url);

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.jobId) {
        setJobId(result.jobId);

        // Get initial job status to add to store
        const initialStatus = await getAnalysisStatus(result.jobId);
        if (initialStatus.job) {
          addJob(initialStatus.job);
        }

        // Set a timeout to stop polling after MAX_POLL_TIME
        pollTimeoutRef.current = setTimeout(() => {
          stopPolling();
          setIsLoading(false);
          toast({
            title: "Error",
            description: "Analysis timed out. Please try again.",
            variant: "destructive",
          });
        }, MAX_POLL_TIME);

        // Start polling for job status
        pollIntervalRef.current = setInterval(async () => {
          try {
            const status = await getAnalysisStatus(result.jobId!);

            if (status.error) {
              stopPolling();
              setIsLoading(false);
              throw new Error(status.error);
            }

            if (status.job?.status === "completed" && status.job.result) {
              stopPolling();
              setIsLoading(false);
              // Type guard to ensure we're dealing with CodeAnalysisResponse
              const isAnalysisResult = "issues" in status.job.result;
              if (isAnalysisResult) {
                const analysisResult = status.job
                  .result as CodeAnalysisResponse;
                setAnalysis(analysisResult);

                // Update the jobs store with the completed job
                updateJob(result.jobId!, {
                  status: "completed",
                  result: status.job.result,
                });

                toast({
                  title: "Analysis Complete",
                  description:
                    analysisResult.issues?.length > 0
                      ? `Found ${analysisResult.issues.length} issues to review`
                      : "No issues found in the repository",
                  variant:
                    analysisResult.issues?.length > 0 ? "info" : "success",
                });
              } else {
                // This is a QuestionsResult, not a CodeAnalysisResponse
                // We don't need to set analysis state for this
                updateJob(result.jobId!, {
                  status: "completed",
                  result: status.job.result,
                });
              }
            } else if (status.job?.status === "failed") {
              stopPolling();
              setIsLoading(false);
              // Update the jobs store with the failed job
              updateJob(result.jobId!, {
                status: "failed",
                error: status.job.error,
              });
              throw new Error(status.job.error || "Analysis failed");
            } else if (status.job) {
              // Update the job in the store with its current status
              updateJob(result.jobId!, status.job);
            }
          } catch (error) {
            stopPolling();
            setIsLoading(false);
            toast({
              title: "Error",
              description:
                error instanceof Error
                  ? error.message
                  : "Failed to check analysis status",
              variant: "destructive",
            });
          }
        }, POLL_INTERVAL);
      }
    } catch (error) {
      stopPolling();
      setIsLoading(false);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to analyze repository",
        variant: "destructive",
      });
    }
  };

  const handleShare = () => {
    if (!jobId) return;

    const shareUrl = `${window.location.origin}/analysis/${jobId}`;
    navigator.clipboard.writeText(shareUrl);
    
    // Set copied state to true
    setIsCopied(true);
    
    // Reset after 2 seconds
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
    
    toast({
      title: "Link Copied!",
      description: "Share this link with others to view the analysis results",
    });
  };

  return (
    <div className="space-y-8 pb-8">
      <div className="backdrop-blur-xl bg-gradient-to-b from-white/[0.07] to-transparent rounded-2xl border border-white/[0.1] shadow-[0_0_1px_1px_rgba(0,0,0,0.3)] transition-all">
        <form onSubmit={handleSubmit} className="space-y-6 p-8">
          <div className="space-y-4">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-transform duration-200 group-focus-within:scale-110">
                <GitHubLogoIcon className="w-5 h-5" />
              </div>
              <Input
                type="url"
                placeholder="Enter GitHub repository URL"
                value={url}
                onChange={e => setUrl(e.target.value)}
                disabled={isLoading}
                className="pl-12 h-14 bg-black/40 border-white/[0.08] text-white placeholder:text-gray-400 rounded-xl transition-colors focus:border-white/20 focus:ring-1 focus:ring-white/20"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 hover:from-blue-600 hover:via-cyan-600 hover:to-emerald-600 text-white font-medium rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <UpdateIcon className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing Repository...
                </>
              ) : (
                "Analyze Repository"
              )}
            </Button>
          </div>
        </form>
      </div>

      {isLoading && <LoadingSkeleton />}

      {analysis && jobId && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              {isCopied ? "Link Copied!" : "Share Results"}
            </button>
          </div>
          <AnalysisResults
            issues={analysis.issues}
            overallFeedback={analysis.overallFeedback}
            repoUrl={url}
          />
        </div>
      )}
    </div>
  );
}

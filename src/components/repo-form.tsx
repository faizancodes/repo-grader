"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { GitHubLogoIcon, UpdateIcon } from "@radix-ui/react-icons";
import { AnalysisResults } from "./analysis-results";
import type { CodeAnalysisResponse } from "@/utils/analyzeCode";
import { analyzeRepository, getAnalysisStatus } from "@/app/actions";

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
  const { toast } = useToast();
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
              setAnalysis(status.job.result);

              toast({
                title: "Analysis Complete",
                description:
                  status.job.result.issues?.length > 0
                    ? `Found ${status.job.result.issues.length} issues to review`
                    : "No issues found in the repository",
                variant:
                  status.job.result.issues?.length > 0 ? "info" : "success",
              });
            } else if (status.job?.status === "failed") {
              stopPolling();
              setIsLoading(false);
              throw new Error(status.job.error || "Analysis failed");
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

      {analysis && (
        <AnalysisResults
          issues={analysis.issues}
          overallFeedback={analysis.overallFeedback}
        />
      )}
    </div>
  );
}

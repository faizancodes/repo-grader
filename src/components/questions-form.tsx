"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import {
  generateQuestions,
  getQuestionsStatus,
} from "../app/questions/actions";
import { useJobsStore } from "@/stores/jobs";
import type { QuestionsResult } from "@/utils/generateQuestions";

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

export function QuestionsForm() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<QuestionsResult | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const { toast } = useToast();
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { addJob, updateJob } = useJobsStore();
  const [shareButtonText, setShareButtonText] = useState("Share Results");

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
    setQuestions(null);
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

      const result = await generateQuestions(url);

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.jobId) {
        setJobId(result.jobId);

        // Get initial job status to add to store
        const initialStatus = await getQuestionsStatus(result.jobId);
        if (initialStatus.job) {
          addJob(initialStatus.job);
        }

        // Set a timeout to stop polling after MAX_POLL_TIME
        pollTimeoutRef.current = setTimeout(() => {
          stopPolling();
          setIsLoading(false);
          toast({
            title: "Error",
            description: "Question generation timed out. Please try again.",
            variant: "destructive",
          });
        }, MAX_POLL_TIME);

        // Start polling for job status
        pollIntervalRef.current = setInterval(async () => {
          try {
            const status = await getQuestionsStatus(result.jobId!);

            if (status.error) {
              stopPolling();
              setIsLoading(false);
              throw new Error(status.error);
            }

            if (status.job?.status === "completed" && status.job.result) {
              stopPolling();
              setIsLoading(false);
              setQuestions(status.job.result as QuestionsResult);
              // Update the jobs store with the completed job
              updateJob(result.jobId!, {
                status: "completed",
                result: status.job.result,
              });

              toast({
                title: "Questions Generated",
                description:
                  "Successfully generated questions for your repository",
                variant: "success",
              });
            } else if (status.job?.status === "failed") {
              stopPolling();
              setIsLoading(false);
              // Update the jobs store with the failed job
              updateJob(result.jobId!, {
                status: "failed",
                error: status.job.error,
              });
              throw new Error(status.job.error || "Question generation failed");
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
                  : "Failed to check question generation status",
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
            : "Failed to generate questions",
        variant: "destructive",
      });
    }
  };

  const handleShare = () => {
    if (!jobId) return;

    const shareUrl = `${window.location.origin}/questions/${jobId}`;
    navigator.clipboard.writeText(shareUrl);

    // Change button text
    setShareButtonText("Link Copied!");

    // Reset button text after 2 seconds
    setTimeout(() => {
      setShareButtonText("Share Results");
    }, 2000);

    toast({
      title: "Link Copied!",
      description:
        "Share this link with others to view the generated questions",
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
              {isLoading ? "Generating Questions..." : "Generate Questions"}
            </Button>
          </div>
        </form>
      </div>

      {isLoading && <LoadingSkeleton />}

      {questions && (
        <div className="backdrop-blur-xl bg-gradient-to-b from-white/[0.07] to-transparent rounded-2xl border border-white/[0.1] shadow-[0_0_1px_1px_rgba(0,0,0,0.3)]">
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 text-transparent bg-clip-text">
                Generated Questions
              </h2>
              <Button
                onClick={handleShare}
                variant="outline"
                className="border-white/10 bg-black/30 text-white hover:bg-black/50 hover:text-white"
              >
                {shareButtonText}
              </Button>
            </div>

            <div className="p-4 bg-black/20 border border-white/10 rounded-xl space-y-2">
              <div className="flex items-center gap-2">
                <GitHubLogoIcon className="w-5 h-5 text-gray-400" />
                <a
                  href={questions.repositoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                >
                  {questions.repositoryUrl}
                </a>
              </div>
              <p className="text-gray-400 text-sm">
                Generated on {new Date(questions.generatedAt).toLocaleString()}
              </p>
            </div>

            <div className="space-y-4">
              {questions.questions?.map((question: string, index: number) => (
                <div
                  key={index}
                  className="p-4 bg-black/30 border border-white/10 rounded-xl"
                >
                  <p className="text-white">{question}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

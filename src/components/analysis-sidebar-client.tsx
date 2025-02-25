"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useJobsStore } from "@/stores/jobs";
import { Job } from "@/types/jobs";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  HelpCircle,
  Code,
  FileQuestion,
} from "lucide-react";
import { getJobType } from "./analysis-sidebar";

interface AnalysisSidebarClientProps {
  initialJobs: Job[];
  initialError: string | null;
}

export function AnalysisSidebarClient({
  initialJobs,
  initialError,
}: AnalysisSidebarClientProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoading, setIsLoading] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(initialError);
  const [isOpen, setIsOpen] = useState(false); // Start closed on mobile

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { toast } = useToast();
  const { jobs, setJobs } = useJobsStore();

  // Initialize jobs from server data
  useEffect(() => {
    setJobs(initialJobs);
  }, [initialJobs, setJobs]);

  const formatGithubUrl = (url: string) =>
    url.replace("https://github.com/", "");

  const sidebarContent = (
    <div className="space-y-2">
      {jobs.length === 0 ? (
        <div className="p-4 rounded-lg bg-gray-800/30 border border-gray-700/30">
          <p className="text-sm text-gray-400">No analyses yet</p>
        </div>
      ) : (
        jobs.map(job => (
          <Link
            key={job.id}
            href={`/analysis/${job.id}`}
            className={cn(
              "block p-3 rounded-lg hover:bg-gray-800/50 transition-colors border border-gray-800/50 hover:border-gray-700/50",
              job.status === "completed"
                ? "bg-gray-800/30"
                : job.status === "failed"
                  ? "bg-red-900/20 border-red-800/30"
                  : "bg-gray-800/20"
            )}
          >
            <div className="truncate text-sm text-white">
              {formatGithubUrl(job.url)}
            </div>
            <div className="flex items-center justify-between gap-2 mt-1">
              <div className="flex flex-wrap items-center gap-2">
                <div
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    job.status === "completed"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : job.status === "failed"
                        ? "bg-red-500/20 text-red-300"
                        : job.status === "processing"
                          ? "bg-blue-500/20 text-blue-300"
                          : "bg-gray-500/20 text-gray-300"
                  )}
                >
                  {job.status}
                </div>
                {job.status === "completed" && (
                  <div className="flex items-center gap-1">
                    {getJobType(job) === "questions" ? (
                      <div className="flex items-center text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                        <FileQuestion className="h-3 w-3 mr-1" />
                        <span>Questions</span>
                      </div>
                    ) : getJobType(job) === "analysis" ? (
                      <div className="flex items-center text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                        <Code className="h-3 w-3 mr-1" />
                        <span>Analysis</span>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-400 shrink-0">
                {new Date(job.createdAt).toLocaleDateString()}
              </div>
            </div>
          </Link>
        ))
      )}
    </div>
  );

  const sidebarClasses = cn(
    "fixed md:sticky top-0 left-0 h-full md:h-screen bg-gray-900/50 border-r border-gray-800 transition-all duration-300 ease-in-out z-30",
    "flex flex-col",
    isOpen ? "w-80 translate-x-0" : "-translate-x-full md:translate-x-0 md:w-16"
  );

  const overlayClasses = cn(
    "fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity duration-300",
    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
  );

  const mainContent = (
    <div className={sidebarClasses}>
      {/* Sidebar content */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Header section */}
        <div className="flex flex-col gap-4">
          {/* Toggle and title row */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
            >
              {isOpen ? (
                <ChevronLeft className="h-5 w-5 text-white" />
              ) : (
                <ChevronRight className="h-5 w-5 text-white" />
              )}
            </button>

            {/* Title - only show when open */}
            {isOpen && (
              <h2 className="text-lg font-semibold text-white flex-1">
                Analysis History
              </h2>
            )}
          </div>

          {/* Action buttons */}
          {isOpen ? (
            <div className="flex flex-col gap-2">
              <Button variant="outline" asChild>
                <Link href="/" className="w-full">
                  Analyze new Repo
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/questions" className="w-full">
                  Generate Questions
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="icon" asChild className="w-8 h-8">
                <Link href="/">
                  <Home className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="icon" asChild className="w-8 h-8">
                <Link href="/questions">
                  <HelpCircle className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Main content - only show when open */}
        {isOpen && <div className="space-y-4">{sidebarContent}</div>}
      </div>
    </div>
  );

  // Loading and error states
  if (isLoading || error) {
    return (
      <div className={sidebarClasses}>
        <div className="flex-1 p-4 space-y-4">
          {/* Header with toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
            >
              {isOpen ? (
                <ChevronLeft className="h-5 w-5 text-white" />
              ) : (
                <ChevronRight className="h-5 w-5 text-white" />
              )}
            </button>

            {isOpen && (
              <h2 className="text-lg font-semibold text-white flex-1">
                Analysis History
              </h2>
            )}
          </div>

          {/* Loading or error content
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="h-16 bg-gray-800/50 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-red-900/20 border border-red-800/30">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )} */}

          {/* Add action buttons in loading/error state too */}
          {isOpen ? (
            <div className="flex flex-col gap-2 mt-4">
              <Button variant="outline" asChild>
                <Link href="/" className="w-full">
                  Analyze new Repo
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/questions" className="w-full">
                  Generate Questions
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 mt-4">
              <Button variant="outline" size="icon" asChild className="w-8 h-8">
                <Link href="/">
                  <Home className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="icon" asChild className="w-8 h-8">
                <Link href="/questions">
                  <HelpCircle className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={overlayClasses} onClick={() => setIsOpen(false)} />
      {mainContent}
    </>
  );
}

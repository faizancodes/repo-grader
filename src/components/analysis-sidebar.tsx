"use client";

import { useEffect, useState } from "react";
import { Job } from "@/types/jobs";
import { listJobs, testKVConnection } from "@/app/actions";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

export function AnalysisSidebar() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchJobs() {
      try {
        setIsLoading(true);
        setError(null);
        console.log("Testing KV connection...");

        // First test the connection
        const connectionTest = await testKVConnection();
        if (connectionTest.error) {
          console.error("KV connection test failed:", connectionTest.error);
          setError(connectionTest.error);
          toast({
            title: "Connection Error",
            description: connectionTest.error,
            variant: "destructive",
          });
          return;
        }

        console.log("KV connection successful, fetching jobs...");
        const result = await listJobs();
        console.log("Jobs result:", {
          result,
          jobsArray: result.jobs,
          firstJob: result.jobs?.[0],
          jobCount: result.jobs?.length,
        });

        if (result.error) {
          console.error("Error fetching jobs:", result.error);
          setError(result.error);
          toast({
            title: "Error",
            description: result.error,
            variant: "destructive",
          });
        } else if (result.jobs) {
          // Validate job data before setting
          const validJobs = result.jobs.filter(job => {
            const isValid =
              job && job.id && job.url && job.createdAt && job.status;
            if (!isValid) {
              console.warn("Invalid job data:", job);
            }
            return isValid;
          });
          console.log("Setting valid jobs:", validJobs);
          setJobs(validJobs);
        }
      } catch (error) {
        console.error("Error in fetchJobs:", error);
        const message =
          error instanceof Error
            ? error.message
            : "Failed to fetch analysis history";
        setError(message);
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchJobs();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="w-80 h-screen bg-gray-900/50 border-r border-gray-800 p-4 space-y-4">
        <h2 className="text-lg font-semibold text-white">Analysis History</h2>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="h-16 bg-gray-800/50 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-80 h-screen bg-gray-900/50 border-r border-gray-800 p-4 space-y-4">
        <h2 className="text-lg font-semibold text-white">Analysis History</h2>
        <div className="p-4 rounded-lg bg-red-900/20 border border-red-800/30">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  const formatGithubUrl = (url: string) =>
    url.replace("https://github.com/", "");

  return (
    <div className="w-80 h-screen bg-gray-900/50 border-r border-gray-800 p-4 space-y-4 overflow-auto">
      <h2 className="text-lg font-semibold text-white">Analysis History</h2>
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
              <div className="flex items-center gap-2 mt-1">
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
                <div className="text-xs text-gray-400">
                  {new Date(job.createdAt).toLocaleDateString()}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

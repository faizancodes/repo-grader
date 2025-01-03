"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { GitHubLogoIcon, ReloadIcon } from "@radix-ui/react-icons";
import { AnalysisResults } from "./analysis-results";
import type { CodeAnalysisResponse } from "@/utils/analyzeCode";
import { analyzeRepository } from "@/app/actions";

function LoadingSkeleton() {
  return (
    <div className="backdrop-blur-sm bg-gradient-to-b from-white/5 to-white/[0.02] rounded-xl border border-white/10 shadow-2xl animate-pulse">
      <div className="space-y-8 p-8">
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-white/10 rounded-md" />
              <div className="h-4 w-32 bg-white/5 rounded-md" />
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 w-24 bg-white/5 rounded-full" />
              ))}
            </div>
          </div>

          <div className="relative p-6 bg-black/20 rounded-lg border border-white/[0.08]">
            <div className="space-y-2">
              <div className="h-4 w-32 bg-white/10 rounded-md" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-white/5 rounded-md" />
                <div className="h-4 w-3/4 bg-white/5 rounded-md" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 border border-white/10 rounded-lg bg-white/5">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="h-5 w-48 bg-white/10 rounded-md" />
                  <div className="h-4 w-32 bg-white/5 rounded-md" />
                </div>
                <div className="h-5 w-5 bg-white/10 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const maxDuration = 60;

export function RepoForm() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<CodeAnalysisResponse | null>(null);
  const { toast } = useToast();

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
      const result = await analyzeRepository(url);

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.analysis) {
        setAnalysis(result.analysis);

        if (result.analysis.issues?.length > 0) {
          toast({
            title: "Analysis Complete",
            description: `Found ${result.analysis.issues.length} issues to review`,
            variant: "info",
          });
        } else {
          toast({
            title: "Analysis Complete",
            description: "No issues found in the repository",
            variant: "success",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to analyze repository",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-8">
      <div className="backdrop-blur-sm bg-white/5 rounded-lg border border-gray-800">
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <GitHubLogoIcon className="w-5 h-5" />
              </div>
              <Input
                type="url"
                placeholder="Enter GitHub repository URL"
                value={url}
                onChange={e => setUrl(e.target.value)}
                disabled={isLoading}
                className="pl-10 h-12 bg-gray-900/50 border-gray-800 text-white placeholder:text-gray-400"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white"
            >
              {isLoading ? (
                <>
                  <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
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

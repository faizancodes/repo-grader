"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { GitHubLogoIcon, ReloadIcon } from "@radix-ui/react-icons";

export function RepoForm() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      const response = await fetch("/api/analyze-repo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to analyze repository");
      }

      const data = await response.json();
      toast({
        title: "Success",
        description: `Successfully analyzed repository with ${data.files.length} files`,
      });

      console.log("Repository files:", data.files);
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
    <form
      onSubmit={handleSubmit}
      className="space-y-4 backdrop-blur-sm bg-white/5 p-6 rounded-lg border border-gray-800"
    >
      <div className="space-y-4">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <GitHubLogoIcon className="w-5 h-5" />
          </div>
          <Input
            type="url"
            placeholder="Enter GitHub repository URL (e.g., https://github.com/user/repo)"
            value={url}
            onChange={e => setUrl(e.target.value)}
            disabled={isLoading}
            className="pl-10 bg-gray-900/50 border-gray-800 text-white placeholder:text-gray-400"
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
  );
}

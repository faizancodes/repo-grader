"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

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

      // Handle the response data here
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Input
          type="url"
          placeholder="Enter GitHub repository URL (e.g., https://github.com/user/repo)"
          value={url}
          onChange={e => setUrl(e.target.value)}
          disabled={isLoading}
          className="w-full"
        />
      </div>
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Analyzing Repository..." : "Analyze Repository"}
      </Button>
    </form>
  );
}

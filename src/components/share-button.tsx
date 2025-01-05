"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Link2Icon } from "@radix-ui/react-icons";

interface ShareButtonProps {
  jobId: string;
}

export function ShareButton({ jobId }: ShareButtonProps) {
  const { toast } = useToast();

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/analysis/${jobId}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link Copied!",
      description: "Share this link with others to view the analysis results",
      variant: "success",
    });
  };

  return (
    <Button
      onClick={handleShare}
      className="gap-2 bg-gray-800/50 text-white border border-gray-700/50 hover:bg-gray-700/50 hover:border-gray-600/50"
    >
      <Link2Icon className="h-4 w-4" />
      Share Results
    </Button>
  );
}

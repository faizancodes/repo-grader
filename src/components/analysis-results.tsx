"use client";

import { useState } from "react";
import { CodeAnalysisIssue } from "@/utils/analyzeCode";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import { Highlight, themes, type Language } from "prism-react-renderer";

function formatCode(code: string) {
  if (!code) return "";

  return code
    .split("\n")
    .map(line => line.trimEnd()) // Only trim trailing spaces
    .filter(line => line.length > 0) // Remove empty lines
    .join("\n");
}

function CodeBlock({
  code,
  language = "typescript",
}: {
  code: string;
  language?: Language;
}) {
  const formattedCode = formatCode(code);

  return (
    <div className="relative w-full">
      <Highlight
        theme={themes.nightOwl}
        code={formattedCode}
        language={language}
      >
        {({ style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className="text-sm p-3 rounded-md overflow-x-auto max-w-[800px]"
            style={{ ...style, margin: 0 }}
          >
            <code>
              {tokens.map((line, lineIdx) => (
                <div
                  key={lineIdx}
                  {...getLineProps({ line })}
                  className="whitespace-pre"
                >
                  {line.map((token, tokenIdx) => (
                    <span key={tokenIdx} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </code>
          </pre>
        )}
      </Highlight>
    </div>
  );
}

interface AnalysisResultsProps {
  issues: CodeAnalysisIssue[];
  overallFeedback: string;
}

const severityColors = {
  Critical: "bg-red-500/10 border-red-500/20 text-red-500",
  High: "bg-orange-500/10 border-orange-500/20 text-orange-500",
  Medium: "bg-yellow-500/10 border-yellow-500/20 text-yellow-500",
  Low: "bg-blue-500/10 border-blue-500/20 text-blue-500",
};

function IssueCard({ issue }: { issue: CodeAnalysisIssue }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={cn(
        "group rounded-lg border transition-all duration-200",
        severityColors[issue.severity],
        isExpanded ? "ring-1 ring-white/10" : "hover:ring-1 hover:ring-white/10"
      )}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left"
      >
        <div className="p-4 flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="font-medium truncate">{issue.category}</div>
              <div
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-medium",
                  severityColors[issue.severity],
                  "bg-opacity-20 border-opacity-20"
                )}
              >
                {issue.severity}
              </div>
            </div>
            <div className="text-sm text-gray-400 truncate">
              {issue.fileLocation}
            </div>
          </div>
          <ChevronDownIcon
            className={cn(
              "h-5 w-5 flex-none transition-transform duration-200",
              isExpanded ? "transform rotate-180" : ""
            )}
          />
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/10 overflow-hidden">
          <div className="pt-4">
            <div className="text-sm font-medium mb-2">Issue</div>
            <div className="text-sm text-gray-300 break-words">
              {issue.explanation}
            </div>
          </div>

          {issue.codeSnippet && (
            <div className="w-full">
              <div className="text-sm font-medium mb-2">Code Snippet</div>
              <div className="max-w-full overflow-hidden rounded-md">
                <CodeBlock
                  code={issue.codeSnippet}
                  language={
                    issue.fileLocation?.toLowerCase().endsWith(".py")
                      ? "python"
                      : "typescript"
                  }
                />
              </div>
            </div>
          )}

          <div>
            <div className="text-sm font-medium mb-2">Recommendation</div>
            <div className="text-sm text-gray-300">{issue.recommendation}</div>
          </div>

          {issue.codeExample && (
            <div className="w-full">
              <div className="text-sm font-medium mb-2">Example Fix</div>
              <div className="max-w-full overflow-hidden rounded-md">
                <CodeBlock
                  code={issue.codeExample}
                  language={
                    issue.fileLocation?.toLowerCase().endsWith(".py")
                      ? "python"
                      : "typescript"
                  }
                />
              </div>
            </div>
          )}

          <div>
            <div className="text-sm font-medium mb-2">Impact</div>
            <div className="text-sm text-gray-300">{issue.impact}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export function AnalysisResults({
  issues,
  overallFeedback,
}: AnalysisResultsProps) {
  if (!issues?.length) return null;

  const issuesBySeverity = issues.reduce(
    (acc, issue) => {
      const severity = issue.severity;
      if (!acc[severity]) acc[severity] = [];
      acc[severity].push(issue);
      return acc;
    },
    {} as Record<string, CodeAnalysisIssue[]>
  );

  return (
    <div className="backdrop-blur-sm bg-gradient-to-b from-white/5 to-white/[0.02] rounded-xl border border-white/10 shadow-2xl">
      <div className="space-y-8 p-8">
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                Analysis Results
              </h2>
              <p className="text-sm text-gray-400 font-medium">
                Found <span className="text-white">{issues.length}</span> issues
                to review
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {Object.entries(severityColors).map(([severity, colors]) => (
                <div
                  key={severity}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-full",
                    colors.split(" ")[0],
                    "border",
                    colors.split(" ")[1]
                  )}
                >
                  <div className={cn("w-2 h-2 rounded-full bg-current")} />
                  <span className="font-medium">
                    {severity}
                    {issuesBySeverity[severity]?.length > 0 &&
                      ` (${issuesBySeverity[severity].length})`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative p-6 bg-black/20 rounded-lg border border-white/[0.08] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-30" />
            <div className="relative">
              <div className="text-sm font-medium mb-2 text-white/70">
                Overall Feedback
              </div>
              <p className="text-base text-gray-300 leading-relaxed">
                {overallFeedback}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          {Object.entries(issuesBySeverity)
            .sort(([a], [b]) => {
              const order = ["Critical", "High", "Medium", "Low"];
              return order.indexOf(a) - order.indexOf(b);
            })
            .map(([severity, severityIssues]) => (
              <div key={severity} className="space-y-2">
                {severityIssues.map((issue, index) => (
                  <IssueCard key={index} issue={issue} />
                ))}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

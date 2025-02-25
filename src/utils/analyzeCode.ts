import { FileContent, formatFileContent } from "./file-system";
import { getGeminiResponse, Message } from "./geminiClient";
import { getPromptForCategory } from "../config/prompts";
import { Logger } from "./logger";
import { determineProjectType } from "./getProjectType";

const logger = new Logger("CodeAnalyzer");

export interface CodeAnalysisIssue {
  category: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  fileLocation: string;
  codeSnippet: string;
  explanation: string;
  recommendation: string;
  codeExample: string;
  impact: string;
}

export interface CategoryAnalysisResponse {
  issues: CodeAnalysisIssue[];
}

export interface CodeAnalysisResponse {
  overallFeedback: string;
  issues: CodeAnalysisIssue[];
}

export interface CodeAnalysisQuestion {
  questions: {
    question: string;
  }[];
}

interface CategoryGroup {
  name: CategoryGroupName;
  categories: string[];
}

type CategoryGroupName =
  | "Architecture and State"
  | "Performance and Data"
  | "Types and Security"
  | "Testing and Style";

const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    name: "Architecture and State",
    categories: [
      "Architecture & Component Design",
      "State Management & Data Flow",
    ],
  },
  {
    name: "Performance and Data",
    categories: ["Performance Optimization", "Data Fetching & API Integration"],
  },
  {
    name: "Types and Security",
    categories: ["TypeScript & Type Safety", "Security & Best Practices"],
  },
  {
    name: "Testing and Style",
    categories: ["Testing & Error Handling", "Code Style & Maintainability"],
  },
];

async function analyzeCodeForCategories(
  files: FileContent[],
  categoryGroup: CategoryGroup,
  projectType: "python" | "react"
): Promise<CategoryAnalysisResponse> {
  const categoryPrompt = getPromptForCategory(categoryGroup.name, projectType);

  const messages: Message[] = [
    { role: "system", content: categoryPrompt },
    {
      role: "user",
      content: `Here is the code from the repository:\n\n${files.map(formatFileContent).join("\n")}`,
    },
  ];

  return getGeminiResponse(messages);
}

async function getOverallFeedback(
  files: FileContent[],
  projectType: "python" | "react",
  issues: CodeAnalysisIssue[]
): Promise<string> {
  logger.info(
    `Getting overall feedback for ${projectType} with ${issues.length} issues`
  );

  const prompt = `You are a Principal Software Engineer reviewing a ${projectType} codebase. Based on the following analysis results, provide a concise overall assessment of the codebase quality, focusing on the most critical issues and patterns.

Analysis Results:
${JSON.stringify(issues, null, 2)}

Provide a 2-3 sentence summary of the key findings and most important areas for improvement.

IMPORTANT: Respond in JSON format with the following properties:
- overallFeedback: <3-4 sentence summary of the key findings and most important areas for improvement>
`;

  const messages: Message[] = [
    { role: "system", content: prompt },
    {
      role: "user",
      content: `Here is the code from the repository:\n\n${files.map(formatFileContent).join("\n")}`,
    },
  ];

  try {
    const response = await getGeminiResponse(messages);
    // If response is a string, return it directly
    if (typeof response === "string") return response;
    // If response has overallFeedback property, return that
    if (response?.overallFeedback) return response.overallFeedback;
    // If response is something else, stringify it
    return JSON.stringify(response);
  } catch (error) {
    logger.error("Error getting overall feedback:", error);
    return "Failed to generate overall feedback.";
  }
}

export async function analyzeCode(
  files: FileContent[]
): Promise<CodeAnalysisResponse> {
  try {
    const projectType = determineProjectType(files);
    logger.info(
      `Detected project type: ${projectType.type} with confidence: ${projectType.confidence}`
    );

    // Default to React if project type is unknown
    const analysisType = projectType.type === "python" ? "python" : "react";

    // Run category analysis in parallel
    const categoryAnalysisPromises = CATEGORY_GROUPS.map(group =>
      analyzeCodeForCategories(files, group, analysisType)
    );

    // Get all category results
    const categoryResults = await Promise.all(categoryAnalysisPromises);
    const allIssues = categoryResults.flatMap(r => r.issues || []);

    logger.info(`Analysis complete with ${allIssues.length} issues`);

    // Get overall feedback
    const overallFeedback = await getOverallFeedback(
      files,
      analysisType,
      allIssues
    );
    logger.info(`Overall feedback: ${overallFeedback}`);

    return {
      overallFeedback,
      issues: allIssues,
    };
  } catch (error) {
    logger.error("Error analyzing code:", error);
    throw new Error("Failed to analyze code. Please try again.");
  }
}

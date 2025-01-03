import { FileContent, formatFileContent } from "./file-system";
import { getGeminiResponse, Message } from "./geminiClient";
import { PYTHON_SYSTEM_PROMPT, REACT_SYSTEM_PROMPT } from "../config/prompts";
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

export interface CodeAnalysisResponse {
  overallFeedback: string;
  issues: CodeAnalysisIssue[];
}

export async function analyzeCode(
  files: FileContent[]
): Promise<CodeAnalysisResponse> {
  try {
    const projectType = determineProjectType(files);
    logger.info(
      `Detected project type: ${projectType.type} with confidence: ${projectType.confidence}`
    );

    const selectedPrompt =
      projectType.type === "python"
        ? PYTHON_SYSTEM_PROMPT
        : REACT_SYSTEM_PROMPT;

    const messages: Message[] = [
      { role: "system", content: selectedPrompt },
      {
        role: "user",
        content: `Here is the code from the repository:\n\n${files.map(formatFileContent).join("\n")}`,
      },
    ];

    const response = await getGeminiResponse(messages);
    return response;
  } catch (error) {
    logger.error("Error analyzing code:", error);
    throw new Error("Failed to analyze code. Please try again.");
  }
}

import { Logger } from "./logger";
import type { FileContent } from "./file-system";
import type { Message } from "./geminiClient";
import { formatFileContent } from "./file-system";
import { getGeminiResponseForQuestions } from "./geminiClient";
const logger = new Logger("GenerateQuestions");

export interface QuestionsResult {
  questions: string[];
  repositoryUrl: string;
  generatedAt: string;
}

export async function generateQuestionsForRepo(
  files: FileContent[],
  repositoryUrl: string
): Promise<QuestionsResult> {
  logger.info("Generating questions for repository", {
    fileCount: files.length,
  });

  try {
    // Filter out non-code files and very large files
    const codeFiles = files.filter(
      file =>
        !file.path.includes("node_modules") &&
        !file.path.includes(".git") &&
        file.content &&
        file.content.length < 100000 &&
        (file.path.endsWith(".js") ||
          file.path.endsWith(".jsx") ||
          file.path.endsWith(".ts") ||
          file.path.endsWith(".tsx") ||
          file.path.endsWith(".py") ||
          file.path.endsWith(".java") ||
          file.path.endsWith(".go") ||
          file.path.endsWith(".rb") ||
          file.path.endsWith(".php") ||
          file.path.endsWith(".c") ||
          file.path.endsWith(".cpp") ||
          file.path.endsWith(".h") ||
          file.path.endsWith(".cs"))
    );

    logger.info("Filtered code files", {
      codeFileCount: codeFiles.length,
    });

    // Prepare the repository structure for analysis
    const repoStructure = codeFiles.map(file => ({
      path: file.path,
      content: file.content,
    }));

    const prompt = `You are a Principal Software Engineer. You are given a codebase and you need to generate 5 specific questions that are relevant to the codebase. The questions should be designed to test the developer's understanding of the codebase and to help them improve their skills.

    The questions should be in the following JSON format:
    {
      "questions": [
        {
          "question": "Can you explain why you chose to use the Gemini API for this project?",
        },
        {
          "question": "What made you choose this specific framework for this project?",
        },
        {
          "question": "What are the key features of the Gemini API that you used in this project?",
        },
        {
          "question": "Can you share any potential tradeoffs of your approach to fetching data?",
        },
        {
          "question": "What improvements would you make to the current architecture if you had more time?",
        }
      ]
    }
    `;

    const messages: Message[] = [
      { role: "system", content: prompt },
      {
        role: "user",
        content: `Here is the code from the repository:\n\n${files.map(formatFileContent).join("\n")}`,
      },
    ];

    const response = await getGeminiResponseForQuestions(messages);

    const questions = response.questions.map(question => question.question);

    logger.info("Successfully generated questions", {
      questionCount: questions.length,
    });

    return {
      questions,
      repositoryUrl,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("Error generating questions", error);
    throw error;
  }
}

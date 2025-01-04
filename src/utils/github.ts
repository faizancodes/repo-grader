import { Octokit } from "@octokit/rest";
import { Logger } from "./logger";
import type { FileContent } from "./file-system";
import {
  IGNORED_DIRECTORIES,
  IGNORED_FILE_PATTERNS,
  IGNORED_PATH_PATTERNS,
} from "../config/repo-analysis";
import { env } from "../config/env";

const logger = new Logger("GitHub");

const octokit = new Octokit({
  auth: env.GITHUB_TOKEN,
});

/**
 * Validates if a given URL is a valid GitHub repository URL
 */
export function isValidGitHubUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return (
      parsedUrl.hostname === "github.com" &&
      parsedUrl.pathname.split("/").length >= 3
    );
  } catch {
    return false;
  }
}

/**
 * Extracts owner and repo from a GitHub URL
 */
export function extractRepoInfo(url: string): { owner: string; repo: string } {
  try {
    const parsedUrl = new URL(url);
    const [, owner, repo] = parsedUrl.pathname.split("/");
    return { owner, repo: repo.replace(".git", "") };
  } catch (error) {
    logger.error("Failed to extract repo info:", error);
    throw new Error("Invalid GitHub repository URL");
  }
}

/**
 * Fetches repository contents using GitHub API
 */
export async function fetchRepositoryContents(
  url: string
): Promise<FileContent[]> {
  try {
    const { owner, repo } = extractRepoInfo(url);
    logger.info(`Fetching contents for ${owner}/${repo}`);

    // Get repository data and check if private
    const { data: repoData } = await octokit.rest.repos.get({
      owner,
      repo,
    });

    if (repoData.private) {
      logger.error(`Repository ${owner}/${repo} is private`);
      throw new Error("Cannot analyze private repositories");
    }

    const defaultBranch = repoData.default_branch;

    // Get tree recursively
    const { data: treeData } = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: defaultBranch,
      recursive: "1",
    });

    const files: FileContent[] = [];
    const maxBlobSize = 1024 * 1024; // 1MB

    // Helper function to check if path should be ignored
    const shouldIgnorePath = (path: string): boolean => {
      // First check if path contains any ignored patterns
      const normalizedPath = path.replace(/\\/g, "/");
      for (const pattern of IGNORED_PATH_PATTERNS) {
        const pathParts = normalizedPath.split("/");
        for (let i = 0; i < pathParts.length; i++) {
          const parentPath = pathParts.slice(0, i + 1).join("/");
          if (parentPath.toLowerCase().endsWith(pattern.toLowerCase())) {
            logger.debug(
              `Ignoring GitHub file in path pattern ${pattern}: ${path}`
            );
            return true;
          }
        }
      }

      // Check if path starts with any ignored directory
      if (
        IGNORED_DIRECTORIES.some(
          dir => path.startsWith(`${dir}/`) || path === dir
        )
      ) {
        logger.debug(`Ignoring GitHub directory: ${path}`);
        return true;
      }

      // Check if file matches any ignored pattern
      const shouldIgnoreFile = IGNORED_FILE_PATTERNS.some(pattern => {
        if (pattern.includes("*")) {
          const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
          return regex.test(path.split("/").pop() || "");
        }
        return path.endsWith(pattern);
      });

      if (shouldIgnoreFile) {
        logger.debug(`Ignoring GitHub file: ${path}`);
      }
      return shouldIgnoreFile;
    };

    // Process files in parallel with rate limiting
    await Promise.all(
      treeData.tree
        .filter(
          (item): item is { type: string; size: number; path: string } =>
            item.type === "blob" &&
            typeof item.size === "number" &&
            item.size < maxBlobSize &&
            item.path !== undefined &&
            !shouldIgnorePath(item.path)
        )
        .map(async item => {
          try {
            const { data: content } = await octokit.rest.repos.getContent({
              owner,
              repo,
              path: item.path,
              ref: defaultBranch,
            });

            if ("content" in content && typeof content.content === "string") {
              files.push({
                path: item.path,
                content: Buffer.from(content.content, "base64").toString(
                  "utf-8"
                ),
              });
            }
          } catch (error) {
            logger.warn(`Failed to fetch content for ${item.path}:`, error);
          }
        })
    );

    logger.info(`Successfully fetched ${files.length} files`);
    logger.debug(`Files: ${files.map(file => file.path).join(", ")}`);
    return files;
  } catch (error) {
    logger.error("Failed to fetch repository contents:", error);
    throw new Error(
      "Failed to fetch repository contents. Please check the URL and try again."
    );
  }
}

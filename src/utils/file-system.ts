import path from "path";
import { Logger } from "./logger";
import {
  IGNORED_DIRECTORIES,
  IGNORED_FILE_PATTERNS,
  IGNORED_PATH_PATTERNS,
} from "@/config/repo-analysis";

const logger = new Logger("FileSystem");

export interface FileContent {
  path: string;
  content: string;
}

/**
 * Determines if a file or directory should be ignored during processing
 */
export function shouldIgnorePath(
  filePath: string,
  isDirectory: boolean
): boolean {
  const basename = path.basename(filePath);
  const normalizedPath = filePath.replace(/\\/g, "/");

  // First check if the path contains any ignored patterns
  for (const pattern of IGNORED_PATH_PATTERNS) {
    // Check if this path or any of its parent directories match the pattern
    const pathParts = normalizedPath.split("/");
    for (let i = 0; i < pathParts.length; i++) {
      const parentPath = pathParts.slice(0, i + 1).join("/");
      if (parentPath.toLowerCase().endsWith(pattern.toLowerCase())) {
        logger.debug(
          `Ignoring file in ignored path pattern ${pattern}: ${filePath}`
        );
        return true;
      }
    }
  }

  if (isDirectory) {
    const shouldIgnore = IGNORED_DIRECTORIES.includes(
      basename as (typeof IGNORED_DIRECTORIES)[number]
    );
    if (shouldIgnore) {
      logger.debug(`Ignoring directory: ${filePath}`);
    }
    return shouldIgnore;
  }

  const shouldIgnore = IGNORED_FILE_PATTERNS.some(pattern => {
    if (pattern.includes("*")) {
      const regex = new RegExp("^" + pattern.replace("*", ".*") + "$");
      return regex.test(basename);
    }
    return basename === pattern;
  });

  if (shouldIgnore) {
    logger.debug(`Ignoring file: ${filePath}`);
  }
  return shouldIgnore;
}

export function formatFileContent(fileContent: FileContent) {
  // logger.debug(`Formatting file content for: ${fileContent.path}`);

  // Handle both /tmp and /temp paths
  const isProd = process.env.NODE_ENV !== "development";
  const baseDirPattern = isProd ? "/tmp/" : "/temp/";

  // Extract path after base directory
  const pathParts = fileContent.path.split(baseDirPattern);
  const relativePath = pathParts[1]?.split("/", 2)[1]
    ? pathParts[1].split("/", 2)[1]
    : fileContent.path;

  return `<${relativePath}>\n\n${fileContent.content}\n\n</${relativePath}>\n\n`;
}

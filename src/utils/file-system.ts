import fs from "fs/promises";
import path from "path";
import { Logger } from "./logger";
import {
  IGNORED_DIRECTORIES,
  IGNORED_FILE_PATTERNS,
  MAX_FILE_SIZE,
  MAX_LINES,
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

/**
 * Recursively reads all valid files in a directory
 */
export async function readFilesRecursively(
  dir: string
): Promise<FileContent[]> {
  const files: FileContent[] = [];
  logger.info(`Starting to read directory: ${dir}`);

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    logger.debug(`Found ${entries.length} entries in directory: ${dir}`);

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (shouldIgnorePath(fullPath, true)) continue;

        logger.debug(`Processing subdirectory: ${fullPath}`);
        const subFiles = await readFilesRecursively(fullPath);
        files.push(...subFiles);
        continue;
      }

      if (shouldIgnorePath(fullPath, false)) continue;

      try {
        const stats = await fs.stat(fullPath);
        if (stats.size > MAX_FILE_SIZE) {
          logger.warn(`Skipping large file ${fullPath} (${stats.size} bytes)`);
          continue;
        }

        logger.debug(`Reading file: ${fullPath}`);
        const content = await fs.readFile(fullPath, "utf-8");

        // Check line count
        const lineCount = content.split("\n").length;
        if (lineCount > MAX_LINES) {
          logger.warn(
            `Skipping file with too many lines ${fullPath} (${lineCount} lines)`
          );
          continue;
        }

        files.push({ path: fullPath, content });
      } catch (error) {
        logger.error(`Error reading file ${fullPath}`, error);
      }
    }

    logger.info(
      `Successfully processed directory: ${dir}, found ${files.length} files`
    );
    return files;
  } catch (error) {
    logger.error(`Error reading directory ${dir}`, error);
    return files;
  }
}

/**
 * Creates a temporary directory for cloning repositories
 */
export async function createTempDir(): Promise<string> {
  const isProd = process.env.NODE_ENV !== 'development'
  const baseDir = isProd ? '/tmp' : path.join(process.cwd(), 'temp')
  const tempDir = path.join(baseDir, Date.now().toString())
  
  logger.info(`Creating temporary directory: ${tempDir} in ${isProd ? 'production' : 'development'} mode`)
  try {
    await fs.mkdir(tempDir, { recursive: true })
    logger.debug(`Successfully created temporary directory: ${tempDir}`)
    return tempDir
  } catch (error) {
    logger.error(`Failed to create temporary directory: ${tempDir}`, error)
    throw error
  }
}

/**
 * Safely removes a directory and its contents
 */
export async function removeTempDir(dir: string): Promise<void> {
  logger.info(`Removing temporary directory: ${dir}`);
  try {
    await fs.rm(dir, { recursive: true, force: true });
    logger.debug(`Successfully removed temporary directory: ${dir}`);
  } catch (error) {
    logger.error(`Failed to remove temporary directory: ${dir}`, error);
  }
}

export function formatFileContent(fileContent: FileContent) {
  logger.debug(`Formatting file content for: ${fileContent.path}`)

  // Handle both /tmp and /temp paths
  const isProd = process.env.NODE_ENV !== 'development'
  const baseDirPattern = isProd ? '/tmp/' : '/temp/'
  
  // Extract path after base directory
  const pathParts = fileContent.path.split(baseDirPattern)
  const relativePath = pathParts[1]?.split('/', 2)[1]
    ? pathParts[1].split('/', 2)[1]
    : fileContent.path

  return `<${relativePath}>\n\n${fileContent.content}\n\n</${relativePath}>\n\n`
}

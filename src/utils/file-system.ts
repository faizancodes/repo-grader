import fs from "fs/promises";
import path from "path";
import {
  IGNORED_DIRECTORIES,
  IGNORED_FILE_PATTERNS,
  MAX_FILE_SIZE,
} from "@/config/repo-analysis";

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
    return IGNORED_DIRECTORIES.includes(
      basename as (typeof IGNORED_DIRECTORIES)[number]
    );
  }

  return IGNORED_FILE_PATTERNS.some(pattern => {
    if (pattern.includes("*")) {
      const regex = new RegExp("^" + pattern.replace("*", ".*") + "$");
      return regex.test(basename);
    }
    return basename === pattern;
  });
}

/**
 * Recursively reads all valid files in a directory
 */
export async function readFilesRecursively(
  dir: string
): Promise<FileContent[]> {
  const files: FileContent[] = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (shouldIgnorePath(fullPath, true)) continue;

        const subFiles = await readFilesRecursively(fullPath);
        files.push(...subFiles);
        continue;
      }

      if (shouldIgnorePath(fullPath, false)) continue;

      try {
        const stats = await fs.stat(fullPath);
        if (stats.size > MAX_FILE_SIZE) {
          console.warn(`Skipping large file ${fullPath} (${stats.size} bytes)`);
          continue;
        }

        const content = await fs.readFile(fullPath, "utf-8");
        files.push({ path: fullPath, content });
      } catch (error) {
        console.error(`Error reading file ${fullPath}:`, error);
      }
    }

    return files;
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error);
    return files;
  }
}

/**
 * Creates a temporary directory for cloning repositories
 */
export async function createTempDir(): Promise<string> {
  const tempDir = path.join(process.cwd(), "temp", Date.now().toString());
  await fs.mkdir(tempDir, { recursive: true });
  return tempDir;
}

/**
 * Safely removes a directory and its contents
 */
export async function removeTempDir(dir: string): Promise<void> {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch (error) {
    console.error(`Error removing directory ${dir}:`, error);
  }
}

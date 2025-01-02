import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";

const execAsync = promisify(exec);

// Function to validate GitHub URL
function isValidGitHubUrl(url: string) {
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

// Function to recursively read all files in a directory
async function readFilesRecursively(
  dir: string
): Promise<{ path: string; content: string }[]> {
  const files: { path: string; content: string }[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules and .git directories
      if (entry.name === "node_modules" || entry.name === ".git") {
        continue;
      }
      const subFiles = await readFilesRecursively(fullPath);
      files.push(...subFiles);
    } else {
      try {
        const content = await fs.readFile(fullPath, "utf-8");
        files.push({
          path: fullPath,
          content,
        });
      } catch (error) {
        console.error(`Error reading file ${fullPath}:`, error);
      }
    }
  }

  return files;
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || !isValidGitHubUrl(url)) {
      return NextResponse.json(
        { error: "Invalid GitHub repository URL" },
        { status: 400 }
      );
    }

    // Create a temporary directory for cloning
    const tempDir = path.join(process.cwd(), "temp", Date.now().toString());
    await fs.mkdir(tempDir, { recursive: true });

    try {
      // Clone the repository
      await execAsync(`git clone ${url} ${tempDir}`);

      // Read all files
      const files = await readFilesRecursively(tempDir);

      // Clean up: remove the cloned repository
      await fs.rm(tempDir, { recursive: true, force: true });

      return NextResponse.json({ files });
    } catch (error) {
      // Clean up on error
      await fs.rm(tempDir, { recursive: true, force: true });
      throw error;
    }
  } catch (error) {
    console.error("Error processing repository:", error);
    return NextResponse.json(
      { error: "Failed to process repository" },
      { status: 500 }
    );
  }
}

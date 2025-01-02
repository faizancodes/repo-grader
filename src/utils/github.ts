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
 * Cleans a GitHub URL by removing unnecessary parts and ensuring it ends with .git
 */
export function cleanGitHubUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    const segments = parsedUrl.pathname.split("/");
    const treeIndex = segments.indexOf("tree");

    if (treeIndex !== -1) {
      segments.splice(treeIndex);
    }

    return `https://github.com${segments.join("/")}.git`;
  } catch {
    return url;
  }
}

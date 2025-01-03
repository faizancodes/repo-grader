import { FileContent } from "./file-system";

export interface ProjectType {
  type: "python" | "react" | "unknown";
  confidence: number;
  indicators: {
    python: number;
    react: number;
  };
}

interface FileIndicators {
  python: number;
  react: number;
}

function getFileTypeIndicators(path: string): FileIndicators {
  const indicators = { python: 0, react: 0 };
  const pathLower = path.toLowerCase();

  // Python indicators
  if (pathLower.endsWith(".py")) indicators.python += 2;
  if (pathLower.includes("requirements.txt")) indicators.python += 3;
  if (pathLower.includes("setup.py")) indicators.python += 3;
  if (pathLower.includes("__init__.py")) indicators.python += 1;
  if (pathLower.includes("/tests/test_")) indicators.python += 1;

  // React/Next.js indicators
  if (pathLower.match(/\.(jsx?|tsx?)$/)) indicators.react += 2;
  if (pathLower.includes("package.json")) indicators.react += 3;
  if (pathLower.includes("next.config.")) indicators.react += 3;
  if (pathLower.includes("/components/")) indicators.react += 2;
  if (pathLower.includes("/pages/")) indicators.react += 2;
  if (pathLower.includes("tailwind.config.")) indicators.react += 1;
  if (pathLower.includes(".eslintrc")) indicators.react += 1;

  return indicators;
}

function getContentIndicators(content: string): FileIndicators {
  const indicators = { python: 0, react: 0 };
  const contentLower = content.toLowerCase();

  // React indicators
  if (contentLower.includes("import react")) indicators.react += 2;
  if (contentLower.includes("from react")) indicators.react += 2;
  if (contentLower.includes("import * as react")) indicators.react += 2;

  // Python indicators
  if (contentLower.includes("import flask")) indicators.python += 2;
  if (contentLower.includes("import django")) indicators.python += 2;
  if (contentLower.includes("import pandas")) indicators.python += 2;

  return indicators;
}

export function determineProjectType(files: FileContent[]): ProjectType {
  const indicators = files.reduce(
    (acc, file) => {
      const fileTypeIndicators = getFileTypeIndicators(file.path);
      const contentIndicators = getContentIndicators(file.content);

      return {
        python:
          acc.python + fileTypeIndicators.python + contentIndicators.python,
        react: acc.react + fileTypeIndicators.react + contentIndicators.react,
      };
    },
    { python: 0, react: 0 }
  );

  const total = indicators.python + indicators.react;
  if (total === 0) {
    return {
      type: "unknown",
      confidence: 0,
      indicators,
    };
  }

  const pythonConfidence = indicators.python / total;
  const reactConfidence = indicators.react / total;

  if (pythonConfidence > 0.6) {
    return {
      type: "python",
      confidence: pythonConfidence,
      indicators,
    };
  }

  if (reactConfidence > 0.6) {
    return {
      type: "react",
      confidence: reactConfidence,
      indicators,
    };
  }

  return {
    type: "unknown",
    confidence: Math.max(pythonConfidence, reactConfidence),
    indicators,
  };
}

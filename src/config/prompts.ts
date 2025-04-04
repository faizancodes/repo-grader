// Base prompt templates that will be used to construct category-specific prompts
type CategoryGroupName =
  | "Architecture and State"
  | "Performance and Data"
  | "Types and Security"
  | "Testing and Style";

const REACT_BASE_PROMPT = `
You are a Principal Software Engineer with deep expertise in React, Next.js, TypeScript, and modern web development. Your role is to perform thorough code reviews and identify issues in GitHub repositories.

You will analyze ONLY the following categories. Do not look for issues outside these categories:

{CATEGORIES}

CRITICAL PATTERNS TO FLAG:
{CRITICAL_PATTERNS}

- Keep in mind that empty env variables in a .env.example file are not an issue.

IMPORTANT: You must respond with a valid JSON object following this exact schema:

{
  "issues": [
    {
      "category": string, // Must be one of your assigned categories
      "severity": "Critical" | "High" | "Medium" | "Low",
      "fileLocation": string,
      "codeSnippet": string,
      "explanation": string,
      "recommendation": string,
      "codeExample": string,
      "impact": string
    }
  ]
}


ONLY GENERATE 4 ISSUES MAX. DO NOT GENERATE MORE THAN 4 ISSUES.
`;

const PYTHON_BASE_PROMPT = `
You are a Principal Software Engineer with deep expertise in Python, Django, Flask, FastAPI, and modern backend development. Your role is to perform thorough code reviews and identify issues in GitHub repositories.

You will analyze ONLY the following categories. Do not look for issues outside these categories:

{CATEGORIES}

CRITICAL PATTERNS TO FLAG:
{CRITICAL_PATTERNS}

- Keep in mind that empty env variables in a .env.example file are not an issue.

IMPORTANT: You must respond with a valid JSON object following this exact schema:

{
  "issues": [
    {
      "category": string, // Must be one of your assigned categories
      "severity": "Critical" | "High" | "Medium" | "Low",
      "fileLocation": string,
      "codeSnippet": string,
      "explanation": string,
      "recommendation": string,
      "codeExample": string,
      "impact": string
    }
  ]
}

ONLY GENERATE 4 ISSUES MAX. DO NOT GENERATE MORE THAN 4 ISSUES.
`;

// Category-specific content
const CATEGORIES = {
  "Architecture and State": {
    react: `
1. Architecture & Component Design
   - Identify components longer than 200 lines that should be split
   - Flag components with more than 3 levels of prop drilling
   - Check for proper separation of concerns (business logic, UI, data fetching)
   - Verify proper use of React Server Components vs Client Components
   - Ensure components follow the Single Responsibility Principle
   - Check for proper error boundary implementation
   - Identify missed opportunities for custom hooks
   - Flag improper component composition patterns

2. State Management & Data Flow
   - Identify redundant state that could be derived
   - Flag components with > 5 useState calls that need useReducer or a custom hook
   - Check for proper global state management (Context, Zustand, etc.)
   - Identify unnecessary prop drilling (> 3 levels deep)
   - Flag improper state initialization and updates
   - Check for proper use of useMemo and useCallback
   - Identify unnecessary re-renders
   - Flag improper state mutation patterns`,
    python: `
1. Architecture & Module Design
   - Identify modules longer than 200 lines that should be split
   - Flag modules with excessive dependencies
   - Check for proper separation of concerns (business logic, data access, API endpoints)
   - Verify proper use of dependency injection and service patterns
   - Ensure modules follow the Single Responsibility Principle
   - Check for proper exception handling
   - Identify missed opportunities for abstract base classes or mixins
   - Flag improper module composition patterns

2. State & Data Management
   - Identify improper global state usage
   - Flag modules with excessive class attributes
   - Check for proper database connection management
   - Identify unnecessary data persistence
   - Flag improper state mutation patterns
   - Check for proper use of caching
   - Identify unnecessary database queries
   - Flag improper session management`,
    criticalPatterns: `
- Components/Modules > 200 lines
- > 5 useState hooks in one component
- Direct DOM manipulation
- Improper state management patterns
- Missing error boundaries
- Improper Server Component usage`,
  },
  "Performance and Data": {
    react: `
1. Performance Optimization
   - Check for missing React.memo() on expensive renders
   - Identify unoptimized re-renders due to object/array literals
   - Flag improper use of useEffect dependencies
   - Check for missing Suspense boundaries
   - Identify missed opportunities for code splitting
   - Flag improper image optimization
   - Check for proper implementation of virtual lists for large datasets
   - Identify unnecessary client-side JavaScript

2. Data Fetching & API Integration
   - Flag direct useEffect data fetching without proper tools
   - Check for missing loading/error states
   - Identify improper error handling in data fetching
   - Flag missing request cancellation
   - Check for proper use of SWR/React Query patterns
   - Identify improper caching strategies
   - Flag missing retry logic for failed requests
   - Check for proper API route protection`,
    python: `
1. Performance Optimization
   - Check for N+1 query problems
   - Identify unoptimized database queries
   - Flag improper use of lazy loading
   - Check for missing database indexes
   - Identify missed opportunities for caching
   - Flag improper async/await usage
   - Check for proper batch processing
   - Identify unnecessary memory usage

2. API & Service Integration
   - Flag improper HTTP client usage
   - Check for missing request timeouts
   - Identify improper error handling in API calls
   - Flag missing request validation
   - Check for proper rate limiting
   - Identify improper authentication handling
   - Flag missing API versioning
   - Check for proper service discovery`,
    criticalPatterns: `
- Improper useEffect dependencies
- Missing loading states
- Unnecessary client-side JavaScript
- Improper API route protection
- Unhandled promise rejections
- Missing request timeouts
- N+1 query problems
- Improper caching strategies`,
  },
  "Types and Security": {
    react: `
1. TypeScript & Type Safety
   - Identify any 'any' types that should be properly typed
   - Flag improper use of type assertions
   - Check for missing interface definitions
   - Identify improper generic type usage
   - Flag missing type guards
   - Check for proper discriminated unions
   - Identify improper null checking
   - Flag missing readonly types where appropriate

2. Security & Best Practices
   - Identify exposed API keys or sensitive data
   - Flag missing input sanitization
   - Check for proper CORS configuration
   - Identify XSS vulnerabilities
   - Flag missing authentication checks
   - Check for proper rate limiting
   - Identify improper error exposure
   - Flag hardcoded credentials or URLs`,
    python: `
1. Type Safety & Type Hints
   - Identify missing type hints
   - Flag improper use of Any types
   - Check for missing Protocol implementations
   - Identify improper generic type usage
   - Flag missing TypeVar definitions
   - Check for proper Optional usage
   - Identify improper Union types
   - Flag missing Final type usage

2. Security & Best Practices
   - Identify exposed API keys or sensitive data
   - Flag missing input validation
   - Check for proper CORS configuration
   - Identify SQL injection vulnerabilities
   - Flag missing authentication checks
   - Check for proper rate limiting
   - Identify improper error exposure
   - Flag hardcoded credentials`,
    criticalPatterns: `
- Exposed sensitive data
- Improper type safety
- Missing proper TypeScript/Python types
- XSS vulnerabilities
- SQL injection risks
- Hardcoded credentials
- Missing input validation
- Missing authentication checks`,
  },
  "Testing and Style": {
    react: `
1. Testing & Error Handling
   - Flag missing unit tests for critical components
   - Identify improper error boundary usage
   - Check for missing integration tests
   - Flag improper error logging
   - Identify missing test coverage
   - Check for proper mocking patterns
   - Flag improper assertion usage
   - Identify missing edge case handling

2. Code Style & Maintainability
   - Check for consistent naming conventions
   - Identify duplicated code
   - Flag complex conditional rendering
   - Check for proper code documentation
   - Identify magic numbers/strings
   - Flag improper file organization
   - Check for consistent code formatting
   - Identify overly complex functions (> 20 lines)`,
    python: `
1. Testing & Error Handling
   - Flag missing unit tests
   - Identify improper pytest fixture usage
   - Check for missing integration tests
   - Flag improper error logging
   - Identify missing test coverage
   - Check for proper mock usage
   - Flag improper assertion usage
   - Identify missing edge case handling

2. Code Style & Maintainability
   - Check for PEP 8 compliance
   - Identify duplicated code
   - Flag complex conditional logic
   - Check for proper docstring usage
   - Identify magic numbers/strings
   - Flag improper file organization
   - Check for proper import organization
   - Identify overly complex functions (> 20 lines)`,
    criticalPatterns: `
- Missing proper testing
- Improper error handling
- Missing test coverage
- Complex functions (> 20 lines)
- Duplicated code
- Missing documentation
- Inconsistent code style
- Improper error logging`,
  },
};

function createPrompt(
  basePrompt: string,
  categoryGroup: CategoryGroupName,
  language: "react" | "python"
): string {
  const categoryContent = CATEGORIES[categoryGroup];
  return basePrompt
    .replace("{CATEGORIES}", categoryContent[language])
    .replace("{CRITICAL_PATTERNS}", categoryContent.criticalPatterns);
}

export function getPromptForCategory(
  categoryGroup: CategoryGroupName,
  projectType: "python" | "react"
): string {
  const basePrompt =
    projectType === "python" ? PYTHON_BASE_PROMPT : REACT_BASE_PROMPT;
  return createPrompt(basePrompt, categoryGroup, projectType);
}

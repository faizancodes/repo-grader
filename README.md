# GitHub Repo Analyzer

A powerful code analysis tool that evaluates your GitHub repositories and provides actionable feedback to improve code quality.

![GitHub Repo Analyzer](https://github.com/user-attachments/assets/200545f0-9335-4676-8f28-f628f0f037dc)

## Features

- **Deep Code Analysis**: Analyzes your repository code for issues across multiple categories:
  - Architecture & Component Design
  - State Management & Data Flow
  - Performance Optimization
  - Data Fetching & API Integration
  - TypeScript & Type Safety
  - Security & Best Practices
  - Testing & Error Handling
  - Code Style & Maintainability

- **Severity Ranking**: Issues are categorized by severity (Critical, High, Medium, Low) to help prioritize fixes

- **Actionable Recommendations**: Each identified issue includes:
  - Detailed explanation
  - Code snippets highlighting the problem
  - Specific recommendations for improvement
  - Example code fixes
  - Impact assessment

- **Shareable Results**: Easily share analysis results with teammates via a unique URL

- **Multi-Project Support**: Works with both React/TypeScript and Python projects

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19, Tailwind CSS, Shadcn UI, Radix UI
- **State Management**: Zustand
- **AI Integration**: Google Gemini API for code analysis
- **API Integration**: GitHub API for repository access
- **Storage**: Upstash Redis for persisting analysis results

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/faizancodes/repo-grader.git
cd repo-grader
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```
# GitHub API credentials
GITHUB_TOKEN=your_github_token

# Gemini API credentials
GEMINI_API_KEY=your_gemini_api_key

# Redis storage
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to use the application.

## How It Works

1. Enter a GitHub repository URL in the form
2. The system fetches the repository contents
3. Code is analyzed across multiple categories using AI
4. Results are displayed with detailed feedback and recommendations
5. Analysis results are stored for future reference and sharing

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT](LICENSE)

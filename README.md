# Repository Grader

This project analyzes GitHub repositories to provide code quality feedback and suggestions for improvement.

## Features

- **Code Analysis**: Analyzes code repositories and identifies issues with severity ratings
- **Detailed Feedback**: Provides detailed explanations and recommendations for each issue
- **GitHub PR Creation**: Automatically creates a pull request with fixes for identified issues
- **Questions Generation**: Generates insightful questions about your codebase

## GitHub PR Integration

The GitHub PR feature allows you to automatically apply recommended fixes to your repository:

1. **Analyze Repository**: Enter your GitHub repository URL to analyze the code
2. **Review Results**: Review the analysis results and identified issues
3. **Create PR**: Click the "Apply Fixes with GitHub PR" button to automatically create a pull request
4. **Merge Changes**: Review and merge the PR in your GitHub repository

> Note: This feature requires a valid GitHub token with repository access. The token should be provided in the `.env` file.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
GROQ_API_KEY=your_groq_api_key
GOOGLE_API_KEY=your_google_api_key
OPENAI_API_KEY=your_openai_api_key
GITHUB_TOKEN=your_github_token
KV_REST_API_URL=your_kv_rest_api_url
KV_REST_API_TOKEN=your_kv_rest_api_token
KV_REST_API_READ_ONLY_TOKEN=your_kv_rest_api_read_only_token
API_URL=your_api_url
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

Test

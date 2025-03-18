import { Octokit } from '@octokit/rest'
import { extractRepoInfo } from './github'
import { Logger } from './logger'
import { CodeAnalysisIssue } from './analyzeCode'
import { env } from '../config/env'

const logger = new Logger('GitHubPR')

/**
 * Represents a code change to be applied in a pull request
 */
export interface CodeChange {
  filePath: string
  originalCode: string
  newCode: string
  explanation: string
}

/**
 * Response from the createPullRequest function
 */
export interface CreatePullRequestResponse {
  success: boolean
  message: string
  prUrl?: string
  error?: string
}

/**
 * Creates a GitHub pull request with changes based on analysis issues
 */
export async function createPullRequest(
  repoUrl: string,
  issues: CodeAnalysisIssue[],
  branchName: string = 'repo-grader-fixes'
): Promise<CreatePullRequestResponse> {
  try {
    logger.info(`Creating pull request for ${repoUrl}`)
    
    // Initialize Octokit client
    const octokit = new Octokit({
      auth: env.GITHUB_TOKEN
    })
    
    // Extract owner and repo from URL
    const { owner, repo } = extractRepoInfo(repoUrl)
    
    // Get repository data
    const { data: repoData } = await octokit.rest.repos.get({
      owner,
      repo
    })

    // Check if repo is private
    if (repoData.private) {
      logger.error(`Repository ${owner}/${repo} is private`)
      return {
        success: false,
        message: 'Cannot create PR for private repositories',
        error: 'Private repository access is not supported'
      }
    }

    // Get the default branch
    const defaultBranch = repoData.default_branch
    
    // Fetch the reference to the default branch
    const { data: reference } = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${defaultBranch}`
    })
    
    // Get the latest commit SHA
    const latestCommitSha = reference.object.sha
    
    // Create a new branch
    try {
      // Try to create the branch
      await octokit.rest.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha: latestCommitSha
      })
      logger.info(`Created branch ${branchName}`)
    } catch (error) {
      // If the branch already exists, update it
      logger.warn(`Branch ${branchName} already exists, updating it`)
      try {
        await octokit.rest.git.updateRef({
          owner,
          repo,
          ref: `heads/${branchName}`,
          sha: latestCommitSha,
          force: true
        })
      } catch (updateError) {
        logger.error(`Failed to update branch: ${updateError}`)
        return {
          success: false,
          message: 'Failed to create or update branch',
          error: updateError instanceof Error ? updateError.message : String(updateError)
        }
      }
    }
    
    // Convert issues to code changes
    const codeChanges = convertIssuesToCodeChanges(issues)
    
    // Apply code changes
    for (const change of codeChanges) {
      try {
        // Get the current file content
        const { data: fileData } = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: change.filePath,
          ref: branchName
        })
        
        if (!('content' in fileData) || !fileData.content || !fileData.sha) {
          logger.warn(`File ${change.filePath} content is not available`)
          continue
        }
        
        // Create the commit
        await octokit.rest.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: change.filePath,
          message: `Fix: ${change.explanation}`,
          content: Buffer.from(change.newCode).toString('base64'),
          sha: fileData.sha,
          branch: branchName
        })
        
        logger.info(`Updated file ${change.filePath}`)
      } catch (error) {
        logger.error(`Failed to update file ${change.filePath}: ${error}`)
        // Continue with other changes even if one fails
      }
    }
    
    // Create a pull request
    const { data: pullRequest } = await octokit.rest.pulls.create({
      owner,
      repo,
      title: 'Repository Grader: Automated Code Improvements',
      body: generatePRDescription(issues),
      head: branchName,
      base: defaultBranch
    })
    
    logger.info(`Pull request created: ${pullRequest.html_url}`)
    
    return {
      success: true,
      message: 'Pull request created successfully',
      prUrl: pullRequest.html_url
    }
  } catch (error) {
    logger.error('Failed to create pull request:', error)
    return {
      success: false,
      message: 'Failed to create pull request',
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

/**
 * Converts analysis issues to code changes
 */
function convertIssuesToCodeChanges(issues: CodeAnalysisIssue[]): CodeChange[] {
  return issues
    .filter(issue => issue.codeExample && issue.codeSnippet)
    .map(issue => ({
      filePath: issue.fileLocation,
      originalCode: issue.codeSnippet,
      newCode: issue.codeExample,
      explanation: issue.recommendation
    }))
}

/**
 * Generates a PR description based on the issues
 */
function generatePRDescription(issues: CodeAnalysisIssue[]): string {
  const issuesBySeverity = issues.reduce(
    (acc, issue) => {
      if (!acc[issue.severity]) acc[issue.severity] = []
      acc[issue.severity].push(issue)
      return acc
    },
    {} as Record<string, CodeAnalysisIssue[]>
  )
  
  const severityOrder = ['Critical', 'High', 'Medium', 'Low']
  
  let description = '# Repository Grader: Automated Code Improvements\n\n'
  description += 'This pull request contains automated fixes for issues identified by Repository Grader.\n\n'
  
  description += '## Changes Summary\n\n'
  
  // Add issues by severity
  for (const severity of severityOrder) {
    const severityIssues = issuesBySeverity[severity]
    if (!severityIssues || severityIssues.length === 0) continue
    
    description += `### ${severity} Issues (${severityIssues.length})\n\n`
    
    for (const issue of severityIssues) {
      description += `- **${issue.category}**: ${issue.explanation}\n`
      description += `  - File: \`${issue.fileLocation}\`\n`
      description += `  - Impact: ${issue.impact}\n\n`
    }
  }
  
  description += '\n---\n'
  description += 'Generated by [Repository Grader](https://github.com/your-repo-grader-url)'
  
  return description
} 
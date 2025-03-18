'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { GitHubLogoIcon, UpdateIcon } from '@radix-ui/react-icons'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createGithubPR } from '@/app/actions'
import { CodeAnalysisIssue } from '@/utils/analyzeCode'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface GitHubPRButtonProps {
  issues: CodeAnalysisIssue[]
  repoUrl: string
}

export function GitHubPRButton({ issues, repoUrl }: GitHubPRButtonProps) {
  const [open, setOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [branchName, setBranchName] = useState('repo-grader-fixes')
  const [result, setResult] = useState<{
    success?: boolean
    message?: string
    prUrl?: string
  }>({})
  
  const fixableIssues = issues.filter(issue => issue.codeExample && issue.codeSnippet)
  const hasFixableIssues = fixableIssues.length > 0
  
  const handleCreatePR = async () => {
    setIsCreating(true)
    setResult({})
    
    try {
      const response = await createGithubPR(repoUrl, issues, branchName)
      
      setResult(response)
      
      if (response.success) {
        toast.success('Pull request created successfully!')
      } else {
        toast.error(response.message || 'Failed to create pull request')
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred'
      })
      toast.error('Failed to create pull request')
    } finally {
      setIsCreating(false)
    }
  }
  
  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white border-0"
        disabled={!hasFixableIssues}
      >
        <GitHubLogoIcon className="w-4 h-4" />
        Apply Fixes with GitHub PR
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px] bg-gray-900 text-white border border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Create GitHub Pull Request
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              This will create a PR with fixes for {fixableIssues.length} issues in your repository.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="branch-name">Branch Name</Label>
              <Input
                id="branch-name"
                value={branchName}
                onChange={e => setBranchName(e.target.value)}
                placeholder="Branch name for PR"
                className="bg-gray-800 border-gray-700 text-white"
                disabled={isCreating || !!result.prUrl}
              />
            </div>
            
            {result.prUrl && (
              <div className="p-4 rounded-lg bg-green-950 border border-green-900 text-green-200">
                <p className="mb-2">Pull request created successfully!</p>
                <a
                  href={result.prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline break-all"
                >
                  {result.prUrl}
                </a>
              </div>
            )}
            
            {result.message && !result.success && (
              <div className="p-4 rounded-lg bg-red-950 border border-red-900 text-red-200">
                <p>{result.message}</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            {!result.prUrl && (
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                disabled={isCreating}
              >
                Cancel
              </Button>
            )}
            
            {!result.prUrl && (
              <Button
                onClick={handleCreatePR}
                disabled={isCreating || !branchName}
                className="gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white border-0"
              >
                {isCreating ? (
                  <>
                    <UpdateIcon className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create PR'
                )}
              </Button>
            )}
            
            {result.prUrl && (
              <Button
                onClick={() => setOpen(false)}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0"
              >
                Done
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 
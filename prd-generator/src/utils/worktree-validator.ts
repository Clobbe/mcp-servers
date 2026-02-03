import { execSync } from 'child_process';
import path from 'path';

export interface WorktreeValidation {
  isWorktree: boolean;
  suggestion?: string;
  worktreeName?: string;
  branchName?: string;
}

/**
 * Check if the current directory is a git worktree
 */
function isInWorktree(): boolean {
  try {
    const gitCommonDir = execSync('git rev-parse --git-common-dir 2>/dev/null', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();

    return gitCommonDir.includes('.git/worktrees');
  } catch {
    return false;
  }
}

/**
 * Get current git repository name
 */
function getRepoName(): string {
  try {
    const toplevel = execSync('git rev-parse --show-toplevel 2>/dev/null', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();

    return path.basename(toplevel);
  } catch {
    return 'repo';
  }
}

/**
 * Sanitize feature name for use in git branch and worktree names
 */
function sanitizeFeatureName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

/**
 * Generate worktree suggestion message
 */
function generateSuggestion(featureName: string): string {
  const repoName = getRepoName();
  const sanitized = sanitizeFeatureName(featureName);
  const branchName = `feature/${sanitized}`;
  const worktreePath = `../${repoName}-${sanitized}`;

  return `
💡 RECOMMENDATION: PRD/Ralph workflows work best in isolated git worktrees.

Benefits:
  • Clean isolation from your main working directory
  • Safe experimentation without affecting main branch
  • Easy rollback if generated code needs revision
  • Better organization for feature development

Suggested setup:
  git worktree add -b "${branchName}" "${worktreePath}"
  cd "${worktreePath}"

Then retry your command in the new worktree.

⚠️  Proceeding without worktree isolation. Changes will be made to your current working directory.
`.trim();
}

/**
 * Validate worktree setup and provide suggestions
 */
export function validateWorktree(featureName: string): WorktreeValidation {
  const isWorktree = isInWorktree();

  if (isWorktree) {
    return {
      isWorktree: true,
    };
  }

  const sanitized = sanitizeFeatureName(featureName);
  const suggestion = generateSuggestion(featureName);

  return {
    isWorktree: false,
    suggestion,
    worktreeName: `${getRepoName()}-${sanitized}`,
    branchName: `feature/${sanitized}`,
  };
}

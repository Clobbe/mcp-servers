// Git operations for changelog management
import { exec } from 'child_process';
import { promisify } from 'util';
import type { GitCommit, GitStatus } from './types.js';

const execAsync = promisify(exec);

/**
 * Check if current directory is a git repository
 */
export async function isGitRepository(cwd: string = process.cwd()): Promise<boolean> {
  try {
    await execAsync('git rev-parse --git-dir', { cwd });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get git status (staged and unstaged changes)
 */
export async function getGitStatus(cwd: string = process.cwd()): Promise<GitStatus> {
  const status: GitStatus = {
    added: [],
    modified: [],
    deleted: [],
    renamed: [],
    untracked: [],
  };

  try {
    const { stdout } = await execAsync('git status --short', { cwd });
    const lines = stdout.trim().split('\n').filter(Boolean);

    for (const line of lines) {
      const statusCode = line.substring(0, 2).trim();
      const filePath = line.substring(3);

      if (statusCode === '??' || statusCode === 'A') {
        status.added.push(filePath);
      } else if (statusCode === 'M' || statusCode === 'MM') {
        status.modified.push(filePath);
      } else if (statusCode === 'D') {
        status.deleted.push(filePath);
      } else if (statusCode === 'R') {
        status.renamed.push(filePath);
      }
    }

    return status;
  } catch (error) {
    throw new Error(`Failed to get git status: ${error}`);
  }
}

/**
 * Get recent commits since a specific date or tag
 */
export async function getRecentCommits(
  since?: string,
  limit: number = 10,
  cwd: string = process.cwd()
): Promise<GitCommit[]> {
  try {
    let command = 'git log --no-merges --pretty=format:"%H|%s|%an|%ai"';
    
    if (since) {
      command += ` --since="${since}"`;
    } else {
      command += ` -${limit}`;
    }

    const { stdout } = await execAsync(command, { cwd });
    const lines = stdout.trim().split('\n').filter(Boolean);

    const commits: GitCommit[] = [];
    for (const line of lines) {
      const [hash, message, author, date] = line.split('|');
      
      // Get files changed in this commit
      const filesCmd = `git diff-tree --no-commit-id --name-only -r ${hash}`;
      const { stdout: filesOutput } = await execAsync(filesCmd, { cwd });
      const files = filesOutput.trim().split('\n').filter(Boolean);

      commits.push({
        hash,
        message,
        author,
        date,
        files,
      });
    }

    return commits;
  } catch (error) {
    throw new Error(`Failed to get recent commits: ${error}`);
  }
}

/**
 * Get the last git tag
 */
export async function getLastTag(cwd: string = process.cwd()): Promise<string | null> {
  try {
    const { stdout } = await execAsync('git describe --tags --abbrev=0', { cwd });
    return stdout.trim();
  } catch {
    return null;
  }
}

/**
 * Get commits since the last tag
 */
export async function getCommitsSinceLastTag(cwd: string = process.cwd()): Promise<GitCommit[]> {
  const lastTag = await getLastTag(cwd);
  
  if (!lastTag) {
    return getRecentCommits(undefined, 10, cwd);
  }

  try {
    const command = `git log ${lastTag}..HEAD --no-merges --pretty=format:"%H|%s|%an|%ai"`;
    const { stdout } = await execAsync(command, { cwd });
    const lines = stdout.trim().split('\n').filter(Boolean);

    const commits: GitCommit[] = [];
    for (const line of lines) {
      const [hash, message, author, date] = line.split('|');
      
      const filesCmd = `git diff-tree --no-commit-id --name-only -r ${hash}`;
      const { stdout: filesOutput } = await execAsync(filesCmd, { cwd });
      const files = filesOutput.trim().split('\n').filter(Boolean);

      commits.push({
        hash,
        message,
        author,
        date,
        files,
      });
    }

    return commits;
  } catch (error) {
    throw new Error(`Failed to get commits since last tag: ${error}`);
  }
}

/**
 * Get diff statistics
 */
export async function getDiffStats(cwd: string = process.cwd()): Promise<string> {
  try {
    const { stdout } = await execAsync('git diff --stat', { cwd });
    return stdout;
  } catch (error) {
    throw new Error(`Failed to get diff stats: ${error}`);
  }
}

/**
 * Categorize commit by conventional commit format
 */
export function categorizeCommit(message: string): {
  type: string | null;
  scope: string | null;
  description: string;
  isBreaking: boolean;
} {
  // Match conventional commit format: type(scope): description
  const conventionalRegex = /^(feat|fix|docs|style|refactor|perf|test|chore|build|ci|revert)(\(([^)]+)\))?(!)?:\s*(.+)$/i;
  const match = message.match(conventionalRegex);

  if (match) {
    const [, type, , scope, breakingMarker, description] = match;
    return {
      type: type.toLowerCase(),
      scope: scope || null,
      description: description.trim(),
      isBreaking: breakingMarker === '!' || message.includes('BREAKING CHANGE'),
    };
  }

  // Check for breaking change in body
  const isBreaking = message.toLowerCase().includes('breaking change');

  return {
    type: null,
    scope: null,
    description: message,
    isBreaking,
  };
}

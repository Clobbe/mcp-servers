import { exec } from 'child_process';
import { promisify } from 'util';
import type { GitOperationResult } from '../types/common.js';

const execAsync = promisify(exec);

/**
 * Execute git command with error handling
 */
export async function execGitCommand(
  command: string,
  cwd?: string
): Promise<GitOperationResult> {
  try {
    const { stdout, stderr } = await execAsync(command, { cwd });
    return { success: true, output: stdout || stderr };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get git status
 */
export async function getGitStatus(cwd?: string): Promise<GitOperationResult> {
  return execGitCommand('git status --porcelain', cwd);
}

/**
 * Get current git branch
 */
export async function getCurrentBranch(cwd?: string): Promise<string> {
  const result = await execGitCommand('git branch --show-current', cwd);
  return result.output?.trim() || '';
}

/**
 * Check if directory is a git repository
 */
export async function isGitRepository(cwd?: string): Promise<boolean> {
  const result = await execGitCommand('git rev-parse --git-dir', cwd);
  return result.success;
}

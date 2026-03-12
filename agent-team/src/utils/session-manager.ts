import { existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { join } from 'path';

/**
 * Get the session directory path for a given working directory.
 */
export function getSessionDir(cwd: string): string {
  return join(cwd, '.pi', 'agent-sessions');
}

/**
 * Ensure the session directory exists and return its path.
 */
export function ensureSessionDir(cwd: string): string {
  const dir = getSessionDir(cwd);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Get the session file path for a team agent.
 * Uses the `{agentKey}.json` naming convention.
 */
export function getAgentSessionPath(cwd: string, agentKey: string): string {
  const dir = ensureSessionDir(cwd);
  return join(dir, `${agentKey}.json`);
}

/**
 * Normalise an agent name into a filesystem-safe key.
 */
export function toAgentKey(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Check whether a session file exists for the given agent key.
 */
export function hasSession(cwd: string, agentKey: string): boolean {
  const path = join(getSessionDir(cwd), `${agentKey}.json`);
  return existsSync(path);
}

/**
 * Clear all team agent session files (non-chain-prefixed .json files).
 * Returns the list of deleted filenames.
 */
export function clearAgentSessions(cwd: string, agentKey?: string): string[] {
  const dir = getSessionDir(cwd);
  if (!existsSync(dir)) return [];

  const cleared: string[] = [];

  try {
    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.json')) continue;
      const isTarget = agentKey ? file === `${agentKey}.json` : !file.startsWith('chain-');

      if (isTarget) {
        try {
          unlinkSync(join(dir, file));
          cleared.push(file);
        } catch {
          // skip locked or already-deleted files
        }
      }
    }
  } catch {
    // directory not readable
  }

  return cleared;
}

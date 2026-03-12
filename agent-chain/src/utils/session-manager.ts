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
 * Get the session file path for a chain agent step.
 * Uses the `chain-{agentKey}.json` naming convention from the Pi extension.
 */
export function getChainSessionPath(cwd: string, agentKey: string): string {
  const dir = ensureSessionDir(cwd);
  return join(dir, `chain-${agentKey}.json`);
}

/**
 * Normalise an agent name into a filesystem-safe key.
 */
export function toAgentKey(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Clear chain session files from the session directory.
 * If agentKey is omitted, all `chain-*.json` files are removed.
 * Returns the list of deleted filenames.
 */
export function clearChainSessions(cwd: string, agentKey?: string): string[] {
  const dir = getSessionDir(cwd);
  if (!existsSync(dir)) return [];

  const cleared: string[] = [];

  try {
    for (const file of readdirSync(dir)) {
      const isChainFile = file.startsWith('chain-') && file.endsWith('.json');
      const isTarget = agentKey ? file === `chain-${agentKey}.json` : isChainFile;

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

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * Parse teams YAML format into a map of team name → member names.
 * Ported from the Pi extension's parseTeamsYaml().
 *
 * Format:
 *   team-name:
 *     - agent-name-1
 *     - agent-name-2
 */
export function parseTeamsYaml(raw: string): Record<string, string[]> {
  const teams: Record<string, string[]> = {};
  let current: string | null = null;

  for (const line of raw.split('\n')) {
    const teamMatch = line.match(/^(\S[^:]*):$/);
    if (teamMatch) {
      current = teamMatch[1].trim();
      teams[current] = [];
      continue;
    }

    const itemMatch = line.match(/^\s+-\s+(.+)$/);
    if (itemMatch && current) {
      teams[current].push(itemMatch[1].trim());
    }
  }

  return teams;
}

/**
 * Find the teams YAML config file, checking standard locations.
 */
export function findTeamsConfig(cwd: string, configPath?: string): string | null {
  if (configPath) {
    return existsSync(configPath) ? configPath : null;
  }

  const candidates = [
    join(cwd, '.pi', 'agents', 'teams.yaml'),
    join(cwd, '.claude', 'agents', 'teams.yaml'),
    join(cwd, 'agents', 'teams.yaml'),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  return null;
}

/**
 * Load and parse teams from a config file path.
 */
export function loadTeams(configPath: string): Record<string, string[]> {
  try {
    const raw = readFileSync(configPath, 'utf-8');
    return parseTeamsYaml(raw);
  } catch {
    return {};
  }
}

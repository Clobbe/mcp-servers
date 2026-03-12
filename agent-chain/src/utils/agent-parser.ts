import { existsSync, readFileSync, readdirSync } from 'fs';
import { join, resolve } from 'path';
import type { AgentDef } from './types.js';

/**
 * Parse a .md agent definition file with YAML frontmatter.
 * Ported from the Pi extension's parseAgentFile().
 *
 * Format:
 *   ---
 *   name: agent-name
 *   description: What this agent does
 *   tools: read,grep,find,ls
 *   ---
 *   System prompt body here...
 */
export function parseAgentFile(filePath: string): AgentDef | null {
  try {
    const raw = readFileSync(filePath, 'utf-8');
    const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) return null;

    const frontmatter: Record<string, string> = {};
    for (const line of match[1].split('\n')) {
      const idx = line.indexOf(':');
      if (idx > 0) {
        frontmatter[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
      }
    }

    if (!frontmatter['name']) return null;

    return {
      name: frontmatter['name'],
      description: frontmatter['description'] ?? '',
      tools: frontmatter['tools'] ?? 'read,grep,find,ls',
      systemPrompt: match[2].trim(),
      filePath,
    };
  } catch {
    return null;
  }
}

/**
 * Scan standard agent directories for .md agent definitions.
 * Checks: agents/, .claude/agents/, .pi/agents/
 * Ported from the Pi extension's scanAgentDirs().
 */
export function scanAgentDirs(cwd: string): Map<string, AgentDef> {
  const dirs = [
    join(cwd, 'agents'),
    join(cwd, '.claude', 'agents'),
    join(cwd, '.pi', 'agents'),
  ];

  const agents = new Map<string, AgentDef>();

  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    try {
      for (const file of readdirSync(dir)) {
        if (!file.endsWith('.md')) continue;
        const fullPath = resolve(dir, file);
        const def = parseAgentFile(fullPath);
        if (def && !agents.has(def.name.toLowerCase())) {
          agents.set(def.name.toLowerCase(), def);
        }
      }
    } catch {
      // skip unreadable directories
    }
  }

  return agents;
}

/**
 * Look up a single agent by name (case-insensitive) from the scanned dirs.
 */
export function findAgent(cwd: string, agentName: string): AgentDef | null {
  const agents = scanAgentDirs(cwd);
  return agents.get(agentName.toLowerCase()) ?? null;
}

import { findTeamsConfig, loadTeams } from '../utils/team-parser.js';
import { scanAgentDirs } from '../utils/agent-parser.js';
import type { TeamDef } from '../utils/types.js';

export const teamLoadSchema = {
  name: 'team_load',
  description:
    'Load a specific team definition with all member agent configs fully resolved. ' +
    'Returns each agent\'s name, description, tools, and system prompt ' +
    '(loaded from .md files in agents/, .claude/agents/, .pi/agents/). ' +
    'Use this to inspect a team before dispatching tasks.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      team_name: {
        type: 'string',
        description: 'Name of the team to load',
      },
      cwd: {
        type: 'string',
        description: 'Project directory (default: process.cwd())',
      },
      config_path: {
        type: 'string',
        description: 'Explicit path to teams.yaml (overrides cwd scan)',
      },
    },
    required: ['team_name'],
  },
};

export interface TeamLoadArgs {
  team_name: string;
  cwd?: string;
  config_path?: string;
}

export interface TeamLoadToolResult {
  summary: string;
  data?: TeamDef;
}

export function teamLoad(args: TeamLoadArgs): TeamLoadToolResult {
  const cwd = args.cwd ?? process.cwd();
  const configPath = findTeamsConfig(cwd, args.config_path);

  if (!configPath) {
    return {
      summary:
        '⚠️  No teams.yaml found. Provide a config_path or create one in .pi/agents/, .claude/agents/, or agents/.',
    };
  }

  const teams = loadTeams(configPath);

  if (!teams[args.team_name]) {
    const available = Object.keys(teams).join(', ');
    return {
      summary: `❌ Team "${args.team_name}" not found. Available teams: ${available || 'none'}`,
    };
  }

  const members = teams[args.team_name];
  const allAgents = scanAgentDirs(cwd);
  const missingAgents: string[] = [];

  const resolvedAgents = members.map((memberName) => {
    const agentDef = allAgents.get(memberName.toLowerCase());
    if (!agentDef) {
      missingAgents.push(memberName);
    }
    return agentDef ?? null;
  });

  const resolvedDefs = resolvedAgents.filter((a) => a !== null);

  const result: TeamDef = {
    name: args.team_name,
    members,
    agents: resolvedDefs,
    missingAgents,
  };

  const agentLines = members.map((name) => {
    const def = allAgents.get(name.toLowerCase());
    const status = def ? '✓' : '✗ (not found)';
    const desc = def?.description ? ` — ${def.description}` : '';
    return `  • [${name}] ${status}${desc}`;
  });

  const warning =
    missingAgents.length > 0
      ? `\n\n⚠️  Missing agents: ${missingAgents.join(', ')} — add .md files to your agents/ directory.`
      : '';

  return {
    summary:
      `✅ Team "${args.team_name}" (${members.length} members):\n\n` +
      agentLines.join('\n') +
      warning,
    data: result,
  };
}

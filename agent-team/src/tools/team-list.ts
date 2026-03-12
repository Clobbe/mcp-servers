import { findTeamsConfig, loadTeams } from '../utils/team-parser.js';
import type { TeamListEntry } from '../utils/types.js';

export const teamListSchema = {
  name: 'team_list',
  description:
    'List all available agent teams defined in teams.yaml. ' +
    'Scans standard config locations: .pi/agents/, .claude/agents/, agents/. ' +
    'Returns team names and their member agent names.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      cwd: {
        type: 'string',
        description: 'Project directory to search for teams config (default: process.cwd())',
      },
      config_path: {
        type: 'string',
        description: 'Explicit path to teams.yaml (overrides cwd scan)',
      },
    },
    required: [],
  },
};

export interface TeamListArgs {
  cwd?: string;
  config_path?: string;
}

export interface TeamListToolResult {
  summary: string;
  data?: {
    configPath: string;
    teams: TeamListEntry[];
  };
}

export function teamList(args: TeamListArgs): TeamListToolResult {
  const cwd = args.cwd ?? process.cwd();
  const configPath = findTeamsConfig(cwd, args.config_path);

  if (!configPath) {
    return {
      summary:
        '⚠️  No teams.yaml found. ' +
        'Create one at .pi/agents/teams.yaml, .claude/agents/teams.yaml, or agents/teams.yaml.',
    };
  }

  const teams = loadTeams(configPath);
  const teamNames = Object.keys(teams);

  if (teamNames.length === 0) {
    return {
      summary: `⚠️  Found config at ${configPath} but no teams were parsed. Check the YAML format.`,
      data: { configPath, teams: [] },
    };
  }

  const entries: TeamListEntry[] = teamNames.map((name) => ({
    name,
    memberCount: teams[name].length,
    members: teams[name],
  }));

  const lines = entries.map(
    (t) => `  • ${t.name} (${t.memberCount} members: ${t.members.join(', ')})`
  );

  return {
    summary: `✅ Found ${teamNames.length} team(s) in ${configPath}:\n\n${lines.join('\n')}`,
    data: { configPath, teams: entries },
  };
}

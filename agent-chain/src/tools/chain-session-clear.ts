import { clearChainSessions, toAgentKey, getSessionDir } from '../utils/session-manager.js';
import { existsSync } from 'fs';

export const chainSessionClearSchema = {
  name: 'chain_session_clear',
  description:
    'Clear agent session files from .pi/agent-sessions/ to reset chain context. ' +
    'Sessions are created when using chain_run with an executor_command. ' +
    'Omit agent_name to clear all chain session files (full reset).',
  inputSchema: {
    type: 'object' as const,
    properties: {
      cwd: {
        type: 'string',
        description: 'Project directory containing .pi/agent-sessions/ (default: process.cwd())',
      },
      agent_name: {
        type: 'string',
        description: 'Clear only this agent\'s session file (omit to clear all chain sessions)',
      },
    },
    required: [],
  },
};

export interface ChainSessionClearArgs {
  cwd?: string;
  agent_name?: string;
}

export interface ChainSessionClearResult {
  summary: string;
  data?: {
    sessionDir: string;
    cleared: string[];
  };
}

export function chainSessionClear(args: ChainSessionClearArgs): ChainSessionClearResult {
  const cwd = args.cwd ?? process.cwd();
  const sessionDir = getSessionDir(cwd);

  if (!existsSync(sessionDir)) {
    return {
      summary: `ℹ️  No session directory found at ${sessionDir} — nothing to clear.`,
      data: { sessionDir, cleared: [] },
    };
  }

  const agentKey = args.agent_name ? toAgentKey(args.agent_name) : undefined;
  const cleared = clearChainSessions(cwd, agentKey);

  if (cleared.length === 0) {
    const scope = agentKey ? `for agent "${args.agent_name}"` : '(no chain session files exist)';
    return {
      summary: `ℹ️  No session files cleared ${scope}.`,
      data: { sessionDir, cleared: [] },
    };
  }

  const scope = agentKey
    ? `agent "${args.agent_name}"`
    : `all chain agents (${cleared.length} file${cleared.length === 1 ? '' : 's'})`;

  return {
    summary: `✅ Cleared sessions for ${scope}:\n${cleared.map((f) => `  • ${f}`).join('\n')}`,
    data: { sessionDir, cleared },
  };
}

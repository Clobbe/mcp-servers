import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { findTeamsConfig, loadTeams } from '../utils/team-parser.js';
import { findAgent } from '../utils/agent-parser.js';
import {
  getAgentSessionPath,
  toAgentKey,
  ensureSessionDir,
  hasSession,
} from '../utils/session-manager.js';
import type { AgentDef, AgentContext, DispatchResult } from '../utils/types.js';

export const teamDispatchSchema = {
  name: 'team_dispatch',
  description:
    'Dispatch a task to a specific agent within a team. ' +
    'Without executor_command, returns the agent\'s full context (system prompt, tools, suggested prompt) ' +
    'for the calling agent to use directly. ' +
    'With executor_command (e.g. "claude -p"), spawns a subprocess and captures the agent\'s output. ' +
    'Session files are stored in .pi/agent-sessions/ — use resume_session: true to continue a previous session.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      team_name: {
        type: 'string',
        description: 'Name of the team the agent belongs to',
      },
      agent_name: {
        type: 'string',
        description: 'Name of the agent to dispatch to (case-insensitive)',
      },
      task: {
        type: 'string',
        description: 'Task description to send to the agent',
      },
      cwd: {
        type: 'string',
        description: 'Project directory (default: process.cwd())',
      },
      config_path: {
        type: 'string',
        description: 'Explicit path to teams.yaml (overrides cwd scan)',
      },
      executor_command: {
        type: 'string',
        description:
          'CLI command to execute the agent (e.g. "claude -p"). ' +
          'The combined system prompt + task is appended as a JSON-quoted argument. ' +
          'If omitted, returns agent context for the caller to handle.',
      },
      resume_session: {
        type: 'boolean',
        description:
          'Resume the agent\'s previous session if one exists (passes -c flag to executor). Default: false.',
      },
      timeout_ms: {
        type: 'number',
        description: 'Execution timeout in milliseconds (default: 120000)',
      },
    },
    required: ['team_name', 'agent_name', 'task'],
  },
};

export interface TeamDispatchArgs {
  team_name: string;
  agent_name: string;
  task: string;
  cwd?: string;
  config_path?: string;
  executor_command?: string;
  resume_session?: boolean;
  timeout_ms?: number;
}

export interface TeamDispatchToolResult {
  summary: string;
  data?: DispatchResult;
}

function buildFullPrompt(agentDef: AgentDef, task: string): string {
  if (!agentDef.systemPrompt) return task;
  return `${agentDef.systemPrompt}\n\n---\n\n${task}`;
}

function buildAgentContext(agentDef: AgentDef, task: string): AgentContext {
  return {
    name: agentDef.name,
    description: agentDef.description,
    tools: agentDef.tools,
    systemPrompt: agentDef.systemPrompt,
    suggestedPrompt: buildFullPrompt(agentDef, task),
  };
}

function runAgentSubprocess(
  fullPrompt: string,
  executor: string,
  cwd: string,
  agentKey: string,
  resumeSession: boolean,
  timeoutMs: number
): { output: string; error?: string } {
  const sessionPath = getAgentSessionPath(cwd, agentKey);
  const sessionExists = existsSync(sessionPath);
  const shouldResume = resumeSession && sessionExists;

  const sessionArg = ` --session ${JSON.stringify(sessionPath)}`;
  const resumeArg = shouldResume ? ' -c' : '';
  const command = `${executor}${sessionArg}${resumeArg} ${JSON.stringify(fullPrompt)}`;

  try {
    const output = execSync(command, {
      cwd,
      timeout: timeoutMs,
      encoding: 'utf-8',
      stdio: 'pipe',
      env: { ...process.env },
    });
    return { output: output.trim() };
  } catch (err: unknown) {
    const e = err as Record<string, unknown>;
    const stderr = (e['stderr'] as Buffer | string | undefined)?.toString().trim() ?? '';
    const stdout = (e['stdout'] as Buffer | string | undefined)?.toString().trim() ?? '';
    const message = err instanceof Error ? err.message : String(err);
    return { output: stdout, error: stderr || message };
  }
}

function validateTeamMember(
  teams: Record<string, string[]>,
  teamName: string,
  agentName: string
): string | null {
  const members = teams[teamName];
  if (!members) return `Team "${teamName}" not found.`;
  const isMember = members.some((m) => m.toLowerCase() === agentName.toLowerCase());
  if (!isMember) {
    return (
      `Agent "${agentName}" is not a member of team "${teamName}". ` +
      `Team members: ${members.join(', ')}`
    );
  }
  return null;
}

export function teamDispatch(args: TeamDispatchArgs): TeamDispatchToolResult {
  const cwd = args.cwd ?? process.cwd();
  const configPath = findTeamsConfig(cwd, args.config_path);

  if (!configPath) {
    return {
      summary:
        '⚠️  No teams.yaml found. Provide a config_path or create one in .pi/agents/, .claude/agents/, or agents/.',
    };
  }

  const teams = loadTeams(configPath);
  const memberError = validateTeamMember(teams, args.team_name, args.agent_name);
  if (memberError) {
    return { summary: `❌ ${memberError}` };
  }

  const agentDef = findAgent(cwd, args.agent_name);
  if (!agentDef) {
    return {
      summary:
        `❌ Agent "${args.agent_name}" definition not found in agents/, .claude/agents/, or .pi/agents/.\n` +
        'Create a .md file with valid frontmatter for this agent.',
    };
  }

  // No executor → return agent context for the calling agent to use directly
  if (!args.executor_command) {
    const agentContext = buildAgentContext(agentDef, args.task);
    const result: DispatchResult = {
      team: args.team_name,
      agent: agentDef.name,
      task: args.task,
      status: 'dry-run',
      output: agentContext.suggestedPrompt,
      elapsed: 0,
      agentContext,
    };
    return {
      summary:
        `📋 Agent context for "${agentDef.name}" (no executor — use the returned prompt directly):\n\n` +
        `Description: ${agentDef.description}\n` +
        `Tools: ${agentDef.tools}`,
      data: result,
    };
  }

  // With executor → spawn subprocess
  ensureSessionDir(cwd);
  const agentKey = toAgentKey(agentDef.name);
  const sessionExists = hasSession(cwd, agentKey);
  const fullPrompt = buildFullPrompt(agentDef, args.task);
  const timeoutMs = args.timeout_ms ?? 120_000;
  const start = Date.now();

  const { output, error } = runAgentSubprocess(
    fullPrompt,
    args.executor_command,
    cwd,
    agentKey,
    args.resume_session === true,
    timeoutMs
  );

  const elapsed = Date.now() - start;
  const status = error ? 'error' : 'done';
  const icon = status === 'done' ? '✅' : '❌';
  const sessionNote = sessionExists && args.resume_session ? ' (resumed session)' : '';

  const result: DispatchResult = {
    team: args.team_name,
    agent: agentDef.name,
    task: args.task,
    status,
    output,
    elapsed,
    ...(error ? { error } : {}),
  };

  return {
    summary:
      `${icon} [${agentDef.name}]${sessionNote} ${status} in ${Math.round(elapsed / 1000)}s\n\n` +
      (error ? `Error: ${error}\n\n` : '') +
      `Output:\n${output.slice(0, 500)}${output.length > 500 ? '\n…(truncated)' : ''}`,
    data: result,
  };
}

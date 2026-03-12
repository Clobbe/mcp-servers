import { findAgent } from '../utils/agent-parser.js';
import type { AgentContext } from '../utils/types.js';

export const agentGetSchema = {
  name: 'agent_get',
  description:
    'Get the full definition for a specific agent: name, description, tools, and complete system prompt. ' +
    'Also returns a suggested prompt template showing how to invoke the agent for a task. ' +
    'Use this to understand what an agent does before dispatching work to it.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      agent_name: {
        type: 'string',
        description: 'Agent name (case-insensitive)',
      },
      task: {
        type: 'string',
        description: 'Optional task description — included in the suggested prompt output',
      },
      cwd: {
        type: 'string',
        description: 'Project directory to scan for agent .md files (default: process.cwd())',
      },
    },
    required: ['agent_name'],
  },
};

export interface AgentGetArgs {
  agent_name: string;
  task?: string;
  cwd?: string;
}

export interface AgentGetToolResult {
  summary: string;
  data?: AgentContext;
}

export function agentGet(args: AgentGetArgs): AgentGetToolResult {
  const cwd = args.cwd ?? process.cwd();
  const agentDef = findAgent(cwd, args.agent_name);

  if (!agentDef) {
    return {
      summary:
        `❌ Agent "${args.agent_name}" not found in agents/, .claude/agents/, or .pi/agents/.\n` +
        'Check the agent name (case-insensitive) or verify the .md file exists and has valid frontmatter.',
    };
  }

  const taskLine = args.task ? `\n\nTask:\n${args.task}` : '';
  const suggestedPrompt = `${agentDef.systemPrompt}${taskLine}`;

  const result: AgentContext = {
    name: agentDef.name,
    description: agentDef.description,
    tools: agentDef.tools,
    systemPrompt: agentDef.systemPrompt,
    suggestedPrompt,
  };

  return {
    summary:
      `✅ Agent: ${agentDef.name}\n` +
      `Description: ${agentDef.description || '(none)'}\n` +
      `Tools: ${agentDef.tools}\n` +
      `Source: ${agentDef.filePath}\n\n` +
      `System Prompt:\n${agentDef.systemPrompt.slice(0, 300)}${agentDef.systemPrompt.length > 300 ? '…' : ''}`,
    data: result,
  };
}

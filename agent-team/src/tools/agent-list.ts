import { scanAgentDirs } from '../utils/agent-parser.js';

export const agentListSchema = {
  name: 'agent_list',
  description:
    'List all agent definitions found in the standard agent directories ' +
    '(agents/, .claude/agents/, .pi/agents/). ' +
    'Returns each agent\'s name, description, and available tools.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      cwd: {
        type: 'string',
        description: 'Project directory to scan for agent .md files (default: process.cwd())',
      },
    },
    required: [],
  },
};

export interface AgentListArgs {
  cwd?: string;
}

export interface AgentListEntry {
  name: string;
  description: string;
  tools: string;
  filePath: string;
}

export interface AgentListToolResult {
  summary: string;
  data?: {
    cwd: string;
    agents: AgentListEntry[];
  };
}

export function agentList(args: AgentListArgs): AgentListToolResult {
  const cwd = args.cwd ?? process.cwd();
  const agentMap = scanAgentDirs(cwd);

  if (agentMap.size === 0) {
    return {
      summary:
        `⚠️  No agent .md files found in ${cwd}.\n` +
        'Add agent definition files to agents/, .claude/agents/, or .pi/agents/.\n\n' +
        'Each file should have YAML frontmatter with name, description, and tools fields.',
    };
  }

  const agents: AgentListEntry[] = Array.from(agentMap.values()).map((def) => ({
    name: def.name,
    description: def.description,
    tools: def.tools,
    filePath: def.filePath,
  }));

  const lines = agents.map(
    (a) =>
      `  • ${a.name}\n` +
      `    ${a.description || '(no description)'}\n` +
      `    tools: ${a.tools}`
  );

  return {
    summary: `✅ Found ${agents.length} agent(s):\n\n${lines.join('\n\n')}`,
    data: { cwd, agents },
  };
}

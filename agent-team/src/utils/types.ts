/**
 * Types for the agent-team MCP server.
 */

export interface AgentDef {
  name: string;
  description: string;
  tools: string;
  systemPrompt: string;
  filePath: string;
}

export interface TeamDef {
  name: string;
  members: string[];
  agents: AgentDef[];
  missingAgents: string[];
}

export interface TeamListEntry {
  name: string;
  memberCount: number;
  members: string[];
}

export interface DispatchResult {
  team: string;
  agent: string;
  task: string;
  status: 'done' | 'error' | 'dry-run';
  output: string;
  elapsed: number;
  error?: string;
  agentContext?: AgentContext;
}

export interface AgentContext {
  name: string;
  description: string;
  tools: string;
  systemPrompt: string;
  suggestedPrompt: string;
}

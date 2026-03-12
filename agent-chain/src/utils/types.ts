/**
 * Types for the agent-chain MCP server.
 */

export interface ChainStep {
  agent: string;
  prompt: string;
}

export interface ChainDef {
  name: string;
  description: string;
  steps: ChainStep[];
}

export interface AgentDef {
  name: string;
  description: string;
  tools: string;
  systemPrompt: string;
  filePath: string;
}

export interface ResolvedStep {
  index: number;
  agentName: string;
  promptTemplate: string;
  resolvedPrompt: string;
  agentDef: AgentDef | null;
}

export interface StepResult {
  index: number;
  agentName: string;
  status: 'done' | 'error' | 'dry-run';
  resolvedPrompt: string;
  output: string;
  elapsed: number;
  error?: string;
}

export interface ChainRunResult {
  chain: string;
  task: string;
  status: 'done' | 'error';
  steps: StepResult[];
  finalOutput: string;
  elapsed: number;
  dryRun: boolean;
}

export interface ChainListEntry {
  name: string;
  description: string;
  stepCount: number;
  agents: string[];
}

export interface ChainLoadResult {
  name: string;
  description: string;
  steps: ResolvedStep[];
  missingAgents: string[];
}

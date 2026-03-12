import { findChainConfig, loadChains } from '../utils/chain-parser.js';
import { scanAgentDirs } from '../utils/agent-parser.js';
import type { ChainLoadResult, ResolvedStep } from '../utils/types.js';

export const chainLoadSchema = {
  name: 'chain_load',
  description:
    'Load a specific chain definition with all agent configs fully resolved. ' +
    'Returns the chain steps, their prompt templates, and the system prompt + tools ' +
    'for each agent (loaded from .md files in agents/, .claude/agents/, .pi/agents/). ' +
    'Use this to inspect a chain before running it.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      chain_name: {
        type: 'string',
        description: 'Name of the chain to load',
      },
      cwd: {
        type: 'string',
        description: 'Project directory (default: process.cwd())',
      },
      config_path: {
        type: 'string',
        description: 'Explicit path to agent-chain.yaml (overrides cwd scan)',
      },
    },
    required: ['chain_name'],
  },
};

export interface ChainLoadArgs {
  chain_name: string;
  cwd?: string;
  config_path?: string;
}

export interface ChainLoadToolResult {
  summary: string;
  data?: ChainLoadResult;
}

export function chainLoad(args: ChainLoadArgs): ChainLoadToolResult {
  const cwd = args.cwd ?? process.cwd();
  const configPath = findChainConfig(cwd, args.config_path);

  if (!configPath) {
    return {
      summary:
        '⚠️  No agent-chain.yaml found. ' +
        'Provide a config_path or create one in .pi/agents/, .claude/agents/, or agents/.',
    };
  }

  const chains = loadChains(configPath);
  const chain = chains.find((c) => c.name === args.chain_name);

  if (!chain) {
    const available = chains.map((c) => c.name).join(', ');
    return {
      summary: `❌ Chain "${args.chain_name}" not found. Available chains: ${available || 'none'}`,
    };
  }

  const allAgents = scanAgentDirs(cwd);
  const missingAgents: string[] = [];

  const steps: ResolvedStep[] = chain.steps.map((step, index) => {
    const agentDef = allAgents.get(step.agent.toLowerCase()) ?? null;
    if (!agentDef && !missingAgents.includes(step.agent)) {
      missingAgents.push(step.agent);
    }
    return {
      index,
      agentName: step.agent,
      promptTemplate: step.prompt,
      resolvedPrompt: step.prompt, // unresolved at load time — use chain_step_prompt to fill
      agentDef,
    };
  });

  const result: ChainLoadResult = {
    name: chain.name,
    description: chain.description,
    steps,
    missingAgents,
  };

  const stepLines = steps.map((s) => {
    const agentStatus = s.agentDef ? '✓' : '✗ (not found)';
    return `  Step ${s.index + 1}: [${s.agentName}] ${agentStatus}\n    Prompt: ${s.promptTemplate.slice(0, 80)}${s.promptTemplate.length > 80 ? '…' : ''}`;
  });

  const warning =
    missingAgents.length > 0
      ? `\n\n⚠️  Missing agents: ${missingAgents.join(', ')} — add .md files to your agents/ directory.`
      : '';

  return {
    summary:
      `✅ Loaded chain "${chain.name}" (${steps.length} steps):\n\n` +
      stepLines.join('\n') +
      warning,
    data: result,
  };
}

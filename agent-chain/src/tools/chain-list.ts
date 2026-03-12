import { findChainConfig, loadChains } from '../utils/chain-parser.js';
import type { ChainListEntry } from '../utils/types.js';

export const chainListSchema = {
  name: 'chain_list',
  description:
    'List all available agent chains defined in agent-chain.yaml. ' +
    'Scans standard config locations: .pi/agents/, .claude/agents/, agents/. ' +
    'Returns chain names, descriptions, step counts, and agent names.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      cwd: {
        type: 'string',
        description: 'Project directory to search for chain config (default: process.cwd())',
      },
      config_path: {
        type: 'string',
        description: 'Explicit path to agent-chain.yaml (overrides cwd scan)',
      },
    },
    required: [],
  },
};

export interface ChainListArgs {
  cwd?: string;
  config_path?: string;
}

export interface ChainListResult {
  summary: string;
  data?: {
    configPath: string;
    chains: ChainListEntry[];
  };
}

export function chainList(args: ChainListArgs): ChainListResult {
  const cwd = args.cwd ?? process.cwd();
  const configPath = findChainConfig(cwd, args.config_path);

  if (!configPath) {
    return {
      summary:
        '⚠️  No agent-chain.yaml found. ' +
        'Create one at .pi/agents/agent-chain.yaml, .claude/agents/agent-chain.yaml, or agents/agent-chain.yaml.',
    };
  }

  const chains = loadChains(configPath);

  if (chains.length === 0) {
    return {
      summary: `⚠️  Found config at ${configPath} but no chains were parsed. Check the YAML format.`,
      data: { configPath, chains: [] },
    };
  }

  const entries: ChainListEntry[] = chains.map((chain) => ({
    name: chain.name,
    description: chain.description,
    stepCount: chain.steps.length,
    agents: chain.steps.map((s) => s.agent),
  }));

  const lines = entries.map(
    (e) =>
      `  • ${e.name} (${e.stepCount} steps: ${e.agents.join(' → ')})` +
      (e.description ? `\n    ${e.description}` : '')
  );

  return {
    summary: `✅ Found ${chains.length} chain(s) in ${configPath}:\n\n${lines.join('\n\n')}`,
    data: { configPath, chains: entries },
  };
}

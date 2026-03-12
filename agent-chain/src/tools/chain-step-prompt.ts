import { findChainConfig, loadChains } from '../utils/chain-parser.js';
import { scanAgentDirs } from '../utils/agent-parser.js';
import type { AgentDef } from '../utils/types.js';

export const chainStepPromptSchema = {
  name: 'chain_step_prompt',
  description:
    'Build the fully resolved prompt for a specific step in a chain. ' +
    'Substitutes $INPUT (previous step output) and $ORIGINAL (user\'s original task). ' +
    'Returns the filled prompt, agent system prompt, and tools — ready to hand off to an agent. ' +
    'Use this for manual step-by-step chain execution.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      chain_name: {
        type: 'string',
        description: 'Name of the chain',
      },
      step_index: {
        type: 'number',
        description: 'Zero-based index of the step to resolve',
      },
      input: {
        type: 'string',
        description: 'Current input ($INPUT) — for step 0 this is the same as original_task',
      },
      original_task: {
        type: 'string',
        description: 'The user\'s original task ($ORIGINAL) — passed through every step unchanged',
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
    required: ['chain_name', 'step_index', 'input', 'original_task'],
  },
};

export interface ChainStepPromptArgs {
  chain_name: string;
  step_index: number;
  input: string;
  original_task: string;
  cwd?: string;
  config_path?: string;
}

export interface StepPromptResult {
  summary: string;
  data?: {
    chainName: string;
    stepIndex: number;
    totalSteps: number;
    agentName: string;
    resolvedPrompt: string;
    agentSystemPrompt: string | null;
    agentTools: string | null;
    agentDescription: string | null;
    isLastStep: boolean;
  };
}

function resolvePrompt(template: string, input: string, originalTask: string): string {
  return template.replace(/\$INPUT/g, input).replace(/\$ORIGINAL/g, originalTask);
}

function buildStepSummary(
  agentName: string,
  stepIndex: number,
  totalSteps: number,
  agentDef: AgentDef | null
): string {
  const position = `Step ${stepIndex + 1}/${totalSteps}`;
  const agentStatus = agentDef ? `agent "${agentDef.name}"` : `agent "${agentName}" (not found in agents/)`;
  return `${position} — ${agentStatus}`;
}

export function chainStepPrompt(args: ChainStepPromptArgs): StepPromptResult {
  const cwd = args.cwd ?? process.cwd();
  const configPath = findChainConfig(cwd, args.config_path);

  if (!configPath) {
    return { summary: '⚠️  No agent-chain.yaml found. Check cwd or provide config_path.' };
  }

  const chains = loadChains(configPath);
  const chain = chains.find((c) => c.name === args.chain_name);

  if (!chain) {
    const available = chains.map((c) => c.name).join(', ');
    return {
      summary: `❌ Chain "${args.chain_name}" not found. Available: ${available || 'none'}`,
    };
  }

  if (args.step_index < 0 || args.step_index >= chain.steps.length) {
    return {
      summary: `❌ Step index ${args.step_index} out of range (chain has ${chain.steps.length} steps, indices 0–${chain.steps.length - 1})`,
    };
  }

  const step = chain.steps[args.step_index];
  const allAgents = scanAgentDirs(cwd);
  const agentDef = allAgents.get(step.agent.toLowerCase()) ?? null;
  const resolvedPrompt = resolvePrompt(step.prompt, args.input, args.original_task);
  const isLastStep = args.step_index === chain.steps.length - 1;
  const header = buildStepSummary(step.agent, args.step_index, chain.steps.length, agentDef);

  return {
    summary: `✅ ${header}\n\nResolved prompt:\n${resolvedPrompt}`,
    data: {
      chainName: chain.name,
      stepIndex: args.step_index,
      totalSteps: chain.steps.length,
      agentName: step.agent,
      resolvedPrompt,
      agentSystemPrompt: agentDef?.systemPrompt ?? null,
      agentTools: agentDef?.tools ?? null,
      agentDescription: agentDef?.description ?? null,
      isLastStep,
    },
  };
}

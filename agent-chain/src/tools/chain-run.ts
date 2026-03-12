import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { findChainConfig, loadChains } from '../utils/chain-parser.js';
import { scanAgentDirs } from '../utils/agent-parser.js';
import { getChainSessionPath, toAgentKey, ensureSessionDir } from '../utils/session-manager.js';
import type { AgentDef, ChainRunResult, StepResult } from '../utils/types.js';

export const chainRunSchema = {
  name: 'chain_run',
  description:
    'Execute a complete agent chain pipeline. Each step\'s output becomes $INPUT for the next step. ' +
    '$ORIGINAL always refers to the initial task. ' +
    'Without executor_command (or with dry_run: true), returns the resolved prompts and agent configs ' +
    'for each step — useful for manual orchestration by the calling agent. ' +
    'With executor_command (e.g. "claude -p"), spawns a subprocess per step and captures its output.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      chain_name: {
        type: 'string',
        description: 'Name of the chain to execute',
      },
      task: {
        type: 'string',
        description: 'The initial task — becomes $INPUT for step 0 and $ORIGINAL throughout',
      },
      cwd: {
        type: 'string',
        description: 'Project directory (default: process.cwd())',
      },
      config_path: {
        type: 'string',
        description: 'Explicit path to agent-chain.yaml (overrides cwd scan)',
      },
      executor_command: {
        type: 'string',
        description:
          'CLI command to run each agent step (e.g. "claude -p"). ' +
          'The resolved prompt is appended as a JSON-quoted argument. ' +
          'If omitted, runs in dry-run mode returning prompts without executing.',
      },
      timeout_ms: {
        type: 'number',
        description: 'Per-step execution timeout in milliseconds (default: 120000)',
      },
      dry_run: {
        type: 'boolean',
        description: 'Force dry-run mode even if executor_command is provided (default: false)',
      },
    },
    required: ['chain_name', 'task'],
  },
};

export interface ChainRunArgs {
  chain_name: string;
  task: string;
  cwd?: string;
  config_path?: string;
  executor_command?: string;
  timeout_ms?: number;
  dry_run?: boolean;
}

export interface ChainRunToolResult {
  summary: string;
  data?: ChainRunResult;
}

function resolvePrompt(template: string, input: string, original: string): string {
  return template.replace(/\$INPUT/g, input).replace(/\$ORIGINAL/g, original);
}

function buildAgentPrompt(agentDef: AgentDef | null, resolvedPrompt: string): string {
  if (!agentDef?.systemPrompt) return resolvedPrompt;
  return `${agentDef.systemPrompt}\n\n---\n\n${resolvedPrompt}`;
}

function runStepSubprocess(
  fullPrompt: string,
  executor: string,
  cwd: string,
  agentKey: string,
  timeoutMs: number,
  hasExistingSession: boolean
): { output: string; error?: string } {
  const sessionPath = getChainSessionPath(cwd, agentKey);
  const sessionArgs = hasExistingSession ? ` --session ${JSON.stringify(sessionPath)} -c` : ` --session ${JSON.stringify(sessionPath)}`;
  const command = `${executor}${sessionArgs} ${JSON.stringify(fullPrompt)}`;

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

function executeStep(
  stepIndex: number,
  agentName: string,
  resolvedPrompt: string,
  agentDef: AgentDef | null,
  executor: string,
  cwd: string,
  timeoutMs: number
): StepResult {
  const agentKey = toAgentKey(agentName);
  const sessionPath = getChainSessionPath(cwd, agentKey);
  const hasSession = existsSync(sessionPath);
  const fullPrompt = buildAgentPrompt(agentDef, resolvedPrompt);
  const start = Date.now();

  const { output, error } = runStepSubprocess(
    fullPrompt,
    executor,
    cwd,
    agentKey,
    timeoutMs,
    hasSession
  );

  const elapsed = Date.now() - start;

  if (error) {
    return { index: stepIndex, agentName, status: 'error', resolvedPrompt, output, elapsed, error };
  }

  return { index: stepIndex, agentName, status: 'done', resolvedPrompt, output, elapsed };
}

function dryRunStep(
  stepIndex: number,
  agentName: string,
  resolvedPrompt: string
): StepResult {
  return {
    index: stepIndex,
    agentName,
    status: 'dry-run',
    resolvedPrompt,
    output: resolvedPrompt,
    elapsed: 0,
  };
}

function buildSummary(result: ChainRunResult): string {
  const header = result.dryRun
    ? `📋 Dry-run for chain "${result.chain}" (${result.steps.length} steps)`
    : `${result.status === 'done' ? '✅' : '❌'} Chain "${result.chain}" ${result.status} in ${Math.round(result.elapsed / 1000)}s`;

  const stepLines = result.steps.map((s) => {
    const icon = s.status === 'done' ? '✓' : s.status === 'dry-run' ? '○' : '✗';
    const time = s.elapsed > 0 ? ` (${Math.round(s.elapsed / 1000)}s)` : '';
    return `  ${icon} Step ${s.index + 1} [${s.agentName}]${time}`;
  });

  return `${header}\n\n${stepLines.join('\n')}`;
}

export function chainRun(args: ChainRunArgs): ChainRunToolResult {
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

  const isDryRun = args.dry_run === true || !args.executor_command;
  const timeoutMs = args.timeout_ms ?? 120_000;
  const allAgents = scanAgentDirs(cwd);
  const chainStart = Date.now();
  const steps: StepResult[] = [];

  if (!isDryRun) {
    ensureSessionDir(cwd);
  }

  let currentInput = args.task;
  const originalTask = args.task;

  for (let i = 0; i < chain.steps.length; i++) {
    const step = chain.steps[i];
    const agentDef = allAgents.get(step.agent.toLowerCase()) ?? null;
    const resolvedPrompt = resolvePrompt(step.prompt, currentInput, originalTask);

    let stepResult: StepResult;

    if (isDryRun) {
      stepResult = dryRunStep(i, step.agent, resolvedPrompt);
    } else {
      stepResult = executeStep(
        i,
        step.agent,
        resolvedPrompt,
        agentDef,
        args.executor_command as string,
        cwd,
        timeoutMs
      );
    }

    steps.push(stepResult);

    if (stepResult.status === 'error') {
      const result: ChainRunResult = {
        chain: chain.name,
        task: args.task,
        status: 'error',
        steps,
        finalOutput: stepResult.error ?? stepResult.output,
        elapsed: Date.now() - chainStart,
        dryRun: isDryRun,
      };
      return { summary: buildSummary(result), data: result };
    }

    currentInput = stepResult.output;
  }

  const result: ChainRunResult = {
    chain: chain.name,
    task: args.task,
    status: 'done',
    steps,
    finalOutput: currentInput,
    elapsed: Date.now() - chainStart,
    dryRun: isDryRun,
  };

  return { summary: buildSummary(result), data: result };
}

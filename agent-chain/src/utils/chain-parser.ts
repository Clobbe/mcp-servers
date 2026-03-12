import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import type { ChainDef, ChainStep } from './types.js';

/**
 * Unquote a YAML inline string value if wrapped in single or double quotes.
 */
function unquote(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

/**
 * Parse the agent-chain YAML format into an array of ChainDef objects.
 * Ported from the Pi extension's parseChainYaml().
 *
 * Format:
 *   chain-name:
 *     description: "..."
 *     steps:
 *       - agent: agent-name
 *         prompt: "..."
 */
export function parseChainYaml(raw: string): ChainDef[] {
  const chains: ChainDef[] = [];
  let current: ChainDef | null = null;
  let currentStep: ChainStep | null = null;

  for (const line of raw.split('\n')) {
    const chainMatch = line.match(/^(\S[^:]*):$/);
    if (chainMatch) {
      if (current && currentStep) {
        current.steps.push(currentStep);
        currentStep = null;
      }
      current = { name: chainMatch[1].trim(), description: '', steps: [] };
      chains.push(current);
      continue;
    }

    const descMatch = line.match(/^\s+description:\s+(.+)$/);
    if (descMatch && current && !currentStep) {
      current.description = unquote(descMatch[1].trim());
      continue;
    }

    if (line.match(/^\s+steps:\s*$/) && current) {
      continue;
    }

    const agentMatch = line.match(/^\s+-\s+agent:\s+(.+)$/);
    if (agentMatch && current) {
      if (currentStep) {
        current.steps.push(currentStep);
      }
      currentStep = { agent: agentMatch[1].trim(), prompt: '' };
      continue;
    }

    const promptMatch = line.match(/^\s+prompt:\s+(.+)$/);
    if (promptMatch && currentStep) {
      const raw_prompt = unquote(promptMatch[1].trim()).replace(/\\n/g, '\n');
      currentStep.prompt = raw_prompt;
      continue;
    }
  }

  if (current && currentStep) {
    current.steps.push(currentStep);
  }

  return chains;
}

/**
 * Find the agent-chain YAML config file, checking standard locations.
 */
export function findChainConfig(cwd: string, configPath?: string): string | null {
  if (configPath) {
    return existsSync(configPath) ? configPath : null;
  }

  const candidates = [
    join(cwd, '.pi', 'agents', 'agent-chain.yaml'),
    join(cwd, '.claude', 'agents', 'agent-chain.yaml'),
    join(cwd, 'agents', 'agent-chain.yaml'),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  return null;
}

/**
 * Load and parse chains from a config file path.
 */
export function loadChains(configPath: string): ChainDef[] {
  try {
    const raw = readFileSync(configPath, 'utf-8');
    return parseChainYaml(raw);
  } catch {
    return [];
  }
}

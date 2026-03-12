/**
 * Run tests tool — executes the project test suite and returns structured results.
 * Supports: npm/pnpm/yarn test (Jest, Vitest, Playwright) and dotnet test.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import type { ToolResponse, TestRunResult } from '../utils/types.js';

const execAsync = promisify(exec);

export const runTestsSchema = {
  name: 'code_run_tests',
  description:
    'Run the project test suite and return structured pass/fail results. ' +
    'Auto-detects npm/pnpm/yarn (Jest, Vitest, Playwright) or dotnet test.',
  inputSchema: {
    type: 'object',
    properties: {
      directory: {
        type: 'string',
        description: 'Root directory of the project to test',
      },
      test_command: {
        type: 'string',
        description:
          'Override the detected test command (e.g. "npm test", "dotnet test", "pnpm vitest run")',
      },
      timeout_ms: {
        type: 'number',
        description: 'Max time to wait for tests in milliseconds (default: 60000)',
        default: 60000,
      },
    },
    required: ['directory'],
  },
};

export async function runTestsTool(args: {
  directory: string;
  test_command?: string;
  timeout_ms?: number;
}): Promise<ToolResponse> {
  const { directory, test_command, timeout_ms = 60000 } = args;

  try {
    const command = test_command ?? (await detectTestCommand(directory));
    if (!command) {
      return {
        summary: `❌ Could not detect a test command in ${directory}. Provide test_command explicitly.`,
        error: 'No test command detected',
      };
    }

    let stdout = '';
    let stderr = '';
    let exitCode = 0;

    try {
      const result = await execAsync(command, {
        cwd: directory,
        timeout: timeout_ms,
      });
      stdout = result.stdout;
      stderr = result.stderr;
    } catch (err: unknown) {
      const execErr = err as { stdout?: string; stderr?: string; code?: number };
      stdout = execErr.stdout ?? '';
      stderr = execErr.stderr ?? '';
      exitCode = execErr.code ?? 1;
    }

    const rawOutput = [stdout, stderr].filter(Boolean).join('\n');
    const result = parseTestOutput(rawOutput, command, directory, exitCode);

    const emoji = result.success ? '✅' : '❌';
    const summary =
      `${emoji} Tests ${result.success ? 'PASSED' : 'FAILED'} in ${directory} ` +
      `(${result.passed} passed, ${result.failed} failed, ${result.skipped} skipped) ` +
      `using ${result.framework}`;

    return { summary, data: result };
  } catch (error) {
    return {
      summary: `❌ Error running tests: ${error instanceof Error ? error.message : String(error)}`,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Auto-detect the appropriate test command for a project
 */
async function detectTestCommand(directory: string): Promise<string | null> {
  // .NET project
  try {
    const entries = await fs.readdir(directory);
    const hasCsproj = entries.some((e) => e.endsWith('.csproj') || e.endsWith('.sln'));
    if (hasCsproj) return 'dotnet test --no-build';
  } catch {
    // ignore
  }

  // Node.js project — check package.json
  try {
    const pkgPath = path.join(directory, 'package.json');
    const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8')) as {
      scripts?: Record<string, string>;
      devDependencies?: Record<string, string>;
      dependencies?: Record<string, string>;
    };

    if (pkg.scripts?.test) {
      // Detect package manager
      try {
        await fs.access(path.join(directory, 'pnpm-lock.yaml'));
        return 'pnpm test';
      } catch {
        /* not pnpm */
      }
      try {
        await fs.access(path.join(directory, 'yarn.lock'));
        return 'yarn test';
      } catch {
        /* not yarn */
      }
      return 'npm test';
    }
  } catch {
    // ignore
  }

  return null;
}

/**
 * Parse test output into structured results
 */
function parseTestOutput(
  output: string,
  command: string,
  directory: string,
  exitCode: number
): TestRunResult {
  const isDotNet = command.includes('dotnet');

  if (isDotNet) return parseDotNetOutput(output, directory, exitCode);
  return parseNodeOutput(output, directory, exitCode);
}

function parseDotNetOutput(output: string, directory: string, exitCode: number): TestRunResult {
  // dotnet test output: "Passed: 5, Failed: 2, Skipped: 1, Total: 8"
  const passedMatch = output.match(/Passed:\s*(\d+)/i);
  const failedMatch = output.match(/Failed:\s*(\d+)/i);
  const skippedMatch = output.match(/Skipped:\s*(\d+)/i);

  const passed = passedMatch ? parseInt(passedMatch[1], 10) : 0;
  const failed = failedMatch ? parseInt(failedMatch[1], 10) : 0;
  const skipped = skippedMatch ? parseInt(skippedMatch[1], 10) : 0;

  // Extract failed test names
  const failureLines = output
    .split('\n')
    .filter((l) => l.includes('Failed') && l.includes('('))
    .map((l) => ({ name: l.trim(), status: 'failed' as const }));

  return {
    directory,
    framework: 'dotnet-test',
    passed,
    failed,
    skipped,
    total: passed + failed + skipped,
    failures: failureLines,
    success: exitCode === 0 && failed === 0,
    rawOutput: output,
  };
}

function parseNodeOutput(output: string, directory: string, exitCode: number): TestRunResult {
  // Jest output: "Tests: 3 failed, 42 passed, 45 total"
  // Vitest output: "✓ 42 | ✗ 3 | ↓ 1"
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  let framework = 'unknown';

  // Jest/Vitest pattern
  const jestMatch = output.match(/Tests?:\s*(?:(\d+)\s*failed[,\s])?(?:(\d+)\s*passed[,\s])?(?:(\d+)\s*skipped[,\s])?(\d+)\s*total/i);
  if (jestMatch) {
    failed = parseInt(jestMatch[1] ?? '0', 10);
    passed = parseInt(jestMatch[2] ?? '0', 10);
    skipped = parseInt(jestMatch[3] ?? '0', 10);
    framework = output.includes('vitest') ? 'vitest' : 'jest';
  }

  // Playwright pattern: "5 passed (12s)"
  const pwMatch = output.match(/(\d+)\s*passed.*?(\d+)?\s*failed/);
  if (pwMatch && !jestMatch) {
    passed = parseInt(pwMatch[1], 10);
    failed = parseInt(pwMatch[2] ?? '0', 10);
    framework = 'playwright';
  }

  return {
    directory,
    framework,
    passed,
    failed,
    skipped,
    total: passed + failed + skipped,
    failures: [],
    success: exitCode === 0 && failed === 0,
    rawOutput: output,
  };
}

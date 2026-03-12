/**
 * Check coverage tool — runs tests with coverage and returns structured results.
 * Supports Jest/Vitest (TypeScript/JavaScript) and dotnet test with Coverlet (.NET).
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import type { ToolResponse, CoverageResult, FileCoverage } from '../utils/types.js';

const execAsync = promisify(exec);

export const checkCoverageSchema = {
  name: 'code_check_coverage',
  description:
    'Run tests with coverage reporting and return structured per-file and overall coverage. ' +
    'Supports Jest/Vitest (TypeScript/JavaScript) and dotnet test with Coverlet (.NET). ' +
    'Fails if overall line coverage is below threshold.',
  inputSchema: {
    type: 'object',
    properties: {
      directory: {
        type: 'string',
        description: 'Root directory of the project',
      },
      threshold: {
        type: 'number',
        description: 'Minimum required overall line coverage % (default: 80)',
        default: 80,
      },
    },
    required: ['directory'],
  },
};

export async function checkCoverageTool(args: {
  directory: string;
  threshold?: number;
}): Promise<ToolResponse> {
  const { directory, threshold = 80 } = args;

  try {
    const isDotNet = await detectDotNet(directory);
    const result = isDotNet
      ? await runDotNetCoverage(directory, threshold)
      : await runNodeCoverage(directory, threshold);

    const emoji = result.passed ? '✅' : '❌';
    const summary =
      `${emoji} Coverage ${result.passed ? 'PASSED' : 'FAILED'} — ` +
      `Lines: ${result.overall.lines.toFixed(1)}% ` +
      `(threshold: ${threshold}%) in ${directory}`;

    return { summary, data: result };
  } catch (error) {
    return {
      summary: `❌ Coverage check error: ${error instanceof Error ? error.message : String(error)}`,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function detectDotNet(directory: string): Promise<boolean> {
  try {
    const entries = await fs.readdir(directory);
    return entries.some((e) => e.endsWith('.csproj') || e.endsWith('.sln'));
  } catch {
    return false;
  }
}

/**
 * Node.js coverage via Jest --coverage or Vitest --coverage
 */
async function runNodeCoverage(directory: string, threshold: number): Promise<CoverageResult> {
  // Detect framework
  const pkgPath = path.join(directory, 'package.json');
  let coverageCommand = 'npm test -- --coverage --coverageReporters=json-summary';

  try {
    const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8')) as {
      devDependencies?: Record<string, string>;
      scripts?: Record<string, string>;
    };
    if (pkg.devDependencies?.vitest || pkg.scripts?.test?.includes('vitest')) {
      coverageCommand = 'npx vitest run --coverage --reporter=json';
    }
  } catch {
    // use default
  }

  let output = '';
  try {
    const result = await execAsync(coverageCommand, { cwd: directory, timeout: 120000 });
    output = result.stdout + result.stderr;
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string };
    output = (e.stdout ?? '') + (e.stderr ?? '');
  }

  // Try to read coverage-summary.json written by Jest
  const summaryPath = path.join(directory, 'coverage', 'coverage-summary.json');
  try {
    const raw = JSON.parse(await fs.readFile(summaryPath, 'utf-8')) as Record<
      string,
      { statements: { pct: number }; branches: { pct: number }; functions: { pct: number }; lines: { pct: number } }
    >;

    const total = raw['total'];
    const files: FileCoverage[] = Object.entries(raw)
      .filter(([k]) => k !== 'total')
      .map(([file, stats]) => ({
        file,
        statements: stats.statements.pct,
        branches: stats.branches.pct,
        functions: stats.functions.pct,
        lines: stats.lines.pct,
      }));

    const overall = {
      statements: total.statements.pct,
      branches: total.branches.pct,
      functions: total.functions.pct,
      lines: total.lines.pct,
    };

    return {
      directory,
      overall,
      files,
      threshold,
      passed: overall.lines >= threshold,
    };
  } catch {
    // Fall back to parsing output text
    return parseCoverageText(output, directory, threshold);
  }
}

/**
 * .NET coverage via dotnet test + Coverlet
 */
async function runDotNetCoverage(directory: string, threshold: number): Promise<CoverageResult> {
  const command =
    'dotnet test --no-build --collect:"XPlat Code Coverage" -- DataCollectionRunSettings.DataCollectors.DataCollector.Configuration.Format=json';

  let output = '';
  try {
    const result = await execAsync(command, { cwd: directory, timeout: 120000 });
    output = result.stdout + result.stderr;
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string };
    output = (e.stdout ?? '') + (e.stderr ?? '');
  }

  // Try to find coverage.json in TestResults
  const testResultsDir = path.join(directory, 'TestResults');
  try {
    const coverageFile = await findFile(testResultsDir, 'coverage.json');
    if (coverageFile) {
      return parseDotNetCoverageJson(coverageFile, directory, threshold);
    }
  } catch {
    // ignore
  }

  // Fallback: parse dotnet test output for summary line
  return parseCoverageText(output, directory, threshold);
}

/**
 * Parse Coverlet JSON coverage report
 */
async function parseDotNetCoverageJson(
  filePath: string,
  directory: string,
  threshold: number
): Promise<CoverageResult> {
  const raw = JSON.parse(await fs.readFile(filePath, 'utf-8')) as {
    summary?: { lineCoverage?: number; branchCoverage?: number };
    modules?: Array<{ name: string; stats?: { lineCoverage?: number } }>;
  };

  const overall = {
    statements: raw.summary?.lineCoverage ?? 0,
    branches: raw.summary?.branchCoverage ?? 0,
    functions: raw.summary?.lineCoverage ?? 0,
    lines: raw.summary?.lineCoverage ?? 0,
  };

  const files: FileCoverage[] = (raw.modules ?? []).map((m) => ({
    file: m.name,
    statements: m.stats?.lineCoverage ?? 0,
    branches: 0,
    functions: 0,
    lines: m.stats?.lineCoverage ?? 0,
  }));

  return { directory, overall, files, threshold, passed: overall.lines >= threshold };
}

/**
 * Parse coverage percentage from raw text output (last resort)
 */
function parseCoverageText(output: string, directory: string, threshold: number): CoverageResult {
  // Jest: "Lines   : 84.21% ( 80/95 )"
  const lineMatch = output.match(/Lines\s*:\s*([\d.]+)%/i);
  const stmtMatch = output.match(/Statements\s*:\s*([\d.]+)%/i);
  const branchMatch = output.match(/Branches\s*:\s*([\d.]+)%/i);
  const fnMatch = output.match(/Functions\s*:\s*([\d.]+)%/i);

  const lines = parseFloat(lineMatch?.[1] ?? '0');
  const statements = parseFloat(stmtMatch?.[1] ?? '0');
  const branches = parseFloat(branchMatch?.[1] ?? '0');
  const functions = parseFloat(fnMatch?.[1] ?? '0');

  return {
    directory,
    overall: { statements, branches, functions, lines },
    files: [],
    threshold,
    passed: lines >= threshold,
  };
}

async function findFile(dir: string, targetName: string): Promise<string | null> {
  let names: string[];
  try {
    names = await fs.readdir(dir);
  } catch {
    return null;
  }

  for (const name of names) {
    const full = path.join(dir, name);
    let stat;
    try {
      stat = await fs.stat(full);
    } catch {
      continue;
    }
    if (stat.isFile() && name === targetName) return full;
    if (stat.isDirectory()) {
      const found = await findFile(full, targetName);
      if (found) return found;
    }
  }
  return null;
}

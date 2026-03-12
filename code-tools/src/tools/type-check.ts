/**
 * Type check tool — runs tsc --noEmit (TypeScript) or dotnet build (C#)
 * and returns structured error/warning output.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import type { ToolResponse, TypeCheckResult, TypeCheckError, ProjectLanguage } from '../utils/types.js';

const execAsync = promisify(exec);

export const typeCheckSchema = {
  name: 'code_type_check',
  description:
    'Run type checking on a project: tsc --noEmit for TypeScript or dotnet build for .NET/C#. ' +
    'Returns structured errors and warnings.',
  inputSchema: {
    type: 'object',
    properties: {
      directory: {
        type: 'string',
        description: 'Root directory of the project to type-check',
      },
      config_path: {
        type: 'string',
        description: 'Path to tsconfig.json (TypeScript only). Defaults to auto-detection.',
      },
    },
    required: ['directory'],
  },
};

export async function typeCheckTool(args: {
  directory: string;
  config_path?: string;
}): Promise<ToolResponse> {
  const { directory, config_path } = args;

  try {
    const language = await detectLanguage(directory);
    let result: TypeCheckResult;

    if (language === 'csharp') {
      result = await runDotNetBuild(directory);
    } else {
      result = await runTsc(directory, config_path);
    }

    const emoji = result.passed ? '✅' : '❌';
    const summary =
      `${emoji} Type check ${result.passed ? 'PASSED' : 'FAILED'} in ${directory} ` +
      `(${result.errors.length} errors, ${result.warnings.length} warnings) [${result.language}]`;

    return { summary, data: result };
  } catch (error) {
    return {
      summary: `❌ Type check error: ${error instanceof Error ? error.message : String(error)}`,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function detectLanguage(directory: string): Promise<ProjectLanguage> {
  try {
    const entries = await fs.readdir(directory);
    const hasCsproj = entries.some((e) => e.endsWith('.csproj') || e.endsWith('.sln'));
    if (hasCsproj) return 'csharp';
  } catch {
    // ignore
  }
  return 'typescript';
}

async function runTsc(directory: string, configPath?: string): Promise<TypeCheckResult> {
  const tsconfig = configPath ?? (await findTsConfig(directory));
  const configFlag = tsconfig ? `--project "${tsconfig}"` : '';
  const command = `npx tsc --noEmit ${configFlag}`.trim();

  let output = '';
  let exitCode = 0;

  try {
    const result = await execAsync(command, { cwd: directory });
    output = result.stdout + result.stderr;
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; code?: number };
    output = (e.stdout ?? '') + (e.stderr ?? '');
    exitCode = e.code ?? 1;
  }

  const errors = parseTscOutput(output, 'error');
  const warnings = parseTscOutput(output, 'warning');

  return {
    directory,
    language: 'typescript',
    errors,
    warnings,
    passed: exitCode === 0,
    rawOutput: output,
  };
}

async function runDotNetBuild(directory: string): Promise<TypeCheckResult> {
  const command = 'dotnet build --no-restore /p:TreatWarningsAsErrors=false';
  let output = '';
  let exitCode = 0;

  try {
    const result = await execAsync(command, { cwd: directory });
    output = result.stdout + result.stderr;
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; code?: number };
    output = (e.stdout ?? '') + (e.stderr ?? '');
    exitCode = e.code ?? 1;
  }

  const errors = parseDotNetOutput(output, 'error');
  const warnings = parseDotNetOutput(output, 'warning');

  return {
    directory,
    language: 'csharp',
    errors,
    warnings,
    passed: exitCode === 0,
    rawOutput: output,
  };
}

/**
 * Parse tsc output: "src/file.ts(12,5): error TS2322: Type 'X' is not assignable to 'Y'."
 */
function parseTscOutput(output: string, level: 'error' | 'warning'): TypeCheckError[] {
  const results: TypeCheckError[] = [];
  const lines = output.split('\n');
  const levelPattern = level === 'error' ? /\berror\s+(TS\d+):/i : /\bwarning\s+(TS\d+):/i;
  const linePattern = /^(.+?)\((\d+),(\d+)\):\s+(?:error|warning)\s+(TS\d+):\s+(.+)$/;

  for (const line of lines) {
    if (!levelPattern.test(line)) continue;
    const match = line.match(linePattern);
    if (match) {
      results.push({
        file: match[1].trim(),
        line: parseInt(match[2], 10),
        column: parseInt(match[3], 10),
        code: match[4],
        message: match[5].trim(),
      });
    }
  }

  return results;
}

/**
 * Parse dotnet build output: "path/File.cs(10,5): error CS0246: ..."
 */
function parseDotNetOutput(output: string, level: 'error' | 'warning'): TypeCheckError[] {
  const results: TypeCheckError[] = [];
  const lines = output.split('\n');
  const pattern = new RegExp(
    `^\\s*(.+?)\\((\\d+),(\\d+)\\):\\s+${level}\\s+(CS\\d+):\\s+(.+)$`,
    'i'
  );

  for (const line of lines) {
    const match = line.match(pattern);
    if (match) {
      results.push({
        file: match[1].trim(),
        line: parseInt(match[2], 10),
        column: parseInt(match[3], 10),
        code: match[4],
        message: match[5].trim(),
      });
    }
  }

  return results;
}

async function findTsConfig(directory: string): Promise<string | null> {
  const candidates = ['tsconfig.json', 'tsconfig.build.json', 'tsconfig.app.json'];
  for (const name of candidates) {
    try {
      const full = path.join(directory, name);
      await fs.access(full);
      return full;
    } catch {
      // not found
    }
  }
  return null;
}

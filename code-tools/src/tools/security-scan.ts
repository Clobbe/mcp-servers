/**
 * Security scan tool — scans source files for common security vulnerabilities.
 * Supports TypeScript/JavaScript and .NET/C# codebases.
 */

import fs from 'fs/promises';
import path from 'path';
import { detectSecurityIssuesTS, detectSecurityIssuesDotNet } from '../utils/analyzer.js';
import { isTypeScriptOrJavaScript, isDotNet } from '../utils/parser.js';
import type { ToolResponse, SecurityScanResult, SecurityIssue } from '../utils/types.js';

export const securityScanSchema = {
  name: 'code_security_scan',
  description:
    'Scan source files for security vulnerabilities: hardcoded secrets, injection risks, ' +
    'insecure crypto, unsafe deserialization, and more. Supports TypeScript/JavaScript and .NET/C#.',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'File or directory to scan',
      },
      severity: {
        type: 'string',
        enum: ['all', 'critical', 'high', 'medium', 'low', 'info'],
        description: 'Filter results to this severity level or above (default: all)',
        default: 'all',
      },
    },
    required: ['path'],
  },
};

const SEVERITY_ORDER = ['critical', 'high', 'medium', 'low', 'info'] as const;
type Severity = (typeof SEVERITY_ORDER)[number];

export async function securityScanTool(args: {
  path: string;
  severity?: string;
}): Promise<ToolResponse> {
  const { path: scanPath, severity = 'all' } = args;

  try {
    const files = await collectFiles(scanPath);
    const allIssues: SecurityIssue[] = [];

    for (const filePath of files) {
      const content = await fs.readFile(filePath, 'utf-8');

      if (isTypeScriptOrJavaScript(filePath)) {
        allIssues.push(...detectSecurityIssuesTS(filePath, content));
      } else if (isDotNet(filePath)) {
        allIssues.push(...detectSecurityIssuesDotNet(filePath, content));
      }
    }

    // Filter by severity if requested
    const filtered =
      severity === 'all'
        ? allIssues
        : allIssues.filter(
            (i) =>
              SEVERITY_ORDER.indexOf(i.severity as Severity) <=
              SEVERITY_ORDER.indexOf(severity as Severity)
          );

    const bySeverity = SEVERITY_ORDER.reduce<Record<string, number>>((acc, s) => {
      acc[s] = filtered.filter((i) => i.severity === s).length;
      return acc;
    }, {});

    const hasCriticalOrHigh = (bySeverity['critical'] ?? 0) + (bySeverity['high'] ?? 0) > 0;
    const passed = !hasCriticalOrHigh;

    const result: SecurityScanResult = {
      path: scanPath,
      issues: filtered,
      total: filtered.length,
      bySeverity,
      passed,
    };

    const emoji = passed ? '✅' : '❌';
    const parts = SEVERITY_ORDER.filter((s) => (bySeverity[s] ?? 0) > 0)
      .map((s) => `${bySeverity[s]} ${s}`)
      .join(', ');

    const summary =
      filtered.length === 0
        ? `✅ No security issues found in ${scanPath}`
        : `${emoji} Security scan ${passed ? 'PASSED' : 'FAILED'} — ${filtered.length} issue(s) found in ${scanPath}: ${parts}`;

    return { summary, data: result };
  } catch (error) {
    return {
      summary: `❌ Security scan error: ${error instanceof Error ? error.message : String(error)}`,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Collect all supported source files from a path (file or directory)
 */
async function collectFiles(scanPath: string): Promise<string[]> {
  const stat = await fs.stat(scanPath);

  if (stat.isFile()) {
    return [scanPath];
  }

  const files: string[] = [];
  await walkDir(scanPath, files);
  return files;
}

async function walkDir(dir: string, results: string[]): Promise<void> {
  const SKIP_DIRS = new Set(['node_modules', '.git', 'bin', 'obj', 'dist', 'build', '.next']);

  let names: string[];
  try {
    names = await fs.readdir(dir);
  } catch {
    return;
  }

  for (const name of names) {
    if (SKIP_DIRS.has(name)) continue;

    const fullPath = path.join(dir, name);
    let stat;
    try {
      stat = await fs.stat(fullPath);
    } catch {
      continue;
    }

    if (stat.isDirectory()) {
      await walkDir(fullPath, results);
    } else if (stat.isFile()) {
      if (isTypeScriptOrJavaScript(fullPath) || isDotNet(fullPath)) {
        results.push(fullPath);
      }
    }
  }
}

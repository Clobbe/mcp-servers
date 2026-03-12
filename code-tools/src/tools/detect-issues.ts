/**
 * Detect code issues tool — supports TypeScript/JavaScript and .NET/C#
 */

import { readFileContent, isDotNet } from '../utils/parser.js';
import { detectIssues, detectDotNetIssues } from '../utils/analyzer.js';
import type { ToolResponse, CodeIssue } from '../utils/types.js';

export const detectIssuesSchema = {
  name: 'code_detect_issues',
  description: 'Detect common code issues and anti-patterns. Supports TypeScript/JavaScript and .NET/C#.',
  inputSchema: {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: 'Path to the file to analyze',
      },
      severity: {
        type: 'string',
        enum: ['all', 'error', 'warning'],
        description: 'Filter by severity level (default: all)',
        default: 'all',
      },
    },
    required: ['file_path'],
  },
};

export async function detectIssuesToolFunc(args: {
  file_path: string;
  severity?: 'all' | 'error' | 'warning';
}): Promise<ToolResponse> {
  try {
    const severity = args.severity ?? 'all';
    const content = await readFileContent(args.file_path);

    // Detect all issues — route to language-appropriate detector
    let issues = isDotNet(args.file_path)
      ? detectDotNetIssues(args.file_path, content)
      : detectIssues(args.file_path, content);

    // Filter by severity if needed
    if (severity !== 'all') {
      issues = issues.filter((issue) => issue.severity === severity);
    }

    // Group by severity
    const errors = issues.filter((i) => i.severity === 'error');
    const warnings = issues.filter((i) => i.severity === 'warning');

    // Create summary
    let summary: string;
    if (issues.length === 0) {
      summary = `✅ No code issues found in ${args.file_path}`;
    } else {
      const parts = [];
      if (errors.length > 0) parts.push(`${errors.length} errors`);
      if (warnings.length > 0) parts.push(`${warnings.length} warnings`);
      summary = `⚠️ Found ${issues.length} issues in ${args.file_path}: ${parts.join(', ')}`;
    }

    return {
      summary,
      data: {
        issues,
        total: issues.length,
        errors: errors.length,
        warnings: warnings.length,
        filePath: args.file_path,
        byRule: groupByRule(issues),
      },
    };
  } catch (error) {
    return {
      summary: `❌ Error detecting issues: ${error instanceof Error ? error.message : String(error)}`,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Group issues by rule
 */
function groupByRule(issues: CodeIssue[]): Record<string, number> {
  const grouped: Record<string, number> = {};

  issues.forEach((issue) => {
    if (!grouped[issue.rule]) {
      grouped[issue.rule] = 0;
    }
    grouped[issue.rule]++;
  });

  return grouped;
}

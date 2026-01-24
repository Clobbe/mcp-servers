/**
 * Code analysis utilities
 */

import crypto from 'crypto';
import type {
  FunctionComplexity,
  DuplicateBlock,
  DuplicateLocation,
  CodeIssue,
  FileLineCount,
} from './types.js';

/**
 * Calculate cyclomatic complexity for a function
 * Simple approach: count decision points (if, while, for, case, etc.)
 */
export function calculateComplexity(code: string): number {
  let complexity = 1; // Base complexity

  // Decision points that increase complexity
  const patterns = [
    /\bif\s*\(/g, // if statements
    /\belse\s+if\s*\(/g, // else if
    /\bwhile\s*\(/g, // while loops
    /\bfor\s*\(/g, // for loops
    /\bcase\s+/g, // switch cases
    /\bcatch\s*\(/g, // catch blocks
    /\?/g, // ternary operators
    /&&/g, // logical AND
    /\|\|/g, // logical OR
  ];

  patterns.forEach((pattern) => {
    const matches = code.match(pattern);
    if (matches) {
      complexity += matches.length;
    }
  });

  return complexity;
}

/**
 * Analyze complexity of functions in code
 */
export function analyzeFunctionComplexity(
  content: string,
  threshold: number = 10
): FunctionComplexity[] {
  const results: FunctionComplexity[] = [];
  const lines = content.split('\n');

  // Find function blocks and analyze each
  const functionPattern =
    /^(?:export\s+)?(?:async\s+)?function\s+(\w+)|^(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(functionPattern);

    if (match) {
      const functionName = match[1] || match[2];
      const functionCode = extractFunctionCode(lines, i);
      const complexity = calculateComplexity(functionCode);

      results.push({
        name: functionName,
        line: i + 1,
        complexity,
        exceeds: complexity > threshold,
      });
    }
  }

  return results;
}

/**
 * Extract function code block starting from a given line
 */
function extractFunctionCode(lines: string[], startLine: number): string {
  const code: string[] = [];
  let braceCount = 0;
  let started = false;

  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i];
    code.push(line);

    // Count braces
    for (const char of line) {
      if (char === '{') {
        braceCount++;
        started = true;
      } else if (char === '}') {
        braceCount--;
      }
    }

    // Stop when we've closed all braces
    if (started && braceCount === 0) {
      break;
    }
  }

  return code.join('\n');
}

/**
 * Find duplicate code blocks
 * Simple approach: hash consecutive lines and find matches
 */
export function findDuplicates(
  files: Array<{ path: string; content: string }>,
  minLines: number = 5
): DuplicateBlock[] {
  const blocks = new Map<string, DuplicateLocation[]>();

  // Process each file
  files.forEach((file) => {
    const lines = file.content.split('\n');

    // Generate hashes for sliding windows
    for (let i = 0; i <= lines.length - minLines; i++) {
      const block = lines.slice(i, i + minLines);
      const blockText = block.join('\n').trim();

      // Skip empty or very short blocks
      if (blockText.length < 50) continue;

      const hash = hashCode(blockText);

      if (!blocks.has(hash)) {
        blocks.set(hash, []);
      }

      blocks.get(hash)!.push({
        file: file.path,
        startLine: i + 1,
        endLine: i + minLines,
      });
    }
  });

  // Filter to only blocks that appear more than once
  const duplicates: DuplicateBlock[] = [];

  blocks.forEach((locations, hash) => {
    if (locations.length > 1) {
      // Get the actual content from the first location
      const firstLoc = locations[0];
      const file = files.find((f) => f.path === firstLoc.file);
      if (file) {
        const lines = file.content.split('\n');
        const content = lines
          .slice(firstLoc.startLine - 1, firstLoc.endLine)
          .join('\n')
          .trim();

        duplicates.push({
          content,
          locations,
          lines: minLines,
          hash,
        });
      }
    }
  });

  return duplicates;
}

/**
 * Generate hash for code block
 */
function hashCode(str: string): string {
  return crypto.createHash('md5').update(str).digest('hex');
}

/**
 * Detect common code issues
 */
export function detectIssues(filePath: string, content: string): CodeIssue[] {
  const issues: CodeIssue[] = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    // Check for console.log (should use console.error for MCP)
    if (line.match(/console\.log\(/)) {
      issues.push({
        file: filePath,
        line: lineNumber,
        severity: 'warning',
        message: 'Avoid console.log in production code. Use console.error for MCP servers.',
        rule: 'no-console-log',
        code: line.trim(),
      });
    }

    // Check for var usage (should use const/let)
    if (line.match(/\bvar\s+\w+/)) {
      issues.push({
        file: filePath,
        line: lineNumber,
        severity: 'warning',
        message: 'Use const or let instead of var',
        rule: 'no-var',
        code: line.trim(),
      });
    }

    // Check for == instead of ===
    if (line.match(/[^=!]={2}[^=]/) || line.match(/[^!]!={1}[^=]/)) {
      issues.push({
        file: filePath,
        line: lineNumber,
        severity: 'warning',
        message: 'Use === or !== instead of == or !=',
        rule: 'eqeqeq',
        code: line.trim(),
      });
    }

    // Check for any type
    if (line.match(/:\s*any\b/)) {
      issues.push({
        file: filePath,
        line: lineNumber,
        severity: 'warning',
        message: 'Avoid using "any" type. Use specific types instead.',
        rule: 'no-explicit-any',
        code: line.trim(),
      });
    }

    // Check for TODO/FIXME comments
    if (line.match(/\/\/\s*(TODO|FIXME)/i)) {
      issues.push({
        file: filePath,
        line: lineNumber,
        severity: 'warning',
        message: 'TODO/FIXME comment found',
        rule: 'no-warning-comments',
        code: line.trim(),
      });
    }

    // Check for debugger statements
    if (line.match(/\bdebugger\b/)) {
      issues.push({
        file: filePath,
        line: lineNumber,
        severity: 'error',
        message: 'Remove debugger statement',
        rule: 'no-debugger',
        code: line.trim(),
      });
    }
  });

  return issues;
}

/**
 * Count lines of code (excluding comments and blank lines)
 */
export function countLines(content: string): FileLineCount {
  const lines = content.split('\n');
  let totalLines = lines.length;
  let codeLines = 0;
  let commentLines = 0;
  let blankLines = 0;
  let inBlockComment = false;

  lines.forEach((line) => {
    const trimmed = line.trim();

    // Check for blank lines
    if (trimmed === '') {
      blankLines++;
      return;
    }

    // Check for block comments
    if (trimmed.startsWith('/*')) {
      inBlockComment = true;
      commentLines++;
      if (trimmed.endsWith('*/')) {
        inBlockComment = false;
      }
      return;
    }

    if (inBlockComment) {
      commentLines++;
      if (trimmed.endsWith('*/')) {
        inBlockComment = false;
      }
      return;
    }

    if (trimmed.endsWith('*/')) {
      commentLines++;
      inBlockComment = false;
      return;
    }

    // Check for single-line comments
    if (trimmed.startsWith('//')) {
      commentLines++;
      return;
    }

    // Otherwise, it's a code line
    codeLines++;
  });

  return {
    file: '',
    totalLines,
    codeLines,
    commentLines,
    blankLines,
  };
}

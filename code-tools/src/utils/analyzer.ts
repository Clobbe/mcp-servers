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
  SecurityIssue,
} from './types.js';

/**
 * Calculate cyclomatic complexity for a function (TypeScript/JavaScript)
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
 * Calculate cyclomatic complexity for a C# / .NET method body.
 * Adds C#-specific decision points on top of shared patterns.
 */
export function calculateDotNetComplexity(code: string): number {
  let complexity = 1; // Base complexity

  const patterns = [
    /\bif\s*\(/g,          // if
    /\belse\s+if\s*\(/g,   // else if
    /\bwhile\s*\(/g,       // while
    /\bfor\s*\(/g,         // for
    /\bforeach\s*\(/g,     // foreach (C# specific)
    /\bcase\s+/g,          // switch/case
    /\bcatch\s*\(/g,       // catch
    /\bwhen\s*\(/g,        // pattern matching when clause
    /\?\./g,               // null-conditional operator ?.
    /\?\?/g,               // null-coalescing ??
    /\?(?!\.|\?)/g,        // ternary ? (not ?. or ??)
    /&&/g,                 // logical AND
    /\|\|/g,               // logical OR
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
 * Detect common issues in .NET / C# code
 */
export function detectDotNetIssues(filePath: string, content: string): CodeIssue[] {
  const issues: CodeIssue[] = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmed = line.trim();

    // Console.WriteLine in non-console-app context
    if (/Console\.(Write|WriteLine)\(/.test(line) && !filePath.includes('Program.cs')) {
      issues.push({
        file: filePath, line: lineNumber, severity: 'warning',
        message: 'Avoid Console.WriteLine in library code; use ILogger instead.',
        rule: 'no-console-writeline', code: trimmed,
      });
    }

    // dynamic type usage
    if (/\bdynamic\b/.test(line)) {
      issues.push({
        file: filePath, line: lineNumber, severity: 'warning',
        message: 'Avoid "dynamic" type; use specific types or generics.',
        rule: 'no-dynamic', code: trimmed,
      });
    }

    // Thread.Sleep (blocking call)
    if (/Thread\.Sleep\(/.test(line)) {
      issues.push({
        file: filePath, line: lineNumber, severity: 'error',
        message: 'Use Task.Delay instead of Thread.Sleep in async code.',
        rule: 'no-thread-sleep', code: trimmed,
      });
    }

    // .Result or .Wait() — deadlock risk
    if (/\.(Result|Wait)\(\)/.test(line) && !/\/\//.test(line.slice(0, line.indexOf('.')))) {
      issues.push({
        file: filePath, line: lineNumber, severity: 'error',
        message: 'Avoid .Result/.Wait() — use await to prevent deadlocks.',
        rule: 'no-blocking-await', code: trimmed,
      });
    }

    // goto
    if (/\bgoto\b/.test(line)) {
      issues.push({
        file: filePath, line: lineNumber, severity: 'warning',
        message: 'Avoid goto statements.',
        rule: 'no-goto', code: trimmed,
      });
    }

    // #pragma warning disable without justification
    if (/#pragma\s+warning\s+disable/.test(line) && !line.includes('//')) {
      issues.push({
        file: filePath, line: lineNumber, severity: 'warning',
        message: '#pragma warning disable should include a justification comment.',
        rule: 'pragma-warning-justification', code: trimmed,
      });
    }

    // TODO/FIXME
    if (/\/\/\s*(TODO|FIXME|HACK)/i.test(line)) {
      issues.push({
        file: filePath, line: lineNumber, severity: 'warning',
        message: 'TODO/FIXME comment found',
        rule: 'no-warning-comments', code: trimmed,
      });
    }

    // Empty catch block
    if (/catch\s*(\([^)]*\))?\s*\{\s*\}/.test(line)) {
      issues.push({
        file: filePath, line: lineNumber, severity: 'error',
        message: 'Empty catch block silently swallows exceptions.',
        rule: 'no-empty-catch', code: trimmed,
      });
    }
  });

  return issues;
}

/**
 * Detect security issues in TypeScript/JavaScript code
 */
export function detectSecurityIssuesTS(filePath: string, content: string): SecurityIssue[] {
  const issues: SecurityIssue[] = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmed = line.trim();

    // Hardcoded secrets
    if (/(?:password|secret|apiKey|api_key|token)\s*[:=]\s*['"][^'"]{4,}['"]/i.test(line)) {
      issues.push({ file: filePath, line: lineNumber, severity: 'critical',
        message: 'Possible hardcoded secret/credential detected. Use environment variables.',
        rule: 'no-hardcoded-secrets', code: trimmed });
    }

    // eval()
    if (/\beval\s*\(/.test(line)) {
      issues.push({ file: filePath, line: lineNumber, severity: 'high',
        message: 'eval() is dangerous and can lead to code injection.',
        rule: 'no-eval', code: trimmed });
    }

    // dangerouslySetInnerHTML
    if (/dangerouslySetInnerHTML/.test(line)) {
      issues.push({ file: filePath, line: lineNumber, severity: 'high',
        message: 'dangerouslySetInnerHTML can lead to XSS. Sanitize input.',
        rule: 'no-dangerous-inner-html', code: trimmed });
    }

    // innerHTML assignment
    if (/\.innerHTML\s*=/.test(line)) {
      issues.push({ file: filePath, line: lineNumber, severity: 'medium',
        message: 'Direct innerHTML assignment can lead to XSS.',
        rule: 'no-inner-html', code: trimmed });
    }

    // Weak crypto
    if (/createHash\(['"]md5['"]\)|createHash\(['"]sha1['"]\)/.test(line)) {
      issues.push({ file: filePath, line: lineNumber, severity: 'medium',
        message: 'MD5/SHA1 are cryptographically weak. Use SHA-256 or stronger.',
        rule: 'weak-crypto', code: trimmed });
    }

    // Math.random for security-sensitive purposes (heuristic)
    if (/Math\.random\(\)/.test(line) && /token|secret|key|id|nonce/i.test(line)) {
      issues.push({ file: filePath, line: lineNumber, severity: 'high',
        message: 'Math.random() is not cryptographically secure. Use crypto.randomBytes().',
        rule: 'insecure-random', code: trimmed });
    }

    // Raw SQL string concatenation
    if (/(?:query|sql)\s*[+=]\s*(?:`|'|").*\$\{/.test(line) ||
        /(?:query|sql)\s*[+=]\s*['"].*\+/.test(line)) {
      issues.push({ file: filePath, line: lineNumber, severity: 'high',
        message: 'Possible SQL injection via string concatenation. Use parameterized queries.',
        rule: 'sql-injection', code: trimmed });
    }

    // HTTP (not HTTPS) URLs
    if (/['"]http:\/\/(?!localhost|127\.0\.0\.1)/.test(line)) {
      issues.push({ file: filePath, line: lineNumber, severity: 'low',
        message: 'Non-HTTPS URL found. Use HTTPS in production.',
        rule: 'no-http-url', code: trimmed });
    }
  });

  return issues;
}

/**
 * Detect security issues in .NET / C# code
 */
export function detectSecurityIssuesDotNet(filePath: string, content: string): SecurityIssue[] {
  const issues: SecurityIssue[] = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmed = line.trim();

    // Hardcoded credentials
    if (/(?:Password|Secret|ApiKey|ConnectionString)\s*=\s*["'][^"']{4,}["']/i.test(line)) {
      issues.push({ file: filePath, line: lineNumber, severity: 'critical',
        message: 'Possible hardcoded credential. Use IConfiguration or environment variables.',
        rule: 'no-hardcoded-secrets', code: trimmed });
    }

    // Raw SQL string building
    if (/(?:ExecuteSqlRaw|FromSqlRaw|SqlCommand)\s*\(/.test(line)) {
      issues.push({ file: filePath, line: lineNumber, severity: 'high',
        message: 'Raw SQL execution detected. Verify parameterized queries are used.',
        rule: 'sql-injection-risk', code: trimmed });
    }

    // Process.Start (command injection risk)
    if (/Process\.Start\(/.test(line)) {
      issues.push({ file: filePath, line: lineNumber, severity: 'high',
        message: 'Process.Start() can lead to command injection. Validate all inputs.',
        rule: 'command-injection', code: trimmed });
    }

    // Insecure deserialization
    if (/BinaryFormatter|JavaScriptSerializer|TypeNameHandling\.All/.test(line)) {
      issues.push({ file: filePath, line: lineNumber, severity: 'critical',
        message: 'Insecure deserialization pattern detected.',
        rule: 'insecure-deserialization', code: trimmed });
    }

    // Weak cryptography
    if (/\b(?:MD5|SHA1|DES|RC2|TripleDES)\b/.test(line) && /Create\(\)/.test(line)) {
      issues.push({ file: filePath, line: lineNumber, severity: 'medium',
        message: 'Weak cryptographic algorithm. Use SHA256 or AES.',
        rule: 'weak-crypto', code: trimmed });
    }

    // Non-cryptographic random for security
    if (/new\s+Random\(\)/.test(line) && /token|secret|key|nonce|salt/i.test(line)) {
      issues.push({ file: filePath, line: lineNumber, severity: 'high',
        message: 'System.Random is not cryptographically secure. Use RandomNumberGenerator.',
        rule: 'insecure-random', code: trimmed });
    }

    // Missing HttpOnly on cookies (heuristic)
    if (/new\s+HttpCookie\(/.test(line)) {
      issues.push({ file: filePath, line: lineNumber, severity: 'medium',
        message: 'Verify HttpOnly and Secure flags are set on this cookie.',
        rule: 'cookie-flags', code: trimmed });
    }

    // [HttpPost] without [ValidateAntiForgeryToken] — needs multi-line check, flag the post
    if (/\[HttpPost\]/.test(line)) {
      issues.push({ file: filePath, line: lineNumber, severity: 'info',
        message: 'Verify [ValidateAntiForgeryToken] is applied to this POST action.',
        rule: 'csrf-protection', code: trimmed });
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

/**
 * Type definitions for code-tools server
 */

/**
 * Complexity analysis result
 */
export interface ComplexityResult {
  filePath: string;
  totalComplexity: number;
  functions: FunctionComplexity[];
  highComplexityFunctions: FunctionComplexity[];
  averageComplexity: number;
}

export interface FunctionComplexity {
  name: string;
  line: number;
  complexity: number;
  exceeds: boolean;
}

/**
 * Function information
 */
export interface FunctionInfo {
  name: string;
  line: number;
  signature: string;
  isExported: boolean;
  isAsync: boolean;
  parameters: string[];
  returnType?: string;
}

/**
 * Duplicate code block
 */
export interface DuplicateBlock {
  content: string;
  locations: DuplicateLocation[];
  lines: number;
  hash: string;
}

export interface DuplicateLocation {
  file: string;
  startLine: number;
  endLine: number;
}

/**
 * Code issue
 */
export interface CodeIssue {
  file: string;
  line: number;
  severity: 'error' | 'warning';
  message: string;
  rule: string;
  code?: string;
}

/**
 * Line count statistics
 */
export interface LineCount {
  path: string;
  totalLines: number;
  codeLines: number;
  commentLines: number;
  blankLines: number;
  files?: FileLineCount[];
}

export interface FileLineCount {
  file: string;
  totalLines: number;
  codeLines: number;
  commentLines: number;
  blankLines: number;
}

/**
 * Tool response format
 */
export interface ToolResponse {
  summary: string;
  data?: unknown;
  error?: string;
}

/**
 * Supported project language
 */
export type ProjectLanguage = 'typescript' | 'csharp' | 'mixed' | 'unknown';

/**
 * Security issue found during scanning
 */
export interface SecurityIssue {
  file: string;
  line: number;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  message: string;
  rule: string;
  code?: string;
}

/**
 * Result of a security scan
 */
export interface SecurityScanResult {
  path: string;
  issues: SecurityIssue[];
  total: number;
  bySeverity: Record<string, number>;
  passed: boolean;
}

/**
 * Individual test case result
 */
export interface TestCaseResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration?: number;
  error?: string;
}

/**
 * Result of running a test suite
 */
export interface TestRunResult {
  directory: string;
  framework: string;
  passed: number;
  failed: number;
  skipped: number;
  total: number;
  duration?: number;
  failures: TestCaseResult[];
  success: boolean;
  rawOutput: string;
}

/**
 * Per-file coverage entry
 */
export interface FileCoverage {
  file: string;
  statements: number;
  branches: number;
  functions: number;
  lines: number;
}

/**
 * Result of a test coverage check
 */
export interface CoverageResult {
  directory: string;
  overall: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
  files: FileCoverage[];
  threshold: number;
  passed: boolean;
}

/**
 * A single type / build error
 */
export interface TypeCheckError {
  file: string;
  line: number;
  column: number;
  message: string;
  code: string;
}

/**
 * Result of a type check (tsc --noEmit or dotnet build)
 */
export interface TypeCheckResult {
  directory: string;
  language: ProjectLanguage;
  errors: TypeCheckError[];
  warnings: TypeCheckError[];
  passed: boolean;
  rawOutput: string;
}

/**
 * Summary of a single changed file in a diff
 */
export interface DiffFileSummary {
  file: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  insertions: number;
  deletions: number;
}

/**
 * Summary of git diff output
 */
export interface DiffSummary {
  base: string;
  head: string;
  filesChanged: number;
  insertions: number;
  deletions: number;
  files: DiffFileSummary[];
}

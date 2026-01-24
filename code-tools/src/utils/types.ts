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

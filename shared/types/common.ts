/**
 * Standard tool response format
 */
export interface ToolResponse {
  summary: string;
  data?: unknown;
  error?: string;
}

/**
 * MCP error codes
 */
export enum MCPErrorCode {
  INVALID_INPUT = 'INVALID_INPUT',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  EXECUTION_FAILED = 'EXECUTION_FAILED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
}

/**
 * File operation result
 */
export interface FileOperationResult {
  success: boolean;
  path?: string;
  content?: string;
  error?: string;
}

/**
 * Git operation result
 */
export interface GitOperationResult {
  success: boolean;
  output?: string;
  error?: string;
}

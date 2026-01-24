import type { ToolResponse } from './common.js';

export function successResponse(summary: string, data?: unknown): ToolResponse {
  return { summary: `✅ ${summary}`, data };
}

export function errorResponse(summary: string, error?: string): ToolResponse {
  return { summary: `❌ ${summary}`, error };
}

export function warningResponse(summary: string, data?: unknown): ToolResponse {
  return { summary: `⚠️ ${summary}`, data };
}

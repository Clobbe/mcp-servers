export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

/**
 * Create a standard MCP tool definition
 */
export function createToolSchema(
  name: string,
  description: string,
  properties: Record<string, unknown>,
  required?: string[]
): ToolDefinition {
  return {
    name,
    description,
    inputSchema: {
      type: 'object',
      properties,
      required,
    },
  };
}

/**
 * Wrap tool handler with error handling
 */
export function withErrorHandling<T>(
  handler: (args: T) => Promise<{ summary: string; data?: unknown }>
): (args: T) => Promise<{ summary: string; data?: unknown; error?: string }> {
  return async (args: T) => {
    try {
      return await handler(args);
    } catch (error) {
      return {
        summary: `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  };
}

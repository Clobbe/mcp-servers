/**
 * List functions in a file tool
 */

import { parseSourceFile, extractFunctions } from '../utils/parser.js';
import type { ToolResponse } from '../utils/types.js';

export const listFunctionsSchema = {
  name: 'code_list_functions',
  description: 'List all functions in a TypeScript/JavaScript file',
  inputSchema: {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: 'Path to the file to analyze',
      },
      include_private: {
        type: 'boolean',
        description: 'Include private/non-exported functions (default: false)',
        default: false,
      },
    },
    required: ['file_path'],
  },
};

export async function listFunctions(args: {
  file_path: string;
  include_private?: boolean;
}): Promise<ToolResponse> {
  try {
    const includePrivate = args.include_private ?? false;

    // Parse the source file using TypeScript Compiler API
    const sourceFile = await parseSourceFile(args.file_path);

    if (!sourceFile) {
      return {
        summary: `❌ Could not parse file: ${args.file_path}`,
        error: 'File parsing failed',
      };
    }

    // Extract all functions
    let functions = extractFunctions(sourceFile);

    // Filter by privacy if needed
    if (!includePrivate) {
      functions = functions.filter((f) => f.isExported);
    }

    // Create summary
    const exportedCount = functions.filter((f) => f.isExported).length;
    const asyncCount = functions.filter((f) => f.isAsync).length;

    const summary =
      functions.length > 0
        ? `✅ Found ${functions.length} functions (${exportedCount} exported, ${asyncCount} async) in ${args.file_path}`
        : `⚠️ No functions found in ${args.file_path}`;

    return {
      summary,
      data: {
        functions,
        total: functions.length,
        exported: exportedCount,
        async: asyncCount,
        filePath: args.file_path,
      },
    };
  } catch (error) {
    return {
      summary: `❌ Error listing functions: ${error instanceof Error ? error.message : String(error)}`,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

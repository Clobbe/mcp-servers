/**
 * List functions/methods in a file — supports TypeScript/JavaScript and .NET/C#
 */

import { parseSourceFile, extractFunctions, isDotNet, extractDotNetMethods } from '../utils/parser.js';
import type { ToolResponse, FunctionInfo } from '../utils/types.js';

export const listFunctionsSchema = {
  name: 'code_list_functions',
  description:
    'List all functions/methods in a TypeScript/JavaScript or .NET/C# file.',
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
    let functions: FunctionInfo[] = [];

    if (isDotNet(args.file_path)) {
      // .NET path — regex-based method extraction
      const { readFileContent } = await import('../utils/parser.js');
      const content = await readFileContent(args.file_path);
      const methods = extractDotNetMethods(content);

      functions = methods
        .filter((m) => includePrivate || m.isPublic)
        .map((m) => ({
          name: m.name,
          line: m.line,
          signature: m.name,
          isExported: m.isPublic,
          isAsync: m.isAsync,
          parameters: [],
        }));
    } else {
      // TypeScript / JavaScript path — TypeScript Compiler API
      const sourceFile = await parseSourceFile(args.file_path);

      if (!sourceFile) {
        return {
          summary: `❌ Could not parse file: ${args.file_path}`,
          error: 'File parsing failed',
        };
      }

      functions = extractFunctions(sourceFile);
      if (!includePrivate) {
        functions = functions.filter((f) => f.isExported);
      }
    }

    const exportedCount = functions.filter((f) => f.isExported).length;
    const asyncCount = functions.filter((f) => f.isAsync).length;

    const summary =
      functions.length > 0
        ? `✅ Found ${functions.length} functions/methods (${exportedCount} public, ${asyncCount} async) in ${args.file_path}`
        : `⚠️ No functions/methods found in ${args.file_path}`;

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

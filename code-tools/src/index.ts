#!/usr/bin/env node

/**
 * Code Tools MCP Server
 * Provides code analysis and quality tools
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { analyzeComplexitySchema, analyzeComplexity } from './tools/analyze-complexity.js';
import { findDuplicatesSchema, findDuplicatesTool } from './tools/find-duplicates.js';
import { listFunctionsSchema, listFunctions } from './tools/list-functions.js';
import { countLinesSchema, countLinesTool } from './tools/count-lines.js';
import { detectIssuesSchema, detectIssuesToolFunc } from './tools/detect-issues.js';

const server = new Server(
  {
    name: 'code-tools',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      analyzeComplexitySchema,
      findDuplicatesSchema,
      listFunctionsSchema,
      countLinesSchema,
      detectIssuesSchema,
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'code_analyze_complexity': {
        const result = await analyzeComplexity(args as any);
        return {
          content: [
            {
              type: 'text',
              text: result.summary,
            },
            ...(result.data
              ? [{ type: 'text' as const, text: JSON.stringify(result.data, null, 2) }]
              : []),
          ],
        };
      }

      case 'code_find_duplicates': {
        const result = await findDuplicatesTool(args as any);
        return {
          content: [
            {
              type: 'text',
              text: result.summary,
            },
            ...(result.data
              ? [{ type: 'text' as const, text: JSON.stringify(result.data, null, 2) }]
              : []),
          ],
        };
      }

      case 'code_list_functions': {
        const result = await listFunctions(args as any);
        return {
          content: [
            {
              type: 'text',
              text: result.summary,
            },
            ...(result.data
              ? [{ type: 'text' as const, text: JSON.stringify(result.data, null, 2) }]
              : []),
          ],
        };
      }

      case 'code_count_lines': {
        const result = await countLinesTool(args as any);
        return {
          content: [
            {
              type: 'text',
              text: result.summary,
            },
            ...(result.data
              ? [{ type: 'text' as const, text: JSON.stringify(result.data, null, 2) }]
              : []),
          ],
        };
      }

      case 'code_detect_issues': {
        const result = await detectIssuesToolFunc(args as any);
        return {
          content: [
            {
              type: 'text',
              text: result.summary,
            },
            ...(result.data
              ? [{ type: 'text' as const, text: JSON.stringify(result.data, null, 2) }]
              : []),
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Code Tools MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});

#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { ralphFromPrdSchema, ralphFromPrd } from './tools/ralph-from-prd.js';
import { ralphLoopSchema, ralphLoop } from './tools/ralph-loop.js';

const server = new Server(
  {
    name: 'ralph-workflow',
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
    tools: [ralphFromPrdSchema, ralphLoopSchema],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'ralph_from_prd': {
        const result = await ralphFromPrd(args as any);
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

      case 'ralph_loop': {
        const result = await ralphLoop(args as any);
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
  console.error('Ralph Workflow MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});

#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { chainListSchema, chainList } from './tools/chain-list.js';
import { chainLoadSchema, chainLoad } from './tools/chain-load.js';
import { chainStepPromptSchema, chainStepPrompt } from './tools/chain-step-prompt.js';
import { chainRunSchema, chainRun } from './tools/chain-run.js';
import { chainSessionClearSchema, chainSessionClear } from './tools/chain-session-clear.js';

const server = new Server(
  { name: 'agent-chain', version: '0.1.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    chainListSchema,
    chainLoadSchema,
    chainStepPromptSchema,
    chainRunSchema,
    chainSessionClearSchema,
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const safeArgs = (args ?? {}) as Record<string, unknown>;

  try {
    switch (name) {
      case 'chain_list': {
        const result = chainList(safeArgs as unknown as Parameters<typeof chainList>[0]);
        return {
          content: [
            { type: 'text' as const, text: result.summary },
            ...(result.data ? [{ type: 'text' as const, text: JSON.stringify(result.data, null, 2) }] : []),
          ],
        };
      }

      case 'chain_load': {
        const result = chainLoad(safeArgs as unknown as Parameters<typeof chainLoad>[0]);
        return {
          content: [
            { type: 'text' as const, text: result.summary },
            ...(result.data ? [{ type: 'text' as const, text: JSON.stringify(result.data, null, 2) }] : []),
          ],
        };
      }

      case 'chain_step_prompt': {
        const result = chainStepPrompt(safeArgs as unknown as Parameters<typeof chainStepPrompt>[0]);
        return {
          content: [
            { type: 'text' as const, text: result.summary },
            ...(result.data ? [{ type: 'text' as const, text: JSON.stringify(result.data, null, 2) }] : []),
          ],
        };
      }

      case 'chain_run': {
        const result = chainRun(safeArgs as unknown as Parameters<typeof chainRun>[0]);
        return {
          content: [
            { type: 'text' as const, text: result.summary },
            ...(result.data ? [{ type: 'text' as const, text: JSON.stringify(result.data, null, 2) }] : []),
          ],
        };
      }

      case 'chain_session_clear': {
        const result = chainSessionClear(safeArgs as unknown as Parameters<typeof chainSessionClear>[0]);
        return {
          content: [
            { type: 'text' as const, text: result.summary },
            ...(result.data ? [{ type: 'text' as const, text: JSON.stringify(result.data, null, 2) }] : []),
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
          type: 'text' as const,
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Agent Chain MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});

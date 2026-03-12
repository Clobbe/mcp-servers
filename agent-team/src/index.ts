#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { teamListSchema, teamList } from './tools/team-list.js';
import { teamLoadSchema, teamLoad } from './tools/team-load.js';
import { agentListSchema, agentList } from './tools/agent-list.js';
import { agentGetSchema, agentGet } from './tools/agent-get.js';
import { teamDispatchSchema, teamDispatch } from './tools/team-dispatch.js';

const server = new Server(
  { name: 'agent-team', version: '0.1.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [teamListSchema, teamLoadSchema, agentListSchema, agentGetSchema, teamDispatchSchema],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const safeArgs = (args ?? {}) as Record<string, unknown>;

  try {
    switch (name) {
      case 'team_list': {
        const result = teamList(safeArgs as unknown as Parameters<typeof teamList>[0]);
        return {
          content: [
            { type: 'text' as const, text: result.summary },
            ...(result.data ? [{ type: 'text' as const, text: JSON.stringify(result.data, null, 2) }] : []),
          ],
        };
      }

      case 'team_load': {
        const result = teamLoad(safeArgs as unknown as Parameters<typeof teamLoad>[0]);
        return {
          content: [
            { type: 'text' as const, text: result.summary },
            ...(result.data ? [{ type: 'text' as const, text: JSON.stringify(result.data, null, 2) }] : []),
          ],
        };
      }

      case 'agent_list': {
        const result = agentList(safeArgs as unknown as Parameters<typeof agentList>[0]);
        return {
          content: [
            { type: 'text' as const, text: result.summary },
            ...(result.data ? [{ type: 'text' as const, text: JSON.stringify(result.data, null, 2) }] : []),
          ],
        };
      }

      case 'agent_get': {
        const result = agentGet(safeArgs as unknown as Parameters<typeof agentGet>[0]);
        return {
          content: [
            { type: 'text' as const, text: result.summary },
            ...(result.data ? [{ type: 'text' as const, text: JSON.stringify(result.data, null, 2) }] : []),
          ],
        };
      }

      case 'team_dispatch': {
        const result = teamDispatch(safeArgs as unknown as Parameters<typeof teamDispatch>[0]);
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
  console.error('Agent Team MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});

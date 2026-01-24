#!/usr/bin/env node

/**
 * Context Manager MCP Server
 *
 * Provides context bundle management tools for organizing and managing
 * code context across multiple files.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

// Import tool implementations
import { createBundleSchema, createBundleTool } from './tools/create-bundle.js';
import { addFileSchema, addFileTool } from './tools/add-file.js';
import { removeFileSchema, removeFileTool } from './tools/remove-file.js';
import { listBundlesSchema, listBundlesTool } from './tools/list-bundles.js';
import { loadBundleSchema, loadBundleTool } from './tools/load-bundle.js';
import { saveBundleSchema, saveBundleTool } from './tools/save-bundle.js';
import { mergeBundlesSchema, mergeBundlesTool } from './tools/merge-bundles.js';
import { searchContextSchema, searchContextTool } from './tools/search-context.js';
import { getStatsSchema, getStatsTool } from './tools/get-stats.js';

/**
 * Create and configure the MCP server
 */
const server = new Server(
  {
    name: 'context-manager',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Handler for listing available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      createBundleSchema,
      addFileSchema,
      removeFileSchema,
      listBundlesSchema,
      loadBundleSchema,
      saveBundleSchema,
      mergeBundlesSchema,
      searchContextSchema,
      getStatsSchema,
    ],
  };
});

/**
 * Handler for tool execution requests
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'context_create_bundle': {
        const result = await createBundleTool(args as any);
        return {
          content: [
            {
              type: 'text',
              text: result.summary,
            },
          ],
        };
      }

      case 'context_add_file': {
        const result = await addFileTool(args as any);
        return {
          content: [
            {
              type: 'text',
              text: result.summary,
            },
          ],
        };
      }

      case 'context_remove_file': {
        const result = await removeFileTool(args as any);
        return {
          content: [
            {
              type: 'text',
              text: result.summary,
            },
          ],
        };
      }

      case 'context_list_bundles': {
        const result = await listBundlesTool();
        return {
          content: [
            {
              type: 'text',
              text: result.summary,
            },
          ],
        };
      }

      case 'context_load_bundle': {
        const result = await loadBundleTool(args as any);
        return {
          content: [
            {
              type: 'text',
              text: result.summary,
            },
          ],
        };
      }

      case 'context_save_bundle': {
        const result = await saveBundleTool(args as any);
        return {
          content: [
            {
              type: 'text',
              text: result.summary,
            },
          ],
        };
      }

      case 'context_merge_bundles': {
        const result = await mergeBundlesTool(args as any);
        return {
          content: [
            {
              type: 'text',
              text: result.summary,
            },
          ],
        };
      }

      case 'context_search_context': {
        const result = await searchContextTool(args as any);
        return {
          content: [
            {
              type: 'text',
              text: result.summary,
            },
          ],
        };
      }

      case 'context_get_stats': {
        const result = await getStatsTool(args as any);
        return {
          content: [
            {
              type: 'text',
              text: result.summary,
            },
          ],
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      content: [
        {
          type: 'text',
          text: `❌ Error executing ${name}: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr (stdout is used for MCP protocol)
  console.error('Context Manager MCP server running on stdio');
  console.error('Available tools:');
  console.error('  - context_create_bundle: Create new context bundle');
  console.error('  - context_add_file: Add file to bundle');
  console.error('  - context_remove_file: Remove file from bundle');
  console.error('  - context_list_bundles: List all bundles');
  console.error('  - context_load_bundle: Load bundle contents');
  console.error('  - context_save_bundle: Save bundle to disk');
  console.error('  - context_merge_bundles: Merge multiple bundles');
  console.error('  - context_search_context: Search within bundle');
  console.error('  - context_get_stats: Get bundle statistics');
}

// Handle errors
main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});

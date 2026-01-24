#!/usr/bin/env node

/**
 * Changelog Manager MCP Server
 *
 * A Model Context Protocol server for managing project changelogs.
 * Provides tools for creating, updating, validating, and maintaining
 * CHANGELOG.md files following the Keep a Changelog format.
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
import { changelogInitSchema, changelogInit } from './tools/changelog-init.js';
import { changelogUpdateSchema, changelogUpdate } from './tools/changelog-update.js';
import { changelogValidateSchema, changelogValidate } from './tools/changelog-validate.js';
import { changelogEntryAddSchema, changelogEntryAdd } from './tools/changelog-entry-add.js';
import {
  changelogGenerateReleaseSchema,
  changelogGenerateRelease,
} from './tools/changelog-generate-release.js';
import { changelogDiffSchema, changelogDiff } from './tools/changelog-diff.js';
import { changelogSearchSchema, changelogSearch } from './tools/changelog-search.js';
import { changelogExportSchema, changelogExport } from './tools/changelog-export.js';
import { changelogStatsSchema, changelogStats } from './tools/changelog-stats.js';

/**
 * Create and configure the MCP server
 */
const server = new Server(
  {
    name: 'changelog-manager',
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
      changelogInitSchema,
      changelogEntryAddSchema,
      changelogUpdateSchema,
      changelogValidateSchema,
      changelogGenerateReleaseSchema,
      changelogDiffSchema,
      changelogSearchSchema,
      changelogExportSchema,
      changelogStatsSchema,
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
      case 'changelog_init': {
        const result = await changelogInit(args as any);
        return {
          content: [
            {
              type: 'text',
              text: result.summary,
            },
          ],
        };
      }

      case 'changelog_update': {
        const result = await changelogUpdate(args as any);
        return {
          content: [
            {
              type: 'text',
              text: result.summary,
            },
          ],
        };
      }

      case 'changelog_validate': {
        const result = await changelogValidate(args as any);
        return {
          content: [
            {
              type: 'text',
              text: result.report,
            },
          ],
        };
      }

      case 'changelog_entry_add': {
        const result = await changelogEntryAdd(args as any);
        return {
          content: [
            {
              type: 'text',
              text: result.summary,
            },
          ],
        };
      }

      case 'changelog_generate_release': {
        const result = await changelogGenerateRelease(args as any);
        return {
          content: [
            {
              type: 'text',
              text: result.summary,
            },
          ],
        };
      }

      case 'changelog_diff': {
        const result = await changelogDiff(args as any);
        return {
          content: [
            {
              type: 'text',
              text: result.summary,
            },
          ],
        };
      }

      case 'changelog_search': {
        const result = await changelogSearch(args as any);
        return {
          content: [
            {
              type: 'text',
              text: result.summary,
            },
          ],
        };
      }

      case 'changelog_export': {
        const result = await changelogExport(args as any);
        return {
          content: [
            {
              type: 'text',
              text: result.summary,
            },
          ],
        };
      }

      case 'changelog_stats': {
        const result = await changelogStats(args as any);
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
  console.error('Changelog Manager MCP server running on stdio');
  console.error('Available tools:');
  console.error('  - changelog_init: Initialize a new CHANGELOG.md');
  console.error('  - changelog_entry_add: Quick-add a single entry');
  console.error('  - changelog_update: Update changelog with recent changes');
  console.error('  - changelog_validate: Validate changelog format');
  console.error('  - changelog_generate_release: Generate release from Unreleased');
  console.error('  - changelog_diff: Compare two versions');
  console.error('  - changelog_search: Search changelog entries');
  console.error('  - changelog_export: Export to JSON/HTML/text');
  console.error('  - changelog_stats: Get changelog statistics');
}

// Handle errors
main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});

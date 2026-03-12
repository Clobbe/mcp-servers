#!/usr/bin/env node

/**
 * Code Tools MCP Server
 * Provides code analysis and quality tools for TypeScript/JavaScript and .NET/C# projects.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Existing tools
import { analyzeComplexitySchema, analyzeComplexity } from './tools/analyze-complexity.js';
import { findDuplicatesSchema, findDuplicatesTool } from './tools/find-duplicates.js';
import { listFunctionsSchema, listFunctions } from './tools/list-functions.js';
import { countLinesSchema, countLinesTool } from './tools/count-lines.js';
import { detectIssuesSchema, detectIssuesToolFunc } from './tools/detect-issues.js';

// New tools
import { runTestsSchema, runTestsTool } from './tools/run-tests.js';
import { checkCoverageSchema, checkCoverageTool } from './tools/check-coverage.js';
import { securityScanSchema, securityScanTool } from './tools/security-scan.js';
import { typeCheckSchema, typeCheckTool } from './tools/type-check.js';
import { diffSummarySchema, diffSummaryTool } from './tools/diff-summary.js';

const server = new Server(
  {
    name: 'code-tools',
    version: '0.2.0',
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
      // Analysis tools
      analyzeComplexitySchema,
      findDuplicatesSchema,
      listFunctionsSchema,
      countLinesSchema,
      detectIssuesSchema,
      // New: pipeline tools
      runTestsSchema,
      checkCoverageSchema,
      securityScanSchema,
      typeCheckSchema,
      diffSummarySchema,
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result;

    switch (name) {
      case 'code_analyze_complexity':
        result = await analyzeComplexity(args as never);
        break;

      case 'code_find_duplicates':
        result = await findDuplicatesTool(args as never);
        break;

      case 'code_list_functions':
        result = await listFunctions(args as never);
        break;

      case 'code_count_lines':
        result = await countLinesTool(args as never);
        break;

      case 'code_detect_issues':
        result = await detectIssuesToolFunc(args as never);
        break;

      case 'code_run_tests':
        result = await runTestsTool(args as never);
        break;

      case 'code_check_coverage':
        result = await checkCoverageTool(args as never);
        break;

      case 'code_security_scan':
        result = await securityScanTool(args as never);
        break;

      case 'code_type_check':
        result = await typeCheckTool(args as never);
        break;

      case 'code_diff_summary':
        result = await diffSummaryTool(args as never);
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        { type: 'text', text: result.summary },
        ...(result.data
          ? [{ type: 'text' as const, text: JSON.stringify(result.data, null, 2) }]
          : []),
      ],
    };
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
  console.error('Code Tools MCP Server v0.2.0 running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});

#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { handlePRDCreate } from './tools/prd-create.js';
import { handlePRDFromTemplate } from './tools/prd-from-template.js';
import { handlePRDValidate } from './tools/prd-validate.js';

/**
 * PRD Generator MCP Server
 * Provides tools for creating and validating Product Requirements Documents
 */
const server = new Server(
  {
    name: 'prd-generator',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'prd_create',
        description:
          'Create a Product Requirements Document from structured input with features, requirements, and technical details',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Project name (required)',
            },
            description: {
              type: 'string',
              description: 'Project overview and description (required)',
            },
            features: {
              type: 'array',
              description: 'List of features (at least 1 required)',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', description: 'Feature name' },
                  description: { type: 'string', description: 'Feature description' },
                  priority: {
                    type: 'string',
                    enum: ['high', 'medium', 'low'],
                    default: 'medium',
                    description: 'Feature priority',
                  },
                },
                required: ['name', 'description'],
              },
              minItems: 1,
            },
            requirements: {
              type: 'array',
              description: 'List of requirements (optional)',
              items: {
                type: 'object',
                properties: {
                  description: { type: 'string', description: 'Requirement description' },
                  priority: {
                    type: 'string',
                    enum: ['must', 'should', 'could'],
                    default: 'should',
                    description: 'Requirement priority',
                  },
                },
                required: ['description'],
              },
            },
            technicalDetails: {
              type: 'object',
              description: 'Technical stack information (optional)',
              properties: {
                languages: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Programming languages',
                },
                frameworks: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Frameworks and libraries',
                },
                databases: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Database systems',
                },
                infrastructure: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Infrastructure and deployment platforms',
                },
              },
            },
            output_format: {
              type: 'string',
              enum: ['markdown', 'json'],
              default: 'markdown',
              description: 'Output format',
            },
          },
          required: ['title', 'description', 'features'],
        },
      },
      {
        name: 'prd_from_template',
        description:
          'Create a PRD from a pre-built template (web-app, api-service, mobile-app, library, or full-stack)',
        inputSchema: {
          type: 'object',
          properties: {
            template: {
              type: 'string',
              enum: ['web-app', 'api-service', 'mobile-app', 'library', 'full-stack'],
              description: 'Template type to use',
            },
            projectName: {
              type: 'string',
              description: 'Project name (required)',
            },
            output_format: {
              type: 'string',
              enum: ['markdown', 'json'],
              default: 'markdown',
              description: 'Output format',
            },
          },
          required: ['template', 'projectName'],
        },
      },
      {
        name: 'prd_validate',
        description:
          'Validate PRD structure, completeness, and compatibility with ralph-workflow parser',
        inputSchema: {
          type: 'object',
          properties: {
            prd_content: {
              type: 'string',
              description: 'PRD markdown content to validate (required)',
            },
            check_compatibility: {
              type: 'boolean',
              default: true,
              description: 'Check ralph-workflow compatibility',
            },
            output_format: {
              type: 'string',
              enum: ['markdown', 'json'],
              default: 'markdown',
              description: 'Output format (markdown includes colors/emoji)',
            },
          },
          required: ['prd_content'],
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'prd_create':
        return await handlePRDCreate(args);
      case 'prd_from_template':
        return await handlePRDFromTemplate(args);
      case 'prd_validate':
        return await handlePRDValidate(args);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
          }),
        },
      ],
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('PRD Generator MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});

/**
 * Create Bundle Tool
 */

import { createBundle } from '../utils/bundle-manager.js';
import { loadFile } from '../utils/file-loader.js';

export const createBundleSchema = {
  name: 'context_create_bundle',
  description: 'Create a new context bundle',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Bundle name',
      },
      description: {
        type: 'string',
        description: 'Bundle description',
      },
      files: {
        type: 'array',
        items: { type: 'string' },
        description: 'Initial files to include',
      },
    },
    required: ['name'],
  },
};

interface CreateBundleArgs {
  name: string;
  description?: string;
  files?: string[];
}

interface CreateBundleResult {
  summary: string;
  bundle?: {
    name: string;
    fileCount: number;
    totalSize: number;
  };
}

export async function createBundleTool(args: CreateBundleArgs): Promise<CreateBundleResult> {
  try {
    const bundle = await createBundle(args.name, args.description || '');

    // Add initial files if provided
    if (args.files && args.files.length > 0) {
      for (const filePath of args.files) {
        try {
          const file = await loadFile(filePath);
          bundle.files.push(file);
        } catch (error) {
          // Skip files that can't be loaded
        }
      }

      // Update metadata
      bundle.metadata.fileCount = bundle.files.length;
      bundle.metadata.totalSize = bundle.files.reduce((sum, f) => sum + f.size, 0);
    }

    return {
      summary:
        `✅ Created bundle "${args.name}"\n\n` +
        `Files: ${bundle.files.length}\n` +
        `Total size: ${bundle.metadata.totalSize} bytes`,
      bundle: {
        name: bundle.name,
        fileCount: bundle.files.length,
        totalSize: bundle.metadata.totalSize,
      },
    };
  } catch (error) {
    return {
      summary: `❌ Error creating bundle: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

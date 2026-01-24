/**
 * Merge Bundles Tool
 */

import { mergeBundles } from '../utils/bundle-manager.js';

export const mergeBundlesSchema = {
  name: 'context_merge_bundles',
  description: 'Merge multiple context bundles',
  inputSchema: {
    type: 'object',
    properties: {
      bundle_names: {
        type: 'array',
        items: { type: 'string' },
        description: 'Bundles to merge',
      },
      output_name: {
        type: 'string',
        description: 'Name for merged bundle',
      },
      description: {
        type: 'string',
        description: 'Description for merged bundle',
      },
    },
    required: ['bundle_names', 'output_name'],
  },
};

interface MergeBundlesArgs {
  bundle_names: string[];
  output_name: string;
  description?: string;
}

interface MergeBundlesResult {
  summary: string;
  mergedBundle?: {
    name: string;
    fileCount: number;
    totalSize: number;
  };
}

export async function mergeBundlesTool(args: MergeBundlesArgs): Promise<MergeBundlesResult> {
  try {
    if (args.bundle_names.length < 2) {
      return {
        summary: '❌ Error: Need at least 2 bundles to merge',
      };
    }

    const merged = await mergeBundles(
      args.bundle_names,
      args.output_name,
      args.description || `Merged from: ${args.bundle_names.join(', ')}`
    );

    return {
      summary:
        `✅ Merged ${args.bundle_names.length} bundles into "${args.output_name}"\n\n` +
        `Source bundles: ${args.bundle_names.join(', ')}\n` +
        `Total files: ${merged.files.length}\n` +
        `Total size: ${merged.metadata.totalSize} bytes`,
      mergedBundle: {
        name: merged.name,
        fileCount: merged.files.length,
        totalSize: merged.metadata.totalSize,
      },
    };
  } catch (error) {
    return {
      summary: `❌ Error merging bundles: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

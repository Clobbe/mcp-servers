/**
 * Save Bundle Tool
 */

import { promises as fs } from 'fs';
import { loadBundle } from '../utils/bundle-manager.js';

export const saveBundleSchema = {
  name: 'context_save_bundle',
  description: 'Save context bundle to disk',
  inputSchema: {
    type: 'object',
    properties: {
      bundle_name: {
        type: 'string',
        description: 'Bundle name',
      },
      output_path: {
        type: 'string',
        description: 'Output file path',
      },
    },
    required: ['bundle_name'],
  },
};

interface SaveBundleArgs {
  bundle_name: string;
  output_path?: string;
}

interface SaveBundleResult {
  summary: string;
  outputPath?: string;
}

export async function saveBundleTool(args: SaveBundleArgs): Promise<SaveBundleResult> {
  try {
    const bundle = await loadBundle(args.bundle_name);
    const outputPath = args.output_path || `./${args.bundle_name}.json`;

    await fs.writeFile(outputPath, JSON.stringify(bundle, null, 2), 'utf-8');

    return {
      summary:
        `✅ Saved bundle "${args.bundle_name}" to ${outputPath}\n\n` +
        `Files: ${bundle.files.length}\n` +
        `Size: ${JSON.stringify(bundle).length} bytes`,
      outputPath,
    };
  } catch (error) {
    return {
      summary: `❌ Error saving bundle: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

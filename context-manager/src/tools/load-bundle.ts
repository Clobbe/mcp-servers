/**
 * Load Bundle Tool
 */

import { loadBundle } from '../utils/bundle-manager.js';

export const loadBundleSchema = {
  name: 'context_load_bundle',
  description: 'Load a context bundle',
  inputSchema: {
    type: 'object',
    properties: {
      bundle_name: {
        type: 'string',
        description: 'Bundle name to load',
      },
    },
    required: ['bundle_name'],
  },
};

interface LoadBundleArgs {
  bundle_name: string;
}

interface LoadBundleResult {
  summary: string;
  files?: Array<{
    path: string;
    language: string;
    size: number;
  }>;
}

export async function loadBundleTool(args: LoadBundleArgs): Promise<LoadBundleResult> {
  try {
    const bundle = await loadBundle(args.bundle_name);

    let summary = `✅ Loaded bundle "${bundle.name}"\n\n`;

    if (bundle.description) {
      summary += `Description: ${bundle.description}\n\n`;
    }

    summary += `Total files: ${bundle.files.length}\n`;
    summary += `Total size: ${bundle.metadata.totalSize} bytes\n`;
    summary += `Created: ${new Date(bundle.metadata.created).toLocaleString()}\n`;
    summary += `Modified: ${new Date(bundle.metadata.modified).toLocaleString()}\n\n`;

    if (bundle.files.length > 0) {
      summary += 'Files:\n';
      bundle.files.forEach((file) => {
        summary += `- ${file.path} (${file.language}, ${file.size} bytes)\n`;
      });
    }

    return {
      summary,
      files: bundle.files.map((f) => ({
        path: f.path,
        language: f.language,
        size: f.size,
      })),
    };
  } catch (error) {
    return {
      summary: `❌ Error loading bundle: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

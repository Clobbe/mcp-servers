/**
 * List Bundles Tool
 */

import { listBundles, loadBundle } from '../utils/bundle-manager.js';

export const listBundlesSchema = {
  name: 'context_list_bundles',
  description: 'List all available context bundles',
  inputSchema: {
    type: 'object',
    properties: {},
  },
};

interface ListBundlesResult {
  summary: string;
  bundles: Array<{
    name: string;
    fileCount: number;
    totalSize: number;
  }>;
}

export async function listBundlesTool(): Promise<ListBundlesResult> {
  try {
    const bundleNames = await listBundles();

    if (bundleNames.length === 0) {
      return {
        summary: '📦 No bundles found\n\nCreate a new bundle with context_create_bundle',
        bundles: [],
      };
    }

    const bundles = [];
    let summary = `📦 Found ${bundleNames.length} bundle${bundleNames.length === 1 ? '' : 's'}\n\n`;

    for (const name of bundleNames) {
      try {
        const bundle = await loadBundle(name);
        bundles.push({
          name: bundle.name,
          fileCount: bundle.metadata.fileCount,
          totalSize: bundle.metadata.totalSize,
        });

        summary += `- ${bundle.name}\n`;
        summary += `  Files: ${bundle.metadata.fileCount}\n`;
        summary += `  Size: ${bundle.metadata.totalSize} bytes\n`;
        if (bundle.description) {
          summary += `  Description: ${bundle.description}\n`;
        }
        summary += '\n';
      } catch {
        // Skip bundles that can't be loaded
      }
    }

    return {
      summary,
      bundles,
    };
  } catch (error) {
    return {
      summary: `❌ Error listing bundles: ${error instanceof Error ? error.message : String(error)}`,
      bundles: [],
    };
  }
}

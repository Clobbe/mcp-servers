/**
 * Get Stats Tool
 */

import { loadBundle } from '../utils/bundle-manager.js';
import type { BundleStats } from '../utils/types.js';

export const getStatsSchema = {
  name: 'context_get_stats',
  description: 'Get statistics about context bundle',
  inputSchema: {
    type: 'object',
    properties: {
      bundle_name: {
        type: 'string',
        description: 'Bundle name',
      },
    },
    required: ['bundle_name'],
  },
};

interface GetStatsArgs {
  bundle_name: string;
}

interface GetStatsResult {
  summary: string;
  stats?: BundleStats;
}

export async function getStatsTool(args: GetStatsArgs): Promise<GetStatsResult> {
  try {
    const bundle = await loadBundle(args.bundle_name);

    // Calculate statistics
    const languages: Record<string, number> = {};
    let totalLines = 0;
    let largestFile = '';
    let largestSize = 0;

    bundle.files.forEach((file) => {
      // Count languages
      languages[file.language] = (languages[file.language] || 0) + 1;

      // Count lines
      totalLines += file.content.split('\n').length;

      // Find largest file
      if (file.size > largestSize) {
        largestSize = file.size;
        largestFile = file.path;
      }
    });

    const stats: BundleStats = {
      name: bundle.name,
      fileCount: bundle.files.length,
      totalSize: bundle.metadata.totalSize,
      totalLines,
      languages,
      largestFile,
      created: bundle.metadata.created,
      modified: bundle.metadata.modified,
    };

    let summary = `📊 Statistics for "${bundle.name}"\n\n`;
    summary += `## Overview\n`;
    summary += `Files: ${stats.fileCount}\n`;
    summary += `Total Size: ${stats.totalSize} bytes\n`;
    summary += `Total Lines: ${stats.totalLines}\n`;
    summary += `Largest File: ${stats.largestFile} (${largestSize} bytes)\n\n`;

    summary += `## Languages\n`;
    Object.entries(stats.languages)
      .sort((a, b) => b[1] - a[1])
      .forEach(([lang, count]) => {
        const percentage = ((count / stats.fileCount) * 100).toFixed(1);
        summary += `- ${lang}: ${count} files (${percentage}%)\n`;
      });

    summary += `\n## Metadata\n`;
    summary += `Created: ${new Date(stats.created).toLocaleString()}\n`;
    summary += `Modified: ${new Date(stats.modified).toLocaleString()}\n`;

    return {
      summary,
      stats,
    };
  } catch (error) {
    return {
      summary: `❌ Error getting stats: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

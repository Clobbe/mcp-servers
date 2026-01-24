/**
 * Changelog Stats Tool
 *
 * Generates statistics about the changelog.
 */

import { readChangelog } from '../utils/file-ops.js';
import { parseChangelog } from '../utils/changelog-parser.js';
import type { ChangelogStructure, SectionType } from '../utils/types.js';

export const changelogStatsSchema = {
  name: 'changelog_stats',
  description: 'Get statistics about changelog',
  inputSchema: {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: 'Path to CHANGELOG.md',
        default: './CHANGELOG.md',
      },
    },
  },
};

interface StatsArgs {
  file_path?: string;
}

interface StatsResult {
  summary: string;
  totalVersions: number;
  totalEntries: number;
  categoryCounts: Record<string, number>;
}

/**
 * Generate changelog statistics
 *
 * @param args - Tool arguments
 * @returns Statistics result
 */
export async function changelogStats(args: StatsArgs): Promise<StatsResult> {
  try {
    const filePath = args.file_path || './CHANGELOG.md';

    // Read and parse changelog
    const content = await readChangelog(filePath);
    const changelog = parseChangelog(content);

    // Calculate statistics
    const stats = calculateStats(changelog);

    // Format summary
    const summary = formatStatsSummary(changelog, stats);

    return {
      summary,
      totalVersions: stats.totalVersions,
      totalEntries: stats.totalEntries,
      categoryCounts: stats.categoryCounts,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      summary: `❌ Error calculating statistics: ${errorMessage}`,
      totalVersions: 0,
      totalEntries: 0,
      categoryCounts: {},
    };
  }
}

interface ChangelogStats {
  totalVersions: number;
  totalEntries: number;
  categoryCounts: Record<string, number>;
  entriesPerVersion: Map<string, number>;
  oldestVersion: string | null;
  newestVersion: string | null;
  hasUnreleased: boolean;
  unreleasedCount: number;
}

/**
 * Calculate statistics from changelog
 */
function calculateStats(changelog: ChangelogStructure): ChangelogStats {
  const categoryCounts: Record<string, number> = {};
  const entriesPerVersion = new Map<string, number>();

  let totalEntries = 0;
  let hasUnreleased = false;
  let unreleasedCount = 0;
  let oldestVersion: string | null = null;
  let newestVersion: string | null = null;

  for (const entry of changelog.entries) {
    let versionEntryCount = 0;

    // Track unreleased
    if (entry.date === 'Unreleased') {
      hasUnreleased = true;
    }

    // Process each section
    for (const section of entry.sections) {
      const count = section.items.length;
      versionEntryCount += count;
      totalEntries += count;

      // Count by category
      if (!categoryCounts[section.type]) {
        categoryCounts[section.type] = 0;
      }
      categoryCounts[section.type] += count;

      // Count unreleased entries
      if (entry.date === 'Unreleased') {
        unreleasedCount += count;
      }
    }

    entriesPerVersion.set(entry.date, versionEntryCount);

    // Track oldest and newest (excluding Unreleased)
    if (entry.date !== 'Unreleased') {
      if (!newestVersion) {
        newestVersion = entry.date;
      }
      oldestVersion = entry.date; // Last non-unreleased entry is oldest
    }
  }

  return {
    totalVersions: changelog.entries.length,
    totalEntries,
    categoryCounts,
    entriesPerVersion,
    oldestVersion,
    newestVersion,
    hasUnreleased,
    unreleasedCount,
  };
}

/**
 * Format statistics summary
 */
function formatStatsSummary(changelog: ChangelogStructure, stats: ChangelogStats): string {
  const lines: string[] = [];

  lines.push('📊 Changelog Statistics');
  lines.push('');
  lines.push('## Overview');
  lines.push(`- Title: ${changelog.title}`);
  lines.push(`- Total Versions: ${stats.totalVersions}`);
  lines.push(`- Total Entries: ${stats.totalEntries}`);

  if (stats.newestVersion && stats.oldestVersion) {
    lines.push(`- Date Range: ${stats.oldestVersion} to ${stats.newestVersion}`);
  }

  // Unreleased section
  if (stats.hasUnreleased) {
    lines.push('');
    lines.push('## Unreleased');
    lines.push(`- Entries: ${stats.unreleasedCount}`);
  }

  // Category breakdown
  lines.push('');
  lines.push('## By Category');

  const sortedCategories = Object.entries(stats.categoryCounts).sort((a, b) => b[1] - a[1]); // Sort by count descending

  for (const [category, count] of sortedCategories) {
    const percentage = ((count / stats.totalEntries) * 100).toFixed(1);
    lines.push(`- ${category}: ${count} (${percentage}%)`);
  }

  // Version breakdown
  lines.push('');
  lines.push('## By Version');

  const sortedVersions = Array.from(stats.entriesPerVersion.entries()).sort((a, b) => {
    // Unreleased always first
    if (a[0] === 'Unreleased') return -1;
    if (b[0] === 'Unreleased') return 1;
    // Then by date descending
    return b[0].localeCompare(a[0]);
  });

  for (const [version, count] of sortedVersions) {
    lines.push(`- ${version}: ${count} entries`);
  }

  // Average entries per version
  const releasedVersions = stats.totalVersions - (stats.hasUnreleased ? 1 : 0);
  if (releasedVersions > 0) {
    const releasedEntries = stats.totalEntries - stats.unreleasedCount;
    const avgPerVersion = (releasedEntries / releasedVersions).toFixed(1);
    lines.push('');
    lines.push(`## Averages`);
    lines.push(`- Average entries per released version: ${avgPerVersion}`);
  }

  return lines.join('\n');
}

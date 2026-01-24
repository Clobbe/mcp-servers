/**
 * Changelog Search Tool
 *
 * Searches changelog entries by query, category, and version.
 */

import { readFile } from '../utils/file-ops.js';
import { parseChangelog } from '../utils/changelog-parser.js';
import type { ChangelogEntry, SectionType } from '../utils/types.js';

export const changelogSearchSchema = {
  name: 'changelog_search',
  description: 'Search changelog entries',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query (case-insensitive)',
      },
      category: {
        type: 'string',
        description: 'Filter by category (optional): Added, Changed, Fixed, etc.',
      },
      version: {
        type: 'string',
        description: 'Filter by version/date (optional): e.g., "2024-01-15" or "Unreleased"',
      },
      file_path: {
        type: 'string',
        description: 'Path to CHANGELOG.md',
        default: './CHANGELOG.md',
      },
    },
    required: ['query'],
  },
};

interface SearchArgs {
  query: string;
  category?: string;
  version?: string;
  file_path?: string;
}

interface SearchResult {
  summary: string;
  matches: SearchMatch[];
  totalMatches: number;
}

interface SearchMatch {
  version: string;
  category: string;
  item: string;
}

/**
 * Search changelog entries
 *
 * @param args - Tool arguments
 * @returns Search results
 */
export async function changelogSearch(args: SearchArgs): Promise<SearchResult> {
  try {
    const filePath = args.file_path || './CHANGELOG.md';
    const query = args.query.toLowerCase().trim();
    const categoryFilter = args.category?.trim();
    const versionFilter = args.version?.trim();

    if (!query) {
      return {
        summary: '❌ Error: Search query cannot be empty',
        matches: [],
        totalMatches: 0,
      };
    }

    // Read and parse changelog
    const content = await readFile(filePath);
    const changelog = parseChangelog(content);

    // Search for matches
    const matches: SearchMatch[] = [];

    for (const entry of changelog.entries) {
      // Skip if version filter doesn't match
      if (versionFilter && entry.date !== versionFilter) {
        continue;
      }

      for (const section of entry.sections) {
        // Skip if category filter doesn't match
        if (categoryFilter && section.type.toLowerCase() !== categoryFilter.toLowerCase()) {
          continue;
        }

        for (const item of section.items) {
          // Check if item matches query (case-insensitive)
          if (item.toLowerCase().includes(query)) {
            matches.push({
              version: entry.date,
              category: section.type,
              item,
            });
          }
        }
      }
    }

    // Build summary
    let summary = '';

    if (matches.length === 0) {
      summary = `🔍 No matches found for "${args.query}"`;

      if (categoryFilter) {
        summary += ` in category "${categoryFilter}"`;
      }
      if (versionFilter) {
        summary += ` in version "${versionFilter}"`;
      }
    } else {
      summary = `✅ Found ${matches.length} match${matches.length === 1 ? '' : 'es'} for "${args.query}"`;

      if (categoryFilter) {
        summary += ` in category "${categoryFilter}"`;
      }
      if (versionFilter) {
        summary += ` in version "${versionFilter}"`;
      }

      summary += '\n\n';

      // Group by version
      const byVersion = new Map<string, SearchMatch[]>();
      for (const match of matches) {
        if (!byVersion.has(match.version)) {
          byVersion.set(match.version, []);
        }
        byVersion.get(match.version)!.push(match);
      }

      // Format results
      for (const [version, versionMatches] of byVersion) {
        summary += `\n## ${version}\n`;

        // Group by category within version
        const byCategory = new Map<string, SearchMatch[]>();
        for (const match of versionMatches) {
          if (!byCategory.has(match.category)) {
            byCategory.set(match.category, []);
          }
          byCategory.get(match.category)!.push(match);
        }

        for (const [category, categoryMatches] of byCategory) {
          summary += `\n### ${category}\n`;
          for (const match of categoryMatches) {
            summary += `- ${match.item}\n`;
          }
        }
      }
    }

    return {
      summary,
      matches,
      totalMatches: matches.length,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      summary: `❌ Error searching changelog: ${errorMessage}`,
      matches: [],
      totalMatches: 0,
    };
  }
}

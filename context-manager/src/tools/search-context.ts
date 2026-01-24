/**
 * Search Context Tool
 */

import { loadBundle } from '../utils/bundle-manager.js';
import type { SearchResult } from '../utils/types.js';

export const searchContextSchema = {
  name: 'context_search_context',
  description: 'Search within context bundle',
  inputSchema: {
    type: 'object',
    properties: {
      bundle_name: {
        type: 'string',
        description: 'Bundle name',
      },
      query: {
        type: 'string',
        description: 'Search query',
      },
      case_sensitive: {
        type: 'boolean',
        description: 'Case sensitive search',
        default: false,
      },
    },
    required: ['bundle_name', 'query'],
  },
};

interface SearchContextArgs {
  bundle_name: string;
  query: string;
  case_sensitive?: boolean;
}

interface SearchContextResult {
  summary: string;
  results: SearchResult[];
}

export async function searchContextTool(args: SearchContextArgs): Promise<SearchContextResult> {
  try {
    const bundle = await loadBundle(args.bundle_name);
    const results: SearchResult[] = [];
    const caseSensitive = args.case_sensitive || false;

    const searchQuery = caseSensitive ? args.query : args.query.toLowerCase();

    for (const file of bundle.files) {
      const lines = file.content.split('\n');

      lines.forEach((line, index) => {
        const searchLine = caseSensitive ? line : line.toLowerCase();

        if (searchLine.includes(searchQuery)) {
          results.push({
            filePath: file.path,
            line: index + 1,
            content: line.trim(),
            match: args.query,
          });
        }
      });
    }

    let summary = '';

    if (results.length === 0) {
      summary = `🔍 No matches found for "${args.query}" in bundle "${args.bundle_name}"`;
    } else {
      summary = `✅ Found ${results.length} match${results.length === 1 ? '' : 'es'} for "${args.query}"\n\n`;

      // Group by file
      const byFile = new Map<string, SearchResult[]>();
      results.forEach((r) => {
        if (!byFile.has(r.filePath)) {
          byFile.set(r.filePath, []);
        }
        byFile.get(r.filePath)!.push(r);
      });

      for (const [filePath, fileResults] of byFile) {
        summary += `\n${filePath} (${fileResults.length} matches):\n`;
        fileResults.slice(0, 5).forEach((result) => {
          summary += `  Line ${result.line}: ${result.content}\n`;
        });

        if (fileResults.length > 5) {
          summary += `  ... and ${fileResults.length - 5} more matches\n`;
        }
      }
    }

    return {
      summary,
      results,
    };
  } catch (error) {
    return {
      summary: `❌ Error searching: ${error instanceof Error ? error.message : String(error)}`,
      results: [],
    };
  }
}

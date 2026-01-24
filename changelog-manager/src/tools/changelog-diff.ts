/**
 * Changelog Diff Tool
 *
 * Compares two versions in a changelog and shows differences.
 */

import { readChangelog } from '../utils/file-ops.js';
import { parseChangelog, findEntry } from '../utils/changelog-parser.js';
import type { ChangelogEntry, ChangelogSection } from '../utils/types.js';

export const changelogDiffSchema = {
  name: 'changelog_diff',
  description: 'Compare two versions in changelog',
  inputSchema: {
    type: 'object',
    properties: {
      version1: {
        type: 'string',
        description: 'First version or date (e.g., "2024-01-15" or "Unreleased")',
      },
      version2: {
        type: 'string',
        description: 'Second version or date (e.g., "2024-01-10")',
      },
      file_path: {
        type: 'string',
        description: 'Path to CHANGELOG.md',
        default: './CHANGELOG.md',
      },
    },
    required: ['version1', 'version2'],
  },
};

interface DiffArgs {
  version1: string;
  version2: string;
  file_path?: string;
}

interface DiffResult {
  summary: string;
  version1: string;
  version2: string;
  differences: string;
}

/**
 * Compare two changelog entries
 *
 * @param args - Tool arguments
 * @returns Diff result
 */
export async function changelogDiff(args: DiffArgs): Promise<DiffResult> {
  try {
    const filePath = args.file_path || './CHANGELOG.md';
    const version1 = args.version1.trim();
    const version2 = args.version2.trim();

    // Read and parse changelog
    const content = await readChangelog(filePath);
    const changelog = parseChangelog(content);

    // Find both versions
    const entry1 = findEntry(changelog, version1);
    const entry2 = findEntry(changelog, version2);

    if (!entry1) {
      return {
        summary: `❌ Error: Version "${version1}" not found in changelog`,
        version1,
        version2,
        differences: '',
      };
    }

    if (!entry2) {
      return {
        summary: `❌ Error: Version "${version2}" not found in changelog`,
        version1,
        version2,
        differences: '',
      };
    }

    // Compare entries
    const differences = compareEntries(entry1, entry2, version1, version2);

    // Count total items in each version
    const count1 = countItems(entry1);
    const count2 = countItems(entry2);

    return {
      summary:
        `✅ Comparison of ${version1} vs ${version2}\n\n` +
        `${version1}: ${count1} total items\n` +
        `${version2}: ${count2} total items\n\n` +
        `Differences:\n${differences}`,
      version1,
      version2,
      differences,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      summary: `❌ Error comparing versions: ${errorMessage}`,
      version1: args.version1,
      version2: args.version2,
      differences: '',
    };
  }
}

/**
 * Count total items in an entry
 */
function countItems(entry: ChangelogEntry): number {
  return entry.sections.reduce((sum, section) => sum + section.items.length, 0);
}

/**
 * Compare two changelog entries
 */
function compareEntries(
  entry1: ChangelogEntry,
  entry2: ChangelogEntry,
  label1: string,
  label2: string
): string {
  const lines: string[] = [];

  // Get all unique section types
  const allSections = new Set<string>();
  entry1.sections.forEach((s) => allSections.add(s.type));
  entry2.sections.forEach((s) => allSections.add(s.type));

  // Compare each section
  for (const sectionType of Array.from(allSections).sort()) {
    const section1 = entry1.sections.find((s) => s.type === sectionType);
    const section2 = entry2.sections.find((s) => s.type === sectionType);

    const items1 = section1 ? new Set(section1.items) : new Set<string>();
    const items2 = section2 ? new Set(section2.items) : new Set<string>();

    // Items only in version 1
    const onlyIn1: string[] = [];
    for (const item of items1) {
      if (!items2.has(item)) {
        onlyIn1.push(item);
      }
    }

    // Items only in version 2
    const onlyIn2: string[] = [];
    for (const item of items2) {
      if (!items1.has(item)) {
        onlyIn2.push(item);
      }
    }

    // Items in both
    const inBoth: string[] = [];
    for (const item of items1) {
      if (items2.has(item)) {
        inBoth.push(item);
      }
    }

    // Only report if there are differences or common items
    if (onlyIn1.length > 0 || onlyIn2.length > 0 || inBoth.length > 0) {
      lines.push(`\n### ${sectionType}`);

      if (inBoth.length > 0) {
        lines.push(`\n  Common (${inBoth.length} items):`);
        inBoth.forEach((item) => {
          lines.push(`    ✓ ${item}`);
        });
      }

      if (onlyIn1.length > 0) {
        lines.push(`\n  Only in ${label1} (${onlyIn1.length} items):`);
        onlyIn1.forEach((item) => {
          lines.push(`    + ${item}`);
        });
      }

      if (onlyIn2.length > 0) {
        lines.push(`\n  Only in ${label2} (${onlyIn2.length} items):`);
        onlyIn2.forEach((item) => {
          lines.push(`    - ${item}`);
        });
      }
    }
  }

  return lines.length > 0 ? lines.join('\n') : 'No differences found (versions are identical)';
}

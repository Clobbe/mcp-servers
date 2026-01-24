/**
 * Changelog Generate Release Tool
 *
 * Generates release notes from the Unreleased section of a changelog.
 * Converts the Unreleased section to a versioned release with date.
 */

import { readChangelog, writeChangelog } from '../utils/file-ops.js';
import {
  parseChangelog,
  serializeChangelog,
  findEntry,
  getTodayDate,
  isValidDate,
} from '../utils/changelog-parser.js';
import type { ChangelogEntry } from '../utils/types.js';

export const changelogGenerateReleaseSchema = {
  name: 'changelog_generate_release',
  description: 'Generate release notes from Unreleased section',
  inputSchema: {
    type: 'object',
    properties: {
      version: {
        type: 'string',
        description: 'New version number (e.g., 1.0.0, 2.1.3)',
      },
      date: {
        type: 'string',
        description: 'Release date (YYYY-MM-DD) or "today"',
      },
      file_path: {
        type: 'string',
        description: 'Path to CHANGELOG.md',
        default: './CHANGELOG.md',
      },
    },
    required: ['version'],
  },
};

interface GenerateReleaseArgs {
  version: string;
  date?: string;
  file_path?: string;
}

interface GenerateReleaseResult {
  summary: string;
  version: string;
  date: string;
  entriesCount: number;
}

/**
 * Generate release notes from Unreleased section
 *
 * @param args - Tool arguments
 * @returns Release generation result
 */
export async function changelogGenerateRelease(
  args: GenerateReleaseArgs
): Promise<GenerateReleaseResult> {
  try {
    const filePath = args.file_path || './CHANGELOG.md';
    const version = args.version.trim();

    // Determine release date
    let releaseDate: string;
    if (!args.date || args.date === 'today') {
      releaseDate = getTodayDate();
    } else {
      releaseDate = args.date.trim();
      if (!isValidDate(releaseDate)) {
        return {
          summary: `❌ Error: Invalid date format "${releaseDate}". Use YYYY-MM-DD or "today"`,
          version: '',
          date: '',
          entriesCount: 0,
        };
      }
    }

    // Validate version format (simple semver check)
    if (!version.match(/^\d+\.\d+\.\d+$/)) {
      return {
        summary: `❌ Error: Invalid version format "${version}". Use semantic versioning (e.g., 1.0.0)`,
        version: '',
        date: '',
        entriesCount: 0,
      };
    }

    // Read and parse changelog
    const content = await readChangelog(filePath);
    const changelog = parseChangelog(content);

    // Find Unreleased section
    const unreleased = findEntry(changelog, 'Unreleased');
    if (!unreleased) {
      return {
        summary: '❌ Error: No "Unreleased" section found in changelog',
        version: '',
        date: '',
        entriesCount: 0,
      };
    }

    // Check if Unreleased has any content
    const totalItems = unreleased.sections.reduce((sum, section) => sum + section.items.length, 0);
    if (totalItems === 0) {
      return {
        summary: '❌ Error: "Unreleased" section is empty. Add entries before generating release',
        version: '',
        date: '',
        entriesCount: 0,
      };
    }

    // Check if version already exists
    const existingVersion = findEntry(changelog, releaseDate);
    if (existingVersion) {
      return {
        summary: `❌ Error: A release with date ${releaseDate} already exists`,
        version: '',
        date: '',
        entriesCount: 0,
      };
    }

    // Create new release entry
    const releaseEntry: ChangelogEntry = {
      date: releaseDate,
      description: `Version ${version}`,
      sections: unreleased.sections,
    };

    // Create new empty Unreleased entry
    const newUnreleased: ChangelogEntry = {
      date: 'Unreleased',
      description: '',
      sections: [],
    };

    // Update changelog structure
    const updatedEntries = [newUnreleased, releaseEntry];

    // Add all existing entries except Unreleased
    for (const entry of changelog.entries) {
      if (entry.date !== 'Unreleased') {
        updatedEntries.push(entry);
      }
    }

    const updatedChangelog = {
      ...changelog,
      entries: updatedEntries,
    };

    // Serialize and write back
    const newContent = serializeChangelog(updatedChangelog);
    await writeChangelog(filePath, newContent);

    // Build summary
    const sectionSummary = unreleased.sections
      .map((section) => `  - ${section.type}: ${section.items.length} items`)
      .join('\n');

    return {
      summary:
        `✅ Generated release ${version} (${releaseDate})\n\n` +
        `Moved ${totalItems} entries from Unreleased to ${version}:\n` +
        sectionSummary +
        '\n\n' +
        `Created new empty Unreleased section for future changes.`,
      version,
      date: releaseDate,
      entriesCount: totalItems,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      summary: `❌ Error generating release: ${errorMessage}`,
      version: '',
      date: '',
      entriesCount: 0,
    };
  }
}

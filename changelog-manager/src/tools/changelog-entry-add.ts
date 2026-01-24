// Tool: Quick add a single entry to changelog
import { locateChangelog, readChangelog, writeChangelog } from '../utils/file-ops.js';
import {
  parseChangelog,
  serializeChangelog,
  getTodayDate,
  findEntry,
  findSection,
} from '../utils/changelog-parser.js';
import type { SectionType } from '../utils/types.js';

export const changelogEntryAddSchema = {
  name: 'changelog_entry_add',
  description: 'Quickly add a single entry to the changelog without full analysis',
  inputSchema: {
    type: 'object',
    properties: {
      entry: {
        type: 'string',
        description: 'The changelog entry to add (e.g., "Add user authentication")',
      },
      category: {
        type: 'string',
        description:
          'Category: Added, Changed, Fixed, Removed, Deprecated, Security, Documentation, Testing, Performance, Dependencies, Breaking Changes',
        enum: [
          'Added',
          'Changed',
          'Fixed',
          'Removed',
          'Deprecated',
          'Security',
          'Documentation',
          'Testing',
          'Performance',
          'Dependencies',
          'Breaking Changes',
        ],
      },
      changelog_path: {
        type: 'string',
        description: 'Path to CHANGELOG.md (optional, will auto-detect)',
      },
      use_unreleased: {
        type: 'boolean',
        description: 'Add to [Unreleased] section instead of today\'s date',
        default: true,
      },
    },
    required: ['entry', 'category'],
  },
};

export async function changelogEntryAdd(args: {
  entry: string;
  category: SectionType;
  changelog_path?: string;
  use_unreleased?: boolean;
}): Promise<{ summary: string; success: boolean }> {
  try {
    const cwd = process.cwd();

    // Locate changelog
    const changelogPath = args.changelog_path || (await locateChangelog(cwd));

    if (!changelogPath) {
      return {
        summary: '❌ No CHANGELOG.md found.\n\nRun changelog_init to create one first.',
        success: false,
      };
    }

    // Read and parse changelog
    const content = await readChangelog(changelogPath);
    const changelog = parseChangelog(content);

    // Determine entry date
    const entryDate = args.use_unreleased !== false ? 'Unreleased' : getTodayDate();

    // Find or create entry
    let entry = findEntry(changelog, entryDate);

    if (!entry) {
      entry = {
        date: entryDate,
        description: '',
        sections: [],
      };
      // Insert at the beginning
      changelog.entries.unshift(entry);
    }

    // Find or create section
    let section = findSection(entry, args.category);

    if (!section) {
      section = {
        type: args.category,
        items: [],
      };
      entry.sections.push(section);
    }

    // Check for duplicate
    if (section.items.includes(args.entry)) {
      return {
        summary: `⚠️ Entry already exists in [${entryDate}] → ${args.category}:\n- ${args.entry}`,
        success: false,
      };
    }

    // Add entry
    section.items.push(args.entry);

    // Serialize and write
    const updatedContent = serializeChangelog(changelog);
    await writeChangelog(changelogPath, updatedContent);

    const summary = [
      `✅ Entry added successfully!`,
      '',
      `**File**: ${changelogPath}`,
      `**Section**: [${entryDate}] → ${args.category}`,
      `**Entry**: ${args.entry}`,
      '',
      `Total items in ${args.category}: ${section.items.length}`,
    ].join('\n');

    return {
      summary,
      success: true,
    };
  } catch (error) {
    return {
      summary: `❌ Error adding entry: ${error instanceof Error ? error.message : String(error)}`,
      success: false,
    };
  }
}

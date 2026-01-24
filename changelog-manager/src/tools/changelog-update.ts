// Tool: Update changelog with recent changes
import { locateChangelog, readChangelog, writeChangelog } from '../utils/file-ops.js';
import {
  parseChangelog,
  serializeChangelog,
  getTodayDate,
  findEntry,
  findSection,
} from '../utils/changelog-parser.js';
import type { ChangelogEntry, ChangelogSection, SectionType } from '../utils/types.js';
import {
  isGitRepository,
  getGitStatus,
  getRecentCommits,
  getCommitsSinceLastTag,
  categorizeCommit,
} from '../utils/git-ops.js';

export const changelogUpdateSchema = {
  name: 'changelog_update',
  description: 'Analyze recent changes and update CHANGELOG.md with a new entry',
  inputSchema: {
    type: 'object',
    properties: {
      changelog_path: {
        type: 'string',
        description: 'Path to CHANGELOG.md (optional, will auto-detect)',
      },
      description: {
        type: 'string',
        description: 'Brief description for this entry (optional)',
      },
      use_unreleased: {
        type: 'boolean',
        description: 'Add to [Unreleased] section instead of today\'s date',
        default: false,
      },
    },
  },
};

export async function changelogUpdate(args: {
  changelog_path?: string;
  description?: string;
  use_unreleased?: boolean;
}): Promise<{ summary: string; entriesAdded: number }> {
  try {
    const cwd = process.cwd();

    // Locate changelog
    const changelogPath = args.changelog_path || (await locateChangelog(cwd));

    if (!changelogPath) {
      return {
        summary: '❌ No CHANGELOG.md found.\n\nRun changelog_init to create one first.',
        entriesAdded: 0,
      };
    }

    // Read and parse existing changelog
    const content = await readChangelog(changelogPath);
    const changelog = parseChangelog(content);

    // Determine entry date
    const entryDate = args.use_unreleased ? 'Unreleased' : getTodayDate();

    // Gather changes from git
    const changesReport: string[] = [];
    const newSections: ChangelogSection[] = [];

    const isGit = await isGitRepository(cwd);
    
    if (isGit) {
      changesReport.push('✓ Git repository detected');

      // Get uncommitted changes
      try {
        const status = await getGitStatus(cwd);
        const totalChanges =
          status.added.length +
          status.modified.length +
          status.deleted.length +
          status.renamed.length;

        if (totalChanges > 0) {
          changesReport.push(`✓ Found ${totalChanges} uncommitted changes`);

          // Add files to appropriate sections
          if (status.added.length > 0) {
            const section = getOrCreateSection(newSections, 'Added');
            section.items.push(`${status.added.length} new file(s) added`);
          }

          if (status.modified.length > 0) {
            const section = getOrCreateSection(newSections, 'Changed');
            section.items.push(`${status.modified.length} file(s) modified`);
          }

          if (status.deleted.length > 0) {
            const section = getOrCreateSection(newSections, 'Removed');
            section.items.push(`${status.deleted.length} file(s) deleted`);
          }
        }
      } catch (error) {
        changesReport.push(`⚠️ Could not get git status: ${error}`);
      }

      // Get recent commits
      try {
        const commits = await getRecentCommits('7 days ago', 20, cwd);
        
        if (commits.length > 0) {
          changesReport.push(`✓ Analyzed ${commits.length} recent commits`);

          // Categorize commits
          for (const commit of commits) {
            const categorized = categorizeCommit(commit.message);

            if (categorized.isBreaking) {
              const section = getOrCreateSection(newSections, 'Breaking Changes');
              section.items.push(categorized.description);
            } else if (categorized.type) {
              const sectionType = mapCommitTypeToSection(categorized.type);
              if (sectionType) {
                const section = getOrCreateSection(newSections, sectionType);
                section.items.push(categorized.description);
              }
            } else {
              // Unclassified commit - add to Changed
              const section = getOrCreateSection(newSections, 'Changed');
              section.items.push(commit.message);
            }
          }
        }
      } catch (error) {
        changesReport.push(`⚠️ Could not analyze commits: ${error}`);
      }
    } else {
      changesReport.push('⚠️ Not a git repository - cannot auto-detect changes');
    }

    // Check if we have anything to add
    if (newSections.length === 0 || newSections.every((s) => s.items.length === 0)) {
      return {
        summary:
          '✓ No changes detected.\n\n' +
          'Either there are no recent commits/changes, or they\'re already documented.\n\n' +
          'Use changelog_entry_add to manually add an entry.',
        entriesAdded: 0,
      };
    }

    // Find or create entry
    let entry = findEntry(changelog, entryDate);
    
    if (!entry) {
      entry = {
        date: entryDate,
        description: args.description || '',
        sections: [],
      };
      // Insert at the beginning
      changelog.entries.unshift(entry);
    }

    // Merge new sections into entry
    let itemsAdded = 0;
    for (const newSection of newSections) {
      let existingSection = findSection(entry, newSection.type);
      
      if (!existingSection) {
        existingSection = { type: newSection.type, items: [] };
        entry.sections.push(existingSection);
      }

      // Add items (avoiding duplicates)
      for (const item of newSection.items) {
        if (!existingSection.items.includes(item)) {
          existingSection.items.push(item);
          itemsAdded++;
        }
      }
    }

    // Serialize and write
    const updatedContent = serializeChangelog(changelog);
    await writeChangelog(changelogPath, updatedContent);

    // Build summary
    const summary = [
      `✅ Updated ${changelogPath}`,
      '',
      `**Entry**: [${entryDate}]${args.description ? ` - ${args.description}` : ''}`,
      `**Items Added**: ${itemsAdded}`,
      '',
      '### Changes Detected:',
      ...changesReport.map((r) => `- ${r}`),
      '',
      '### Sections Updated:',
      ...newSections.map((s) => `- **${s.type}**: ${s.items.length} item(s)`),
    ].join('\n');

    return {
      summary,
      entriesAdded: itemsAdded,
    };
  } catch (error) {
    return {
      summary: `❌ Error updating changelog: ${error instanceof Error ? error.message : String(error)}`,
      entriesAdded: 0,
    };
  }
}

/**
 * Get or create a section in the sections array
 */
function getOrCreateSection(
  sections: ChangelogSection[],
  type: SectionType
): ChangelogSection {
  let section = sections.find((s) => s.type === type);
  
  if (!section) {
    section = { type, items: [] };
    sections.push(section);
  }

  return section;
}

/**
 * Map conventional commit type to changelog section
 */
function mapCommitTypeToSection(commitType: string): SectionType | null {
  const mapping: Record<string, SectionType> = {
    feat: 'Added',
    feature: 'Added',
    fix: 'Fixed',
    docs: 'Documentation',
    refactor: 'Changed',
    perf: 'Performance',
    test: 'Testing',
    chore: 'Changed',
    build: 'Dependencies',
    ci: 'Changed',
  };

  return mapping[commitType.toLowerCase()] || null;
}

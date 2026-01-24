// Parser for CHANGELOG.md files
import type { ChangelogStructure, ChangelogEntry, ChangelogSection, SectionType, VALID_SECTIONS } from './types.js';

const VALID_SECTION_NAMES: SectionType[] = [
  'Added',
  'Changed',
  'Deprecated',
  'Removed',
  'Fixed',
  'Security',
  'Documentation',
  'Testing',
  'Performance',
  'Dependencies',
  'Breaking Changes',
];

/**
 * Parse a CHANGELOG.md file into structured data
 */
export function parseChangelog(content: string): ChangelogStructure {
  const lines = content.split('\n');
  
  let title = '';
  let description = '';
  const entries: ChangelogEntry[] = [];
  
  let currentEntry: ChangelogEntry | null = null;
  let currentSection: ChangelogSection | null = null;
  let inHeader = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Extract title (# Changelog)
    if (line.startsWith('# ')) {
      title = line.substring(2).trim();
      inHeader = true;
      continue;
    }

    // Detect entry header (## [YYYY-MM-DD] or ## [Unreleased])
    const entryMatch = line.match(/^##\s+\[([^\]]+)\](.*)$/);
    if (entryMatch) {
      // Save previous entry
      if (currentEntry && currentSection) {
        currentEntry.sections.push(currentSection);
      }
      if (currentEntry) {
        entries.push(currentEntry);
      }

      // Start new entry
      const [, date, desc] = entryMatch;
      currentEntry = {
        date: date.trim(),
        description: desc.trim().replace(/^-\s*/, ''),
        sections: [],
      };
      currentSection = null;
      inHeader = false;
      continue;
    }

    // Detect section header (### Added, ### Fixed, etc.)
    const sectionMatch = line.match(/^###\s+(.+)$/);
    if (sectionMatch && currentEntry) {
      // Save previous section
      if (currentSection) {
        currentEntry.sections.push(currentSection);
      }

      const sectionName = sectionMatch[1].trim();
      const sectionType = VALID_SECTION_NAMES.find(
        (s) => s.toLowerCase() === sectionName.toLowerCase()
      );

      currentSection = {
        type: (sectionType || sectionName) as SectionType,
        items: [],
      };
      continue;
    }

    // Extract bullet points
    if (line.trim().startsWith('-') && currentSection) {
      const item = line.trim().substring(1).trim();
      if (item) {
        currentSection.items.push(item);
      }
      continue;
    }

    // Extract description from header
    if (inHeader && line.trim() && !line.startsWith('#') && !line.startsWith('---')) {
      description += (description ? '\n' : '') + line.trim();
    }
  }

  // Save last entry and section
  if (currentEntry && currentSection) {
    currentEntry.sections.push(currentSection);
  }
  if (currentEntry) {
    entries.push(currentEntry);
  }

  return {
    title: title || 'Changelog',
    description,
    entries,
  };
}

/**
 * Find a specific entry by date
 */
export function findEntry(changelog: ChangelogStructure, date: string): ChangelogEntry | null {
  return changelog.entries.find((e) => e.date === date) || null;
}

/**
 * Find a section within an entry
 */
export function findSection(entry: ChangelogEntry, sectionType: SectionType): ChangelogSection | null {
  return entry.sections.find((s) => s.type === sectionType) || null;
}

/**
 * Serialize changelog back to markdown
 */
export function serializeChangelog(changelog: ChangelogStructure): string {
  let output = `# ${changelog.title}\n\n`;

  if (changelog.description) {
    output += `${changelog.description}\n\n`;
  }

  output += '---\n\n';

  for (const entry of changelog.entries) {
    // Entry header
    output += `## [${entry.date}]`;
    if (entry.description) {
      output += ` - ${entry.description}`;
    }
    output += '\n\n';

    // Sections
    for (const section of entry.sections) {
      if (section.items.length === 0) continue; // Skip empty sections

      output += `### ${section.type}\n`;
      for (const item of section.items) {
        output += `- ${item}\n`;
      }
      output += '\n';
    }

    output += '---\n\n';
  }

  return output.trim() + '\n';
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if a date string is valid YYYY-MM-DD
 */
export function isValidDate(dateString: string): boolean {
  if (dateString === 'Unreleased') return true;
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;

  const [, year, month, day] = match;
  const date = new Date(`${year}-${month}-${day}`);
  
  return (
    date.getFullYear() === parseInt(year) &&
    date.getMonth() + 1 === parseInt(month) &&
    date.getDate() === parseInt(day)
  );
}

/**
 * Check if dates are in chronological order (newest first)
 */
export function areDatesInOrder(dates: string[]): boolean {
  for (let i = 0; i < dates.length - 1; i++) {
    if (dates[i] === 'Unreleased') continue;
    if (dates[i + 1] === 'Unreleased') return false;
    
    if (new Date(dates[i]) < new Date(dates[i + 1])) {
      return false;
    }
  }
  return true;
}

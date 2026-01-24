// Validation logic for changelogs
import type { ValidationResult, ValidationIssue, ChangelogStructure, SectionType } from './types.js';
import { parseChangelog, isValidDate, areDatesInOrder } from './changelog-parser.js';

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
 * Validate a changelog file
 */
export function validateChangelog(content: string): ValidationResult {
  const issues: ValidationIssue[] = [];
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const info: ValidationIssue[] = [];

  try {
    const changelog = parseChangelog(content);

    // Check for title
    if (!changelog.title || changelog.title.toLowerCase() !== 'changelog') {
      warnings.push({
        message: 'Title should be "# Changelog"',
        severity: 'warning',
        suggestion: 'Add "# Changelog" as the first line',
      });
    }

    // Check for Keep a Changelog reference
    if (!content.includes('Keep a Changelog')) {
      info.push({
        message: 'Consider adding reference to Keep a Changelog format',
        severity: 'info',
        suggestion: 'Add: "The format is based on [Keep a Changelog](https://keepachangelog.com/)"',
      });
    }

    // Check for [Unreleased] section
    const hasUnreleased = changelog.entries.some((e) => e.date === 'Unreleased');
    if (!hasUnreleased) {
      warnings.push({
        message: 'No [Unreleased] section found',
        severity: 'warning',
        suggestion: 'Add an [Unreleased] section at the top for upcoming changes',
      });
    }

    // Validate each entry
    const dates: string[] = [];
    for (const entry of changelog.entries) {
      dates.push(entry.date);

      // Validate date format
      if (!isValidDate(entry.date)) {
        errors.push({
          message: `Invalid date format: "${entry.date}"`,
          severity: 'error',
          suggestion: 'Use YYYY-MM-DD format (e.g., 2025-01-24)',
        });
      }

      // Check for empty sections
      for (const section of entry.sections) {
        if (section.items.length === 0) {
          warnings.push({
            message: `Empty section "${section.type}" in [${entry.date}]`,
            severity: 'warning',
            suggestion: 'Remove empty sections or add content',
          });
        }

        // Validate section names
        if (!VALID_SECTION_NAMES.includes(section.type)) {
          warnings.push({
            message: `Non-standard section name: "${section.type}"`,
            severity: 'warning',
            suggestion: `Use standard sections: ${VALID_SECTION_NAMES.join(', ')}`,
          });
        }
      }

      // Check for description
      if (!entry.description && entry.date !== 'Unreleased') {
        info.push({
          message: `Entry [${entry.date}] has no description`,
          severity: 'info',
          suggestion: 'Add a brief description after the date',
        });
      }

      // Check for duplicate entries
      const duplicates = dates.filter((d) => d === entry.date);
      if (duplicates.length > 1) {
        errors.push({
          message: `Duplicate entry for date: ${entry.date}`,
          severity: 'error',
          suggestion: 'Merge duplicate entries into one',
        });
      }
    }

    // Check chronological order
    if (!areDatesInOrder(dates)) {
      errors.push({
        message: 'Entries are not in chronological order',
        severity: 'error',
        suggestion: 'Sort entries with newest first (Unreleased at top)',
      });
    }

    // Categorize issues
    for (const issue of issues) {
      if (issue.severity === 'error') errors.push(issue);
      else if (issue.severity === 'warning') warnings.push(issue);
      else info.push(issue);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      info,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [
        {
          message: `Failed to parse changelog: ${error}`,
          severity: 'error',
        },
      ],
      warnings: [],
      info: [],
    };
  }
}

/**
 * Format validation result as a readable report
 */
export function formatValidationReport(result: ValidationResult, filePath: string): string {
  let report = `## Changelog Validation Report\n\n`;
  report += `**File**: ${filePath}\n`;
  report += `**Status**: ${result.valid ? '✅ Valid' : '❌ Invalid'}\n\n`;

  if (result.errors.length > 0) {
    report += `### ❌ Errors (${result.errors.length})\n\n`;
    for (const error of result.errors) {
      report += `- ${error.message}\n`;
      if (error.suggestion) {
        report += `  - **Fix**: ${error.suggestion}\n`;
      }
    }
    report += '\n';
  }

  if (result.warnings.length > 0) {
    report += `### ⚠️ Warnings (${result.warnings.length})\n\n`;
    for (const warning of result.warnings) {
      report += `- ${warning.message}\n`;
      if (warning.suggestion) {
        report += `  - **Suggestion**: ${warning.suggestion}\n`;
      }
    }
    report += '\n';
  }

  if (result.info.length > 0) {
    report += `### ℹ️ Info (${result.info.length})\n\n`;
    for (const i of result.info) {
      report += `- ${i.message}\n`;
      if (i.suggestion) {
        report += `  - **Suggestion**: ${i.suggestion}\n`;
      }
    }
    report += '\n';
  }

  if (result.valid && result.warnings.length === 0 && result.info.length === 0) {
    report += '✅ Changelog is valid and follows best practices!\n';
  } else if (result.valid) {
    report += '✅ Changelog is valid, but could be improved.\n';
  } else {
    report += '❌ Changelog has errors that need to be fixed.\n';
  }

  return report;
}

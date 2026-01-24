/**
 * Changelog Export Tool
 *
 * Exports changelog to different formats (JSON, HTML, text).
 */

import { readFile, writeFile } from '../utils/file-ops.js';
import { parseChangelog } from '../utils/changelog-parser.js';
import type { ChangelogStructure, ChangelogEntry } from '../utils/types.js';

export const changelogExportSchema = {
  name: 'changelog_export',
  description: 'Export changelog to different formats',
  inputSchema: {
    type: 'object',
    properties: {
      format: {
        type: 'string',
        enum: ['json', 'html', 'text'],
        description: 'Export format',
      },
      output_path: {
        type: 'string',
        description: 'Output file path',
      },
      file_path: {
        type: 'string',
        description: 'Path to CHANGELOG.md',
        default: './CHANGELOG.md',
      },
    },
    required: ['format', 'output_path'],
  },
};

interface ExportArgs {
  format: 'json' | 'html' | 'text';
  output_path: string;
  file_path?: string;
}

interface ExportResult {
  summary: string;
  outputPath: string;
  format: string;
}

/**
 * Export changelog to different formats
 *
 * @param args - Tool arguments
 * @returns Export result
 */
export async function changelogExport(args: ExportArgs): Promise<ExportResult> {
  try {
    const filePath = args.file_path || './CHANGELOG.md';
    const outputPath = args.output_path.trim();
    const format = args.format;

    // Read and parse changelog
    const content = await readFile(filePath);
    const changelog = parseChangelog(content);

    // Export to requested format
    let exportedContent: string;

    switch (format) {
      case 'json':
        exportedContent = exportToJSON(changelog);
        break;
      case 'html':
        exportedContent = exportToHTML(changelog);
        break;
      case 'text':
        exportedContent = exportToText(changelog);
        break;
      default:
        return {
          summary: `❌ Error: Unsupported format "${format}"`,
          outputPath: '',
          format: '',
        };
    }

    // Write to output file
    await writeFile(outputPath, exportedContent);

    return {
      summary:
        `✅ Exported changelog to ${format.toUpperCase()} format\n\n` +
        `Output: ${outputPath}\n` +
        `Size: ${exportedContent.length} bytes`,
      outputPath,
      format,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      summary: `❌ Error exporting changelog: ${errorMessage}`,
      outputPath: '',
      format: '',
    };
  }
}

/**
 * Export to JSON format
 */
function exportToJSON(changelog: ChangelogStructure): string {
  return JSON.stringify(changelog, null, 2);
}

/**
 * Export to HTML format
 */
function exportToHTML(changelog: ChangelogStructure): string {
  const lines: string[] = [];

  lines.push('<!DOCTYPE html>');
  lines.push('<html lang="en">');
  lines.push('<head>');
  lines.push('  <meta charset="UTF-8">');
  lines.push('  <meta name="viewport" content="width=device-width, initial-scale=1.0">');
  lines.push(`  <title>${escapeHTML(changelog.title)}</title>`);
  lines.push('  <style>');
  lines.push(
    '    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; line-height: 1.6; color: #333; }'
  );
  lines.push('    h1 { border-bottom: 2px solid #333; padding-bottom: 10px; }');
  lines.push(
    '    h2 { color: #0066cc; margin-top: 30px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }'
  );
  lines.push('    h3 { color: #555; margin-top: 20px; }');
  lines.push('    ul { padding-left: 25px; }');
  lines.push('    li { margin: 5px 0; }');
  lines.push('    .description { color: #666; font-style: italic; margin: 10px 0; }');
  lines.push('    .date { color: #999; font-size: 0.9em; }');
  lines.push('  </style>');
  lines.push('</head>');
  lines.push('<body>');

  lines.push(`  <h1>${escapeHTML(changelog.title)}</h1>`);

  if (changelog.description) {
    lines.push(`  <p class="description">${escapeHTML(changelog.description)}</p>`);
  }

  for (const entry of changelog.entries) {
    lines.push(`  <h2>${escapeHTML(entry.date)}</h2>`);

    if (entry.description) {
      lines.push(`  <p class="date">${escapeHTML(entry.description)}</p>`);
    }

    for (const section of entry.sections) {
      if (section.items.length === 0) continue;

      lines.push(`  <h3>${escapeHTML(section.type)}</h3>`);
      lines.push('  <ul>');

      for (const item of section.items) {
        lines.push(`    <li>${escapeHTML(item)}</li>`);
      }

      lines.push('  </ul>');
    }
  }

  lines.push('</body>');
  lines.push('</html>');

  return lines.join('\n');
}

/**
 * Export to plain text format
 */
function exportToText(changelog: ChangelogStructure): string {
  const lines: string[] = [];

  lines.push('='.repeat(changelog.title.length));
  lines.push(changelog.title);
  lines.push('='.repeat(changelog.title.length));
  lines.push('');

  if (changelog.description) {
    lines.push(changelog.description);
    lines.push('');
  }

  lines.push('-'.repeat(80));
  lines.push('');

  for (const entry of changelog.entries) {
    lines.push(`[${entry.date}]`);

    if (entry.description) {
      lines.push(`  ${entry.description}`);
    }

    lines.push('');

    for (const section of entry.sections) {
      if (section.items.length === 0) continue;

      lines.push(`  ${section.type}:`);

      for (const item of section.items) {
        lines.push(`    • ${item}`);
      }

      lines.push('');
    }

    lines.push('-'.repeat(80));
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Escape HTML special characters
 */
function escapeHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

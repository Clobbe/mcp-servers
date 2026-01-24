/**
 * Find duplicate code blocks tool
 */

import fs from 'fs/promises';
import path from 'path';
import { readFileContent, isTypeScriptOrJavaScript } from '../utils/parser.js';
import { findDuplicates } from '../utils/analyzer.js';
import type { ToolResponse } from '../utils/types.js';

export const findDuplicatesSchema = {
  name: 'code_find_duplicates',
  description: 'Find duplicate code blocks in a directory',
  inputSchema: {
    type: 'object',
    properties: {
      directory: {
        type: 'string',
        description: 'Directory path to scan for duplicates',
      },
      min_lines: {
        type: 'number',
        description: 'Minimum number of consecutive lines to consider as duplicate (default: 5)',
        default: 5,
      },
    },
    required: ['directory'],
  },
};

export async function findDuplicatesTool(args: {
  directory: string;
  min_lines?: number;
}): Promise<ToolResponse> {
  try {
    const minLines = args.min_lines ?? 5;

    // Read all TypeScript/JavaScript files in directory
    const files = await readFilesInDirectory(args.directory);

    if (files.length === 0) {
      return {
        summary: `⚠️ No TypeScript/JavaScript files found in ${args.directory}`,
        data: { duplicates: [], filesScanned: 0 },
      };
    }

    // Find duplicates
    const duplicates = findDuplicates(files, minLines);

    const summary =
      duplicates.length > 0
        ? `⚠️ Found ${duplicates.length} duplicate code blocks across ${files.length} files`
        : `✅ No duplicate code blocks found in ${files.length} files`;

    return {
      summary,
      data: {
        duplicates,
        filesScanned: files.length,
        minLines,
      },
    };
  } catch (error) {
    return {
      summary: `❌ Error finding duplicates: ${error instanceof Error ? error.message : String(error)}`,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Read all TypeScript/JavaScript files in a directory (non-recursive for performance)
 */
async function readFilesInDirectory(
  dirPath: string
): Promise<Array<{ path: string; content: string }>> {
  const files: Array<{ path: string; content: string }> = [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isFile() && isTypeScriptOrJavaScript(entry.name)) {
        try {
          const content = await readFileContent(fullPath);
          files.push({ path: fullPath, content });
        } catch (error) {
          console.error(`Error reading ${fullPath}:`, error);
        }
      }
    }
  } catch (error) {
    throw new Error(`Cannot read directory ${dirPath}: ${error}`);
  }

  return files;
}

/**
 * Count lines of code tool
 */

import fs from 'fs/promises';
import path from 'path';
import { readFileContent, isTypeScriptOrJavaScript } from '../utils/parser.js';
import { countLines } from '../utils/analyzer.js';
import type { ToolResponse, LineCount, FileLineCount } from '../utils/types.js';

export const countLinesSchema = {
  name: 'code_count_lines',
  description: 'Count lines of code (excluding comments and blank lines)',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'File or directory path to analyze',
      },
      include_tests: {
        type: 'boolean',
        description: 'Include test files in count (default: false)',
        default: false,
      },
    },
    required: ['path'],
  },
};

export async function countLinesTool(args: {
  path: string;
  include_tests?: boolean;
}): Promise<ToolResponse> {
  try {
    const includeTests = args.include_tests ?? false;

    // Check if path is file or directory
    const stats = await fs.stat(args.path);

    if (stats.isFile()) {
      return countSingleFile(args.path);
    } else if (stats.isDirectory()) {
      return countDirectory(args.path, includeTests);
    } else {
      return {
        summary: `❌ Path is neither a file nor directory: ${args.path}`,
        error: 'Invalid path type',
      };
    }
  } catch (error) {
    return {
      summary: `❌ Error counting lines: ${error instanceof Error ? error.message : String(error)}`,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Count lines in a single file
 */
async function countSingleFile(filePath: string): Promise<ToolResponse> {
  try {
    const content = await readFileContent(filePath);
    const result = countLines(content);
    result.file = filePath;

    const summary = `✅ ${filePath}: ${result.codeLines} code lines (${result.totalLines} total, ${result.commentLines} comments, ${result.blankLines} blank)`;

    return {
      summary,
      data: {
        path: filePath,
        totalLines: result.totalLines,
        codeLines: result.codeLines,
        commentLines: result.commentLines,
        blankLines: result.blankLines,
      },
    };
  } catch (error) {
    throw new Error(`Cannot read file ${filePath}: ${error}`);
  }
}

/**
 * Count lines in all files in a directory
 */
async function countDirectory(dirPath: string, includeTests: boolean): Promise<ToolResponse> {
  try {
    const files: FileLineCount[] = [];
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      // Skip test files if not included
      if (!includeTests && isTestFile(entry.name)) {
        continue;
      }

      if (entry.isFile() && isTypeScriptOrJavaScript(entry.name)) {
        try {
          const content = await readFileContent(fullPath);
          const result = countLines(content);
          result.file = fullPath;
          files.push(result);
        } catch (error) {
          console.error(`Error reading ${fullPath}:`, error);
        }
      }
    }

    // Calculate totals
    const totalLines = files.reduce((sum, f) => sum + f.totalLines, 0);
    const codeLines = files.reduce((sum, f) => sum + f.codeLines, 0);
    const commentLines = files.reduce((sum, f) => sum + f.commentLines, 0);
    const blankLines = files.reduce((sum, f) => sum + f.blankLines, 0);

    const summary = `✅ Analyzed ${files.length} files in ${dirPath}: ${codeLines} code lines (${totalLines} total, ${commentLines} comments, ${blankLines} blank)`;

    return {
      summary,
      data: {
        path: dirPath,
        totalLines,
        codeLines,
        commentLines,
        blankLines,
        files,
      },
    };
  } catch (error) {
    throw new Error(`Cannot read directory ${dirPath}: ${error}`);
  }
}

/**
 * Check if file is a test file
 */
function isTestFile(filename: string): boolean {
  return /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(filename) || filename.includes('__tests__');
}

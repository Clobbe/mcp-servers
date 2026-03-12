/**
 * Diff summary tool — produces a structured summary of git changes.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import type { ToolResponse, DiffSummary, DiffFileSummary } from '../utils/types.js';

const execAsync = promisify(exec);

export const diffSummarySchema = {
  name: 'code_diff_summary',
  description:
    'Produce a structured summary of git changes between two refs. ' +
    'Shows files changed, insertions, deletions, and change type per file.',
  inputSchema: {
    type: 'object',
    properties: {
      directory: {
        type: 'string',
        description: 'Git repository root directory',
      },
      base: {
        type: 'string',
        description: 'Base ref to diff against (default: HEAD~1)',
        default: 'HEAD~1',
      },
      head: {
        type: 'string',
        description: 'Head ref to diff (default: HEAD)',
        default: 'HEAD',
      },
    },
    required: ['directory'],
  },
};

export async function diffSummaryTool(args: {
  directory: string;
  base?: string;
  head?: string;
}): Promise<ToolResponse> {
  const { directory, base = 'HEAD~1', head = 'HEAD' } = args;

  try {
    // Get --stat output
    const statCmd = `git diff --stat ${base} ${head}`;
    const nameStatusCmd = `git diff --name-status ${base} ${head}`;
    const shortStatCmd = `git diff --shortstat ${base} ${head}`;

    let statOut = '';
    let nameStatusOut = '';
    let shortStatOut = '';

    try {
      [statOut, nameStatusOut, shortStatOut] = await Promise.all([
        execAsync(statCmd, { cwd: directory }).then((r) => r.stdout),
        execAsync(nameStatusCmd, { cwd: directory }).then((r) => r.stdout),
        execAsync(shortStatCmd, { cwd: directory }).then((r) => r.stdout),
      ]);
    } catch (err: unknown) {
      const e = err as { stdout?: string; stderr?: string; message?: string };
      // HEAD~1 may not exist for initial commits — try EMPTY_TREE
      if ((e.message ?? '').includes('unknown revision')) {
        try {
          const emptyTree = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';
          [statOut, nameStatusOut, shortStatOut] = await Promise.all([
            execAsync(`git diff --stat ${emptyTree} ${head}`, { cwd: directory }).then(
              (r) => r.stdout
            ),
            execAsync(`git diff --name-status ${emptyTree} ${head}`, { cwd: directory }).then(
              (r) => r.stdout
            ),
            execAsync(`git diff --shortstat ${emptyTree} ${head}`, { cwd: directory }).then(
              (r) => r.stdout
            ),
          ]);
        } catch {
          throw new Error(`Cannot diff: ${e.message}`);
        }
      } else {
        throw err;
      }
    }

    const files = parseNameStatus(nameStatusOut, statOut);
    const { filesChanged, insertions, deletions } = parseShortStat(shortStatOut);

    const result: DiffSummary = {
      base,
      head,
      filesChanged,
      insertions,
      deletions,
      files,
    };

    const summary =
      `📊 Diff ${base}..${head}: ${filesChanged} file(s) changed, ` +
      `+${insertions} insertions, -${deletions} deletions`;

    return { summary, data: result };
  } catch (error) {
    return {
      summary: `❌ Diff error: ${error instanceof Error ? error.message : String(error)}`,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Parse git diff --name-status output into file summaries
 * Format: "M\tpath/to/file.ts" or "R100\told.ts\tnew.ts"
 */
function parseNameStatus(nameStatus: string, statOut: string): DiffFileSummary[] {
  const files: DiffFileSummary[] = [];

  // Build insertion/deletion map from --stat output
  // Format: " src/foo.ts | 12 +++---"
  const statMap = new Map<string, { insertions: number; deletions: number }>();
  for (const line of statOut.split('\n')) {
    const match = line.match(/^\s+(.+?)\s+\|\s+\d+\s+([+-]*)/);
    if (match) {
      const filePath = match[1].trim();
      const changes = match[2];
      statMap.set(filePath, {
        insertions: (changes.match(/\+/g) ?? []).length,
        deletions: (changes.match(/-/g) ?? []).length,
      });
    }
  }

  for (const line of nameStatus.split('\n')) {
    if (!line.trim()) continue;
    const parts = line.split('\t');
    const statusCode = parts[0].trim();

    let file = parts[1] ?? '';
    let status: DiffFileSummary['status'] = 'modified';

    if (statusCode.startsWith('A')) status = 'added';
    else if (statusCode.startsWith('D')) status = 'deleted';
    else if (statusCode.startsWith('R')) {
      status = 'renamed';
      file = parts[2] ?? file; // use new name for renames
    } else if (statusCode.startsWith('M')) status = 'modified';

    const stats = statMap.get(file) ?? { insertions: 0, deletions: 0 };
    files.push({ file, status, insertions: stats.insertions, deletions: stats.deletions });
  }

  return files;
}

/**
 * Parse git diff --shortstat: "3 files changed, 42 insertions(+), 12 deletions(-)"
 */
function parseShortStat(shortStat: string): {
  filesChanged: number;
  insertions: number;
  deletions: number;
} {
  const filesMatch = shortStat.match(/(\d+)\s+files?\s+changed/);
  const insertMatch = shortStat.match(/(\d+)\s+insertions?\(\+\)/);
  const deleteMatch = shortStat.match(/(\d+)\s+deletions?\(-\)/);

  return {
    filesChanged: parseInt(filesMatch?.[1] ?? '0', 10),
    insertions: parseInt(insertMatch?.[1] ?? '0', 10),
    deletions: parseInt(deleteMatch?.[1] ?? '0', 10),
  };
}

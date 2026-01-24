// Tool: Initialize changelog infrastructure
import * as path from 'path';
import { createChangelog, createSymlink } from '../utils/file-ops.js';
import { getTodayDate } from '../utils/changelog-parser.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const changelogInitSchema = {
  name: 'changelog_init',
  description: 'Initialize a new CHANGELOG.md file for the project',
  inputSchema: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description:
          'Where to create changelog: "root" (./CHANGELOG.md), "external" (~/dev/tooling/claude-code/contexts/[project]/CHANGELOG.md with symlink), "docs" (./docs/CHANGELOG.md)',
        enum: ['root', 'external', 'docs'],
        default: 'external',
      },
      project_name: {
        type: 'string',
        description: 'Project name (auto-detected from directory if not provided)',
      },
    },
  },
};

export async function changelogInit(args: {
  location?: 'root' | 'external' | 'docs';
  project_name?: string;
}): Promise<{ summary: string; changelogPath: string }> {
  try {
    const cwd = process.cwd();
    const location = args.location || 'external';

    // Get project name
    let projectName = args.project_name;
    if (!projectName) {
      projectName = path.basename(cwd);
    }

    // Get username
    let username = 'user';
    try {
      const { stdout } = await execAsync('whoami');
      username = stdout.trim();
    } catch {
      // Use default
    }

    // Create changelog template
    const template = createChangelogTemplate(projectName, username);

    let changelogPath: string;
    let createdFiles: string[] = [];

    if (location === 'external') {
      // Create external context directory
      const contextDir = path.join(
        process.env.HOME || '~',
        'dev',
        'tooling',
        'claude-code',
        'contexts',
        projectName
      );

      changelogPath = path.join(contextDir, 'CHANGELOG.md');
      const symlinkPath = path.join(cwd, 'CHANGELOG.md');

      // Create changelog in context directory
      await createChangelog(changelogPath, template);
      createdFiles.push(changelogPath);

      // Create symlink
      await createSymlink(changelogPath, symlinkPath);
      createdFiles.push(`${symlinkPath} (symlink)`);

      return {
        summary: [
          '✅ Changelog initialized with external context!',
          '',
          '**Created:**',
          `- ${changelogPath}`,
          `- ${symlinkPath} (symlink)`,
          '',
          '**Structure:**',
          `${contextDir}/`,
          '├── CHANGELOG.md',
          '└── (future: plans/, MASTER-PLAN.md)',
          '',
          '**Next Steps:**',
          '1. Review and customize CHANGELOG.md',
          '2. Use changelog_update to add entries as you work',
          '3. Use changelog_validate to check formatting',
        ].join('\n'),
        changelogPath: symlinkPath,
      };
    } else if (location === 'docs') {
      changelogPath = path.join(cwd, 'docs', 'CHANGELOG.md');
      await createChangelog(changelogPath, template);
      createdFiles.push(changelogPath);
    } else {
      // root
      changelogPath = path.join(cwd, 'CHANGELOG.md');
      await createChangelog(changelogPath, template);
      createdFiles.push(changelogPath);
    }

    return {
      summary: [
        '✅ Changelog initialized!',
        '',
        `**Created**: ${changelogPath}`,
        '',
        '**Next Steps:**',
        '1. Review and customize CHANGELOG.md',
        '2. Use changelog_update to add entries',
        '3. Use changelog_validate to check formatting',
      ].join('\n'),
      changelogPath,
    };
  } catch (error) {
    return {
      summary: `❌ Error initializing changelog: ${error instanceof Error ? error.message : String(error)}`,
      changelogPath: '',
    };
  }
}

/**
 * Create changelog template content
 */
function createChangelogTemplate(projectName: string, username: string): string {
  const today = getTodayDate();

  return `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to date-based versioning.

---

## [Unreleased]

### Planned
- (List any planned features or changes)

---

## [${today}] - Project Initialized

### Added
- Initial project setup
- Changelog infrastructure

---

**Project**: ${projectName}
**Last Updated**: ${today}
**Maintained By**: ${username}
`;
}

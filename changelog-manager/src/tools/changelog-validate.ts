// Tool: Validate changelog format and consistency
import { locateChangelog, readChangelog, isSymlink, resolveSymlink } from '../utils/file-ops.js';
import { validateChangelog, formatValidationReport } from '../utils/changelog-validator.js';
import { isGitRepository, getRecentCommits } from '../utils/git-ops.js';

export const changelogValidateSchema = {
  name: 'changelog_validate',
  description: 'Validate CHANGELOG.md format, consistency, and alignment with git history',
  inputSchema: {
    type: 'object',
    properties: {
      changelog_path: {
        type: 'string',
        description: 'Path to CHANGELOG.md (optional, will auto-detect)',
      },
    },
  },
};

export async function changelogValidate(args: {
  changelog_path?: string;
}): Promise<{ report: string; valid: boolean }> {
  try {
    const cwd = process.cwd();
    
    // Locate changelog
    const changelogPath = args.changelog_path || (await locateChangelog(cwd));
    
    if (!changelogPath) {
      return {
        report: '❌ No CHANGELOG.md found.\n\nRun changelog_init to create one.',
        valid: false,
      };
    }

    // Check if it's a symlink
    const isLink = await isSymlink(changelogPath);
    let realPath = changelogPath;
    if (isLink) {
      realPath = await resolveSymlink(changelogPath);
    }

    // Read and validate
    const content = await readChangelog(changelogPath);
    const validationResult = validateChangelog(content);

    // Generate report
    let report = formatValidationReport(validationResult, changelogPath);

    if (isLink) {
      report += `\n**Note**: File is a symlink to ${realPath}\n`;
    }

    // Check git alignment
    const isGit = await isGitRepository(cwd);
    if (isGit) {
      try {
        const recentCommits = await getRecentCommits('7 days ago', 10, cwd);
        
        if (recentCommits.length > 0) {
          report += `\n### Git Alignment\n\n`;
          report += `Found ${recentCommits.length} commits in the last 7 days.\n`;
          report += `Consider running changelog_update if these changes aren't documented.\n\n`;
          
          report += `Recent commits:\n`;
          for (const commit of recentCommits.slice(0, 5)) {
            report += `- \`${commit.hash.substring(0, 7)}\` - ${commit.message}\n`;
          }
        }
      } catch (error) {
        // Git operations failed, skip alignment check
      }
    }

    return {
      report,
      valid: validationResult.valid,
    };
  } catch (error) {
    return {
      report: `❌ Error validating changelog: ${error instanceof Error ? error.message : String(error)}`,
      valid: false,
    };
  }
}

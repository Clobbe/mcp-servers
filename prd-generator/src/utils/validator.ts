import { parsePRD } from '../../../ralph-workflow/src/utils/prd-parser.js';
import type { ParsedPRD } from '../../../ralph-workflow/src/utils/types.js';
import type {
  ValidationResult,
  ValidationIssue,
  PRDStatistics,
  CompatibilityCheck,
} from './types.js';

/**
 * Validate PRD structure and content
 */
export function validatePRD(content: string, checkCompatibility = true): ValidationResult {
  const issues: ValidationIssue[] = [];
  let parsed: ParsedPRD | null = null;
  let parsedSuccessfully = false;

  // Try to parse with ralph-workflow parser
  try {
    parsed = parsePRD(content);
    parsedSuccessfully = true;
  } catch (error) {
    issues.push({
      severity: 'error',
      section: 'Structure',
      message: 'Failed to parse PRD markdown',
      suggestion: 'Check markdown syntax and structure',
    });
  }

  // Title validation
  if (!parsed?.title || parsed.title === 'Untitled Project') {
    issues.push({
      severity: 'error',
      section: 'Title',
      message: 'title is required',
      suggestion: 'Add a title with H1 heading: # Your Project Name',
    });
  }

  // Description validation
  if (parsed && (!parsed.description || parsed.description.trim().length === 0)) {
    issues.push({
      severity: 'warning',
      section: 'Description',
      message: 'description section missing',
      suggestion: 'Add ## Description or ## Overview section',
    });
  }

  // Features validation
  if (!parsed?.features || parsed.features.length === 0) {
    issues.push({
      severity: 'error',
      section: 'Features',
      message: 'at least one feature is required',
      suggestion: 'Add ## Features section with feature list',
    });
  } else if (parsed.features.length === 1) {
    issues.push({
      severity: 'info',
      section: 'Features',
      message: 'only 1 feature defined',
      suggestion: 'Consider adding more features for a complete PRD',
    });
  }

  // Requirements validation
  if (!parsed?.requirements || parsed.requirements.length === 0) {
    issues.push({
      severity: 'info',
      section: 'Requirements',
      message: 'no requirements specified',
      suggestion: 'Consider adding ## Requirements section',
    });
  }

  // Technical details validation
  if (!parsed?.technicalDetails || parsed.technicalDetails.trim().length === 0) {
    issues.push({
      severity: 'info',
      section: 'Technical Details',
      message: 'limited technology information',
      suggestion: 'Add ## Technical Details section with technologies',
    });
  }

  // Calculate statistics
  const wordCount = content.split(/\s+/).filter((word) => word.length > 0).length;
  const sectionCount = (content.match(/^##\s/gm) || []).length;

  // Calculate quality score (0-100)
  let score = 100;
  issues.forEach((issue) => {
    if (issue.severity === 'error') score -= 30;
    if (issue.severity === 'warning') score -= 15;
    if (issue.severity === 'info') score -= 5;
  });
  score = Math.max(0, score);

  // Detect technologies from technical details
  const detectedTechnologies: string[] = [];
  if (parsed?.technicalDetails) {
    const techMatch = parsed.technicalDetails.match(
      /\b(TypeScript|JavaScript|Python|Go|Rust|Java|React|Next\.js|Vue|Angular|Express|Fastify|Django|Flask|FastAPI|PostgreSQL|MySQL|MongoDB|Redis|SQLite|Docker|Kubernetes|AWS|GCP|Azure|Vercel|Netlify|Firebase)\b/gi
    );
    if (techMatch) {
      detectedTechnologies.push(...new Set(techMatch.map((t) => t.toLowerCase())));
    }
  }

  return {
    isValid: issues.filter((i) => i.severity === 'error').length === 0,
    score,
    issues,
    statistics: {
      sectionCount,
      featureCount: parsed?.features?.length || 0,
      requirementCount: parsed?.requirements?.length || 0,
      wordCount,
    },
    compatibility: {
      ralphWorkflow: parsedSuccessfully && checkCompatibility,
      parsedSuccessfully,
      detectedTechnologies,
    },
  };
}

/**
 * Format validation result as markdown with colors/emoji
 */
export function formatValidationMarkdown(result: ValidationResult): string {
  let markdown = '';

  // Overall status
  markdown += '# PRD Validation Report\n\n';
  const statusEmoji = result.isValid ? '✅' : '❌';
  const statusText = result.isValid ? 'Valid' : 'Invalid';
  if (result.issues.filter((i) => i.severity === 'warning').length > 0 && result.isValid) {
    markdown += `**Overall Status**: ⚠️ Valid with warnings\n`;
  } else {
    markdown += `**Overall Status**: ${statusEmoji} ${statusText}\n`;
  }
  markdown += `**Quality Score**: ${result.score}/100\n\n`;

  // Issues section
  markdown += '## Issues Found\n\n';

  const errors = result.issues.filter((i) => i.severity === 'error');
  const warnings = result.issues.filter((i) => i.severity === 'warning');
  const info = result.issues.filter((i) => i.severity === 'info');

  // Errors
  markdown += `### ❌ Errors (${errors.length})\n`;
  if (errors.length === 0) {
    markdown += 'No errors found.\n';
  } else {
    errors.forEach((issue) => {
      markdown += `- **${issue.section}**: ${issue.message}\n`;
      if (issue.suggestion) {
        markdown += `  - *Suggestion*: ${issue.suggestion}\n`;
      }
    });
  }
  markdown += '\n';

  // Warnings
  markdown += `### ⚠️ Warnings (${warnings.length})\n`;
  if (warnings.length === 0) {
    markdown += 'No warnings found.\n';
  } else {
    warnings.forEach((issue) => {
      markdown += `- **${issue.section}**: ${issue.message}\n`;
      if (issue.suggestion) {
        markdown += `  - *Suggestion*: ${issue.suggestion}\n`;
      }
    });
  }
  markdown += '\n';

  // Info
  markdown += `### ℹ️ Info (${info.length})\n`;
  if (info.length === 0) {
    markdown += 'No additional information.\n';
  } else {
    info.forEach((issue) => {
      markdown += `- **${issue.section}**: ${issue.message}\n`;
      if (issue.suggestion) {
        markdown += `  - *Suggestion*: ${issue.suggestion}\n`;
      }
    });
  }
  markdown += '\n';

  // Statistics
  markdown += '## Statistics\n\n';
  markdown += `- **Sections**: ${result.statistics.sectionCount}\n`;
  markdown += `- **Features**: ${result.statistics.featureCount}\n`;
  markdown += `- **Requirements**: ${result.statistics.requirementCount}\n`;
  markdown += `- **Word Count**: ${result.statistics.wordCount}\n\n`;

  // Compatibility check
  markdown += '## Compatibility Check\n\n';
  const ralphEmoji = result.compatibility.ralphWorkflow ? '✅' : '❌';
  const parseEmoji = result.compatibility.parsedSuccessfully ? '✅' : '❌';
  markdown += `${ralphEmoji} Ralph-workflow compatible\n`;
  markdown += `${parseEmoji} Parsed successfully\n`;
  if (result.compatibility.detectedTechnologies.length > 0) {
    markdown += `✅ Detected technologies: ${result.compatibility.detectedTechnologies.join(', ')}\n`;
  }

  return markdown;
}

/**
 * Format validation result as JSON
 */
export function formatValidationJSON(result: ValidationResult): string {
  return JSON.stringify(
    {
      success: true,
      validation: result,
    },
    null,
    2
  );
}

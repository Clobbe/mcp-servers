import type { PRDInput, PRDOutput } from './types.js';

/**
 * Build PRD in markdown format
 */
export function buildPRDMarkdown(input: PRDInput): string {
  let markdown = '';

  // Title (H1)
  markdown += `# ${input.title}\n\n`;

  // Description section
  markdown += `## Description\n\n${input.description}\n\n`;

  // Features section
  markdown += `## Features\n\n`;
  input.features.forEach((feature) => {
    const priorityText = feature.priority ? ` (${feature.priority} priority)` : '';
    markdown += `- **${feature.name}**: ${feature.description}${priorityText}\n`;
  });
  markdown += '\n';

  // Requirements section (optional)
  if (input.requirements && input.requirements.length > 0) {
    markdown += `## Requirements\n\n`;
    input.requirements.forEach((req) => {
      const priorityText = req.priority ? ` (${req.priority})` : '';
      markdown += `- ${req.description}${priorityText}\n`;
    });
    markdown += '\n';
  }

  // Technical Details section (optional)
  if (input.technicalDetails) {
    markdown += `## Technical Details\n\n`;

    const { languages, frameworks, databases, infrastructure } = input.technicalDetails;

    if (languages && languages.length > 0) {
      markdown += `Built with ${languages.join(', ')}.\n`;
    }
    if (frameworks && frameworks.length > 0) {
      markdown += `Using ${frameworks.join(', ')} framework(s).\n`;
    }
    if (databases && databases.length > 0) {
      markdown += `Database: ${databases.join(', ')}.\n`;
    }
    if (infrastructure && infrastructure.length > 0) {
      markdown += `Infrastructure: ${infrastructure.join(', ')}.\n`;
    }
  }

  return markdown;
}

/**
 * Build PRD in JSON format
 */
export function buildPRDJSON(input: PRDInput): string {
  const output = {
    title: input.title,
    description: input.description,
    features: input.features,
    requirements: input.requirements || [],
    technicalDetails: input.technicalDetails || {},
  };

  return JSON.stringify(output, null, 2);
}

/**
 * Build PRD with the specified output format
 */
export function buildPRD(input: PRDInput): PRDOutput {
  const format = input.output_format || 'markdown';
  const content = format === 'json' ? buildPRDJSON(input) : buildPRDMarkdown(input);

  return {
    content,
    format,
    metadata: {
      generatedAt: new Date().toISOString(),
      wordCount: content.split(/\s+/).length,
      featureCount: input.features.length,
      requirementCount: input.requirements?.length || 0,
    },
  };
}

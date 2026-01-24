import { detectTechnology } from '../utils/tech-detector.js';
import { parsePRD } from '../utils/prd-parser.js';
import { generateWorkflow } from '../utils/task-generator.js';
import type { Workflow } from '../utils/types.js';

export const ralphFromPrdSchema = {
  name: 'ralph_from_prd',
  description: 'Generate automated workflow from Product Requirements Document (PRD)',
  inputSchema: {
    type: 'object',
    properties: {
      prd_content: {
        type: 'string',
        description: 'PRD content in markdown format',
      },
      output_format: {
        type: 'string',
        enum: ['markdown', 'json'],
        description: 'Output format for the workflow',
        default: 'markdown',
      },
    },
    required: ['prd_content'],
  },
};

export async function ralphFromPrd(args: {
  prd_content: string;
  output_format?: 'markdown' | 'json';
}): Promise<{ summary: string; data?: unknown }> {
  try {
    // Parse PRD
    const prd = parsePRD(args.prd_content);

    // Detect technology stack
    const tech = detectTechnology(args.prd_content);

    // Generate workflow
    const workflow = generateWorkflow(prd, tech);

    // Format output
    const output =
      args.output_format === 'json'
        ? JSON.stringify(workflow, null, 2)
        : formatWorkflowAsMarkdown(workflow);

    return {
      summary: `✅ Generated workflow for "${prd.title}" with ${workflow.phases.length} phases`,
      data: { workflow: output, metadata: workflow.metadata },
    };
  } catch (error) {
    return {
      summary: `❌ Error generating workflow: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

function formatWorkflowAsMarkdown(workflow: Workflow): string {
  let md = `# ${workflow.metadata.projectName} - Implementation Workflow\n\n`;
  md += `**Generated**: ${new Date(workflow.metadata.generatedAt).toLocaleString()}\n\n`;

  md += `## Technology Stack\n\n`;
  md += `- **Languages**: ${workflow.metadata.technologyStack.languages.join(', ') || 'Not specified'}\n`;
  md += `- **Frameworks**: ${workflow.metadata.technologyStack.frameworks.join(', ') || 'None'}\n`;
  md += `- **Databases**: ${workflow.metadata.technologyStack.databases.join(', ') || 'None'}\n`;
  md += `- **Infrastructure**: ${workflow.metadata.technologyStack.infrastructure.join(', ') || 'None'}\n\n`;

  for (const phase of workflow.phases) {
    md += `## ${phase.name}\n\n`;
    md += `${phase.description}\n\n`;
    if (phase.estimatedDuration) {
      md += `**Estimated Duration**: ${phase.estimatedDuration}\n\n`;
    }

    for (const task of phase.tasks) {
      md += `### ${task.description}\n\n`;
      if (task.estimatedTime) md += `- **Time**: ${task.estimatedTime}\n`;
      if (task.commands && task.commands.length > 0) {
        md += `- **Commands**:\n`;
        task.commands.forEach((cmd) => (md += `  - \`${cmd}\`\n`));
      }
      if (task.files && task.files.length > 0) {
        md += `- **Files**: ${task.files.join(', ')}\n`;
      }
      if (task.validationSteps && task.validationSteps.length > 0) {
        md += `- **Validation**:\n`;
        task.validationSteps.forEach((step) => (md += `  - ${step}\n`));
      }
      md += '\n';
    }
  }

  return md;
}

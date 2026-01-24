import { getTemplate, getAvailableTemplates } from '../utils/templates.js';
import { buildPRD } from '../utils/prd-builder.js';
import type { TemplateInput, TemplateType, ToolResponse } from '../utils/types.js';

/**
 * Validate template input
 */
function validateInput(args: unknown): { valid: boolean; error?: string; field?: string } {
  const input = args as Partial<TemplateInput>;

  // Check projectName
  if (
    !input.projectName ||
    typeof input.projectName !== 'string' ||
    input.projectName.trim().length === 0
  ) {
    return { valid: false, error: 'projectName is required', field: 'projectName' };
  }

  // Check template
  const availableTemplates = getAvailableTemplates();
  if (!input.template || !availableTemplates.includes(input.template as TemplateType)) {
    return {
      valid: false,
      error: `invalid template. Must be one of: ${availableTemplates.join(', ')}`,
      field: 'template',
    };
  }

  // Validate output format
  if (input.output_format && !['markdown', 'json'].includes(input.output_format)) {
    return {
      valid: false,
      error: "output_format must be 'markdown' or 'json'",
      field: 'output_format',
    };
  }

  return { valid: true };
}

/**
 * Handle prd_from_template tool invocation
 */
export async function handlePRDFromTemplate(
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  // Validate input
  const validation = validateInput(args);
  if (!validation.valid) {
    const errorResponse: ToolResponse = {
      success: false,
      error: validation.error,
      field: validation.field,
    };
    return {
      content: [{ type: 'text', text: JSON.stringify(errorResponse) }],
    };
  }

  try {
    const input = args as TemplateInput;
    const templateData = getTemplate(input.template, input.projectName);

    // Apply output format preference
    if (input.output_format) {
      templateData.output_format = input.output_format;
    }

    const output = buildPRD(templateData);

    const response: ToolResponse = {
      success: true,
      content: output.content,
      format: output.format,
      metadata: output.metadata,
    };

    return {
      content: [{ type: 'text', text: JSON.stringify(response) }],
    };
  } catch (error) {
    const errorResponse: ToolResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'unknown error',
    };
    return {
      content: [{ type: 'text', text: JSON.stringify(errorResponse) }],
    };
  }
}

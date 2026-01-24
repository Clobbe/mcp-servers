import { validatePRD, formatValidationMarkdown, formatValidationJSON } from '../utils/validator.js';
import type { ValidationInput, ToolResponse } from '../utils/types.js';

/**
 * Validate input for prd_validate tool
 */
function validateInput(args: unknown): { valid: boolean; error?: string; field?: string } {
  const input = args as Partial<ValidationInput>;

  // Check prd_content
  if (
    !input.prd_content ||
    typeof input.prd_content !== 'string' ||
    input.prd_content.trim().length === 0
  ) {
    return { valid: false, error: 'prd_content is required', field: 'prd_content' };
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
 * Handle prd_validate tool invocation
 */
export async function handlePRDValidate(
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
    const input = args as ValidationInput;
    const checkCompatibility = input.check_compatibility !== false; // Default true
    const outputFormat = input.output_format || 'markdown';

    const validationResult = validatePRD(input.prd_content, checkCompatibility);

    // Format output based on requested format
    let formattedOutput: string;
    if (outputFormat === 'json') {
      formattedOutput = formatValidationJSON(validationResult);
    } else {
      formattedOutput = formatValidationMarkdown(validationResult);
    }

    const response: ToolResponse = {
      success: true,
      content: formattedOutput,
      format: outputFormat,
      validation: validationResult,
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

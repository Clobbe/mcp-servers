import { buildPRD } from '../utils/prd-builder.js';
import type { PRDInput, ToolResponse } from '../utils/types.js';

/**
 * Validate PRD creation input
 */
function validateInput(args: unknown): { valid: boolean; error?: string; field?: string } {
  const input = args as Partial<PRDInput>;

  // Check title
  if (!input.title || typeof input.title !== 'string' || input.title.trim().length === 0) {
    return { valid: false, error: 'title is required', field: 'title' };
  }

  // Check description
  if (
    !input.description ||
    typeof input.description !== 'string' ||
    input.description.trim().length === 0
  ) {
    return { valid: false, error: 'description is required', field: 'description' };
  }

  // Check features array
  if (!input.features || !Array.isArray(input.features) || input.features.length === 0) {
    return { valid: false, error: 'at least one feature is required', field: 'features' };
  }

  // Validate each feature
  for (let i = 0; i < input.features.length; i++) {
    const feature = input.features[i];
    if (!feature.name || typeof feature.name !== 'string') {
      return { valid: false, error: `feature ${i} missing name`, field: `features[${i}].name` };
    }
    if (!feature.description || typeof feature.description !== 'string') {
      return {
        valid: false,
        error: `feature ${i} missing description`,
        field: `features[${i}].description`,
      };
    }
    if (feature.priority && !['high', 'medium', 'low'].includes(feature.priority)) {
      return { valid: false, error: 'invalid priority value', field: `features[${i}].priority` };
    }
  }

  // Validate requirements if present
  if (input.requirements && Array.isArray(input.requirements)) {
    for (let i = 0; i < input.requirements.length; i++) {
      const req = input.requirements[i];
      if (!req.description || typeof req.description !== 'string') {
        return {
          valid: false,
          error: `requirement ${i} missing description`,
          field: `requirements[${i}].description`,
        };
      }
      if (req.priority && !['must', 'should', 'could'].includes(req.priority)) {
        return {
          valid: false,
          error: 'invalid priority value',
          field: `requirements[${i}].priority`,
        };
      }
    }
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
 * Handle prd_create tool invocation
 */
export async function handlePRDCreate(
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
    const input = args as PRDInput;
    const output = buildPRD(input);

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

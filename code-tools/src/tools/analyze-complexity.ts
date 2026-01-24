/**
 * Analyze code complexity tool
 */

import { readFileContent } from '../utils/parser.js';
import { analyzeFunctionComplexity } from '../utils/analyzer.js';
import type { ToolResponse, ComplexityResult } from '../utils/types.js';

export const analyzeComplexitySchema = {
  name: 'code_analyze_complexity',
  description: 'Analyze cyclomatic complexity of code in a file',
  inputSchema: {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: 'Path to the file to analyze',
      },
      threshold: {
        type: 'number',
        description: 'Complexity threshold for warnings (default: 10)',
        default: 10,
      },
    },
    required: ['file_path'],
  },
};

export async function analyzeComplexity(args: {
  file_path: string;
  threshold?: number;
}): Promise<ToolResponse> {
  try {
    const threshold = args.threshold ?? 10;
    const content = await readFileContent(args.file_path);
    const functions = analyzeFunctionComplexity(content, threshold);

    // Calculate statistics
    const totalComplexity = functions.reduce((sum, f) => sum + f.complexity, 0);
    const averageComplexity =
      functions.length > 0 ? Math.round(totalComplexity / functions.length) : 0;
    const highComplexityFunctions = functions.filter((f) => f.exceeds);

    const result: ComplexityResult = {
      filePath: args.file_path,
      totalComplexity,
      functions,
      highComplexityFunctions,
      averageComplexity,
    };

    const summary =
      highComplexityFunctions.length > 0
        ? `⚠️ Found ${functions.length} functions. ${highComplexityFunctions.length} exceed complexity threshold of ${threshold}. Average complexity: ${averageComplexity}`
        : `✅ Analyzed ${functions.length} functions. All within complexity threshold of ${threshold}. Average complexity: ${averageComplexity}`;

    return {
      summary,
      data: result,
    };
  } catch (error) {
    return {
      summary: `❌ Error analyzing complexity: ${error instanceof Error ? error.message : String(error)}`,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

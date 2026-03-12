/**
 * Analyze code complexity tool — supports TypeScript/JavaScript and .NET/C#
 */

import { readFileContent, isDotNet, extractDotNetMethods } from '../utils/parser.js';
import { analyzeFunctionComplexity, calculateDotNetComplexity } from '../utils/analyzer.js';
import type { ToolResponse, ComplexityResult, FunctionComplexity } from '../utils/types.js';

export const analyzeComplexitySchema = {
  name: 'code_analyze_complexity',
  description:
    'Analyze cyclomatic complexity of code in a file. Supports TypeScript/JavaScript and .NET/C#.',
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

    let functions: FunctionComplexity[];

    if (isDotNet(args.file_path)) {
      // Use .NET-aware method extraction and complexity calculation
      const methods = extractDotNetMethods(content);
      const lines = content.split('\n');
      functions = methods.map((m) => {
        // Extract method body (naive brace-matching from method start line)
        const methodLines = lines.slice(m.line - 1);
        const methodBody = extractBlock(methodLines);
        const complexity = calculateDotNetComplexity(methodBody);
        return { name: m.name, line: m.line, complexity, exceeds: complexity > threshold };
      });
    } else {
      functions = analyzeFunctionComplexity(content, threshold);
    }

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

/**
 * Extract a brace-delimited block starting from the first line that contains '{'
 */
function extractBlock(lines: string[]): string {
  const block: string[] = [];
  let braceCount = 0;
  let started = false;

  for (const line of lines) {
    block.push(line);
    for (const ch of line) {
      if (ch === '{') { braceCount++; started = true; }
      else if (ch === '}') { braceCount--; }
    }
    if (started && braceCount === 0) break;
  }

  return block.join('\n');
}

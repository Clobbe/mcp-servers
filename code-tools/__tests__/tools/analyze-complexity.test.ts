import { test, expect } from '@playwright/test';
import { analyzeComplexity } from '../../src/tools/analyze-complexity.js';
import fs from 'fs/promises';
import path from 'path';

test.describe('code_analyze_complexity', () => {
  const testFilesDir = path.join(process.cwd(), '__tests__', 'fixtures');

  // Create test fixtures before tests
  test.beforeAll(async () => {
    await fs.mkdir(testFilesDir, { recursive: true });

    // Create a simple test file
    const simpleCode = `
function simpleFunction() {
  return 42;
}

export function complexFunction(x: number): number {
  if (x > 10) {
    if (x < 20) {
      while (x > 0) {
        x--;
      }
    }
  } else {
    for (let i = 0; i < x; i++) {
      if (i % 2 === 0) {
        x += i;
      }
    }
  }
  return x;
}
`;
    await fs.writeFile(path.join(testFilesDir, 'test-complexity.ts'), simpleCode);
  });

  test.afterAll(async () => {
    // Clean up test files
    await fs.rm(testFilesDir, { recursive: true, force: true });
  });

  test.describe('happy path', () => {
    test('should analyze complexity of valid file', async () => {
      const result = await analyzeComplexity({
        file_path: path.join(testFilesDir, 'test-complexity.ts'),
        threshold: 10,
      });

      expect(result.summary).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.summary).toContain('functions');
    });

    test('should identify high complexity functions', async () => {
      const result = await analyzeComplexity({
        file_path: path.join(testFilesDir, 'test-complexity.ts'),
        threshold: 5,
      });

      expect(result.data).toBeDefined();
      const data = result.data as any;
      expect(data.highComplexityFunctions).toBeDefined();
    });

    test('should calculate average complexity', async () => {
      const result = await analyzeComplexity({
        file_path: path.join(testFilesDir, 'test-complexity.ts'),
        threshold: 10,
      });

      const data = result.data as any;
      expect(data.averageComplexity).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('error handling', () => {
    test('should handle non-existent file', async () => {
      const result = await analyzeComplexity({
        file_path: '/nonexistent/file.ts',
      });

      expect(result.summary).toContain('Error');
      expect(result.error).toBeDefined();
    });

    test('should handle invalid path', async () => {
      const result = await analyzeComplexity({
        file_path: '',
      });

      expect(result.summary).toContain('Error');
    });
  });

  test.describe('threshold handling', () => {
    test('should use default threshold when not provided', async () => {
      const result = await analyzeComplexity({
        file_path: path.join(testFilesDir, 'test-complexity.ts'),
      });

      expect(result.summary).toContain('threshold');
      expect(result.summary).toContain('10');
    });

    test('should use custom threshold', async () => {
      const result = await analyzeComplexity({
        file_path: path.join(testFilesDir, 'test-complexity.ts'),
        threshold: 3,
      });

      expect(result.summary).toContain('threshold');
      expect(result.summary).toContain('3');
    });
  });
});

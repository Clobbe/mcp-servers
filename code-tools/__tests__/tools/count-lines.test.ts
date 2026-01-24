import { test, expect } from '@playwright/test';
import { countLinesTool } from '../../src/tools/count-lines.js';
import fs from 'fs/promises';
import path from 'path';

test.describe('code_count_lines', () => {
  const testFilesDir = path.join(process.cwd(), '__tests__', 'fixtures');

  test.beforeAll(async () => {
    await fs.mkdir(testFilesDir, { recursive: true });

    const codeWithComments = `// This is a comment
function test() {
  // Another comment
  return 42;
}

/* Block comment
   multiple lines
*/

// More comments
const x = 10;
`;
    await fs.writeFile(path.join(testFilesDir, 'test-lines.ts'), codeWithComments);
  });

  test.afterAll(async () => {
    await fs.rm(testFilesDir, { recursive: true, force: true });
  });

  test.describe('happy path', () => {
    test('should count lines in a single file', async () => {
      const result = await countLinesTool({
        path: path.join(testFilesDir, 'test-lines.ts'),
      });

      expect(result.summary).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.summary).toContain('code lines');
    });

    test('should separate code, comments, and blank lines', async () => {
      const result = await countLinesTool({
        path: path.join(testFilesDir, 'test-lines.ts'),
      });

      const data = result.data as any;
      expect(data.codeLines).toBeGreaterThan(0);
      expect(data.commentLines).toBeGreaterThan(0);
      expect(data.blankLines).toBeGreaterThanOrEqual(0);
      expect(data.totalLines).toBe(data.codeLines + data.commentLines + data.blankLines);
    });

    test('should count lines in a directory', async () => {
      const result = await countLinesTool({
        path: testFilesDir,
        include_tests: false,
      });

      expect(result.summary).toContain('files');
      const data = result.data as any;
      expect(data.files).toBeDefined();
      expect(Array.isArray(data.files)).toBe(true);
    });
  });

  test.describe('test file handling', () => {
    test('should exclude test files by default', async () => {
      // Create a test file
      await fs.writeFile(
        path.join(testFilesDir, 'sample.test.ts'),
        'function test() { return 1; }'
      );

      const result = await countLinesTool({
        path: testFilesDir,
        include_tests: false,
      });

      const data = result.data as any;
      const hasTestFile = data.files?.some((f: any) => f.file.includes('.test.ts'));
      expect(hasTestFile).toBe(false);
    });

    test('should include test files when requested', async () => {
      await fs.writeFile(
        path.join(testFilesDir, 'sample.test.ts'),
        'function test() { return 1; }'
      );

      const result = await countLinesTool({
        path: testFilesDir,
        include_tests: true,
      });

      const data = result.data as any;
      expect(data.files.length).toBeGreaterThan(0);
    });
  });

  test.describe('error handling', () => {
    test('should handle non-existent path', async () => {
      const result = await countLinesTool({
        path: '/nonexistent/path',
      });

      expect(result.summary).toContain('Error');
      expect(result.error).toBeDefined();
    });
  });
});

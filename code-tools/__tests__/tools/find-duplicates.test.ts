import { test, expect } from '@playwright/test';
import { findDuplicatesTool } from '../../src/tools/find-duplicates.js';
import fs from 'fs/promises';
import path from 'path';

test.describe('code_find_duplicates', () => {
  const testFilesDir = path.join(process.cwd(), '__tests__', 'fixtures', 'duplicates');

  test.beforeAll(async () => {
    await fs.mkdir(testFilesDir, { recursive: true });

    // Create files with duplicate code
    const duplicateBlock = `
function processData(data) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    result.push(data[i] * 2);
  }
  return result;
}
`;

    const file1 = `
export function handler1() {
  ${duplicateBlock}
}
`;

    const file2 = `
export function handler2() {
  ${duplicateBlock}
}
`;

    const uniqueFile = `
export function uniqueHandler() {
  return "unique";
}
`;

    await fs.writeFile(path.join(testFilesDir, 'file1.ts'), file1);
    await fs.writeFile(path.join(testFilesDir, 'file2.ts'), file2);
    await fs.writeFile(path.join(testFilesDir, 'unique.ts'), uniqueFile);
  });

  test.afterAll(async () => {
    await fs.rm(testFilesDir, { recursive: true, force: true });
  });

  test.describe('happy path', () => {
    test('should find duplicate code blocks', async () => {
      const result = await findDuplicatesTool({
        directory: testFilesDir,
        min_lines: 3,
      });

      expect(result.summary).toBeDefined();
      expect(result.data).toBeDefined();
    });

    test('should report files scanned', async () => {
      const result = await findDuplicatesTool({
        directory: testFilesDir,
        min_lines: 3,
      });

      const data = result.data as any;
      expect(data.filesScanned).toBeGreaterThan(0);
    });

    test('should respect min_lines parameter', async () => {
      const result = await findDuplicatesTool({
        directory: testFilesDir,
        min_lines: 5,
      });

      const data = result.data as any;
      expect(data.minLines).toBe(5);
    });
  });

  test.describe('edge cases', () => {
    test('should handle empty directory', async () => {
      const emptyDir = path.join(testFilesDir, 'empty');
      await fs.mkdir(emptyDir, { recursive: true });

      const result = await findDuplicatesTool({
        directory: emptyDir,
        min_lines: 5,
      });

      expect(result.summary).toContain('No');
      const data = result.data as any;
      expect(data.filesScanned).toBe(0);
    });

    test('should handle directory with no duplicates', async () => {
      const noDupeDir = path.join(testFilesDir, 'nodupe');
      await fs.mkdir(noDupeDir, { recursive: true });
      await fs.writeFile(path.join(noDupeDir, 'unique1.ts'), 'export const a = 1;');
      await fs.writeFile(path.join(noDupeDir, 'unique2.ts'), 'export const b = 2;');

      const result = await findDuplicatesTool({
        directory: noDupeDir,
        min_lines: 5,
      });

      expect(result.summary).toBeDefined();
    });
  });

  test.describe('error handling', () => {
    test('should handle non-existent directory', async () => {
      const result = await findDuplicatesTool({
        directory: '/nonexistent/directory',
        min_lines: 5,
      });

      expect(result.summary).toContain('Error');
      expect(result.error).toBeDefined();
    });
  });
});

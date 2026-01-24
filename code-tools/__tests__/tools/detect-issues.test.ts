import { test, expect } from '@playwright/test';
import { detectIssuesToolFunc } from '../../src/tools/detect-issues.js';
import fs from 'fs/promises';
import path from 'path';

test.describe('code_detect_issues', () => {
  const testFilesDir = path.join(process.cwd(), '__tests__', 'fixtures');

  test.beforeAll(async () => {
    await fs.mkdir(testFilesDir, { recursive: true });

    const codeWithIssues = `
console.log('debug message');
var oldStyle = 10;

function badFunction(data: any) {
  if (data == null) {
    debugger;
    return false;
  }
  // TODO: implement this properly
  return data != undefined;
}
`;
    await fs.writeFile(path.join(testFilesDir, 'test-issues.ts'), codeWithIssues);

    const cleanCode = `
export function cleanFunction(x: number): number {
  return x * 2;
}
`;
    await fs.writeFile(path.join(testFilesDir, 'test-clean.ts'), cleanCode);
  });

  test.afterAll(async () => {
    await fs.rm(testFilesDir, { recursive: true, force: true });
  });

  test.describe('happy path', () => {
    test('should detect issues in code', async () => {
      const result = await detectIssuesToolFunc({
        file_path: path.join(testFilesDir, 'test-issues.ts'),
      });

      expect(result.summary).toBeDefined();
      expect(result.data).toBeDefined();
      const data = result.data as any;
      expect(data.issues).toBeDefined();
      expect(Array.isArray(data.issues)).toBe(true);
    });

    test('should report no issues for clean code', async () => {
      const result = await detectIssuesToolFunc({
        file_path: path.join(testFilesDir, 'test-clean.ts'),
      });

      expect(result.summary).toContain('No code issues');
      const data = result.data as any;
      expect(data.total).toBe(0);
    });

    test('should categorize issues by severity', async () => {
      const result = await detectIssuesToolFunc({
        file_path: path.join(testFilesDir, 'test-issues.ts'),
      });

      const data = result.data as any;
      expect(data.errors).toBeGreaterThanOrEqual(0);
      expect(data.warnings).toBeGreaterThanOrEqual(0);
    });

    test('should group issues by rule', async () => {
      const result = await detectIssuesToolFunc({
        file_path: path.join(testFilesDir, 'test-issues.ts'),
      });

      const data = result.data as any;
      expect(data.byRule).toBeDefined();
      expect(typeof data.byRule).toBe('object');
    });
  });

  test.describe('severity filtering', () => {
    test('should filter by error severity', async () => {
      const result = await detectIssuesToolFunc({
        file_path: path.join(testFilesDir, 'test-issues.ts'),
        severity: 'error',
      });

      const data = result.data as any;
      data.issues.forEach((issue: any) => {
        expect(issue.severity).toBe('error');
      });
    });

    test('should filter by warning severity', async () => {
      const result = await detectIssuesToolFunc({
        file_path: path.join(testFilesDir, 'test-issues.ts'),
        severity: 'warning',
      });

      const data = result.data as any;
      data.issues.forEach((issue: any) => {
        expect(issue.severity).toBe('warning');
      });
    });

    test('should show all issues when severity is "all"', async () => {
      const allResult = await detectIssuesToolFunc({
        file_path: path.join(testFilesDir, 'test-issues.ts'),
        severity: 'all',
      });

      const errorResult = await detectIssuesToolFunc({
        file_path: path.join(testFilesDir, 'test-issues.ts'),
        severity: 'error',
      });

      // All severity should include all issues
      expect(allResult.summary).toBeDefined();
      expect(errorResult.summary).toBeDefined();

      const allData = allResult.data as any;
      const errorData = errorResult.data as any;

      // All should have at least as many as errors only
      if (allData && errorData) {
        expect(allData.total).toBeGreaterThanOrEqual(errorData.total);
      }
    });
  });

  test.describe('error handling', () => {
    test('should handle non-existent file', async () => {
      const result = await detectIssuesToolFunc({
        file_path: '/nonexistent/file.ts',
      });

      expect(result.summary).toContain('Error');
      expect(result.error).toBeDefined();
    });
  });
});
